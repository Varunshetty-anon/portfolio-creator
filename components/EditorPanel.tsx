import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { PortfolioData, Project, Testimonial } from '../types';
import { Input, TextArea } from './ui/Input';
import { Button } from './ui/Button';
import { ToolSelector } from './ToolSelector';
import { Plus, Trash2, Video, Wand2, Image as ImageIcon, ChevronDown, ChevronUp, Upload, X, LayoutDashboard, Copy, ExternalLink, FileVideo, User, MessageSquare, Loader2, CheckCircle2, Globe, Crop, Settings, LogOut, AlertCircle, Share2, Eye, EyeOff, Cloud, Link, Sparkles, Wrench, ZoomIn, ZoomOut, QrCode, Download, AlertTriangle } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { getCroppedImg, generateThumbnailFromVideo, encodeState, uploadFileToStorage, isConfigured, hasCloudStorage, generateAiBio, generateAiDescription, checkPortfolioReadiness, downloadQrCode } from '../utils';

interface EditorPanelProps {
  data: PortfolioData;
  onChange: (newData: PortfolioData) => void;
  onPublish: () => void;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  onLogout?: () => void;
  onPreview?: () => void;
}

const isValidUrl = (string: string) => {
  if (!string) return false;
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

const SocialInput = ({ 
    label, 
    value, 
    onChange, 
    placeholder,
    platformDomain 
}: { 
    label: string, 
    value: string, 
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, 
    placeholder?: string,
    platformDomain?: string
}) => {
    const isUrl = value.startsWith('http');
    const isValid = value.length > 0 && (isUrl ? isValidUrl(value) : value.length > 2);
    
    return (
        <div className="relative group">
            <Input 
                label={label} 
                value={value} 
                onChange={onChange} 
                placeholder={placeholder}
                className={`pr-10 transition-colors ${value && isValid ? 'border-green-500/50 focus:border-green-500' : ''} ${value && !isValid ? 'border-red-500/50 focus:border-red-500' : ''}`}
            />
            {value && (
                <div className="absolute right-3 top-[2.1rem] transition-all duration-300">
                    {isValid ? (
                        <CheckCircle2 size={18} className="text-green-500 animate-in fade-in zoom-in" />
                    ) : (
                        <AlertCircle size={18} className="text-red-500 animate-in fade-in zoom-in" />
                    )}
                </div>
            )}
        </div>
    );
}

export const EditorPanel: React.FC<EditorPanelProps> = ({ data, onChange, onPublish, isSaving, hasUnsavedChanges, onLogout, onPreview }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile' | 'content' | 'testimonials' | 'tools' | 'settings'>('dashboard');
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [uploadingState, setUploadingState] = useState<{id: string, progress: number} | null>(null);
  const [showreelUploading, setShowreelUploading] = useState<{progress: number} | null>(null);
  const [showreelInputMethod, setShowreelInputMethod] = useState<'upload' | 'link'>(data.showreelLink.startsWith('blob:') ? 'upload' : 'link');
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [generatingDescId, setGeneratingDescId] = useState<string | null>(null);
  const [profileImageUploading, setProfileImageUploading] = useState(false);
  const [showQr, setShowQr] = useState(false);
  
  // Crop State
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [tempImgSrc, setTempImgSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const updateField = (field: keyof PortfolioData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const updateSocials = (field: keyof typeof data.socials, value: string) => {
    onChange({ ...data, socials: { ...data.socials, [field]: value } });
  };

  const updateAvailability = (status: boolean) => {
     const newData = { 
         ...data, 
         availability: { ...data.availability, status } 
     };
     onChange(newData);
     setTimeout(onPublish, 100);
  };

  const handleAiBio = async () => {
      setIsGeneratingBio(true);
      const bio = await generateAiBio(data.role || "Creative", data.skills || []);
      updateField('bio', bio);
      setIsGeneratingBio(false);
  };

  const handleAiDescription = async (projectId: string, title: string, currentDesc: string) => {
      setGeneratingDescId(projectId);
      const newDesc = await generateAiDescription(title, currentDesc);
      updateProject(projectId, { description: newDesc });
      setGeneratingDescId(null);
  };

  const getShareLink = () => {
     const origin = window.location.origin === 'null' || !window.location.origin ? 'https://cinefolio.app' : window.location.origin;
     return `${origin}/#${data.username}`;
  };

  const getQrUrl = () => {
      return `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(getShareLink())}&format=png`;
  }

  const copyLink = () => {
    try {
      navigator.clipboard.writeText(getShareLink());
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (e) {
      alert('Could not access clipboard.');
    }
  };

  const openLink = () => window.open(getShareLink(), '_blank');

  const addProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      title: "New Project",
      description: "Short description about the work...",
      thumbnail: `https://picsum.photos/600/800?random=${Date.now()}`,
      link: "",
      category: "Work",
      aspectRatio: "16:9",
      type: 'video'
    };
    updateField('projects', [...data.projects, newProject]);
    setExpandedProject(newProject.id);
  };

  const removeProject = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Delete this project?")) {
        updateField('projects', data.projects.filter(p => p.id !== id));
        if (expandedProject === id) setExpandedProject(null);
    }
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    updateField('projects', data.projects.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const addTestimonial = () => {
      const newTestimonial: Testimonial = {
          id: Date.now().toString(),
          name: "Client Name",
          role: "Role / Company",
          quote: "Describe the experience working with you..."
      };
      updateField('testimonials', [...data.testimonials, newTestimonial]);
  };

  const removeTestimonial = (id: string) => {
      if(window.confirm("Delete this endorsement?")) {
          updateField('testimonials', data.testimonials.filter(t => t.id !== id));
      }
  };

  const updateTestimonial = (id: string, field: keyof Testimonial, value: string) => {
      updateField('testimonials', data.testimonials.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const handleFileUpload = (accept: string, callback: (file: File) => void) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) callback(file);
    };
    input.click();
  };

  const handleProfileImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
        setTempImgSrc(reader.result?.toString() || null);
        setCropModalOpen(true);
    });
    reader.readAsDataURL(file);
  };

  const saveCroppedImage = async () => {
      if (!tempImgSrc || !croppedAreaPixels) return;
      try {
          setProfileImageUploading(true);
          const croppedBlob = await getCroppedImg(tempImgSrc, croppedAreaPixels);
          const file = new File([croppedBlob], "profile_cropped.jpg", { type: "image/jpeg" });
          
          if (hasCloudStorage) {
             const url = await uploadFileToStorage(file, `users/${data.uid || 'guest'}/profile/${Date.now()}.jpg`);
             onChange({ ...data, profileImage: url, profileImageBlob: undefined });
          } else {
             const url = URL.createObjectURL(croppedBlob);
             onChange({ ...data, profileImage: url, profileImageBlob: file });
          }
          
          setCropModalOpen(false);
          setTempImgSrc(null);
          setProfileImageUploading(false);
      } catch (e) {
          console.error(e);
          setProfileImageUploading(false);
      }
  };

  const handleShowreelVideoUpload = async (file: File) => {
    setShowreelUploading({ progress: 1 });
    if (hasCloudStorage) {
        try {
            const downloadUrl = await uploadFileToStorage(
                file, 
                `users/${data.uid || 'guest'}/showreels/${Date.now()}_${file.name}`, 
                (progress) => setShowreelUploading({ progress })
            );
            onChange({ ...data, showreelLink: downloadUrl, showreelBlob: undefined });
            setShowreelUploading(null);
        } catch (e) {
            console.error(e);
            setShowreelUploading(null);
        }
    }
  };

  const handleProjectVideoUpload = async (id: string, file: File) => {
    setUploadingState({ id, progress: 1 });
    
    // Detect Aspect Ratio
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = URL.createObjectURL(file);
    let detectedAspectRatio: '16:9' | '9:16' = '16:9';
    video.onloadedmetadata = () => {
        if (video.videoHeight > video.videoWidth) detectedAspectRatio = '9:16';
    };

    let generatedThumb: { url: string, blob: Blob } | null = null;
    try { generatedThumb = await generateThumbnailFromVideo(file); } catch (e) {}

    if (hasCloudStorage) {
        try {
            const downloadUrl = await uploadFileToStorage(
                file, 
                `users/${data.uid || 'guest'}/projects/${id}/${Date.now()}_${file.name}`,
                (progress) => setUploadingState({ id, progress })
            );

            const updates: Partial<Project> = { 
                link: downloadUrl, 
                customVideoBlob: undefined, 
                aspectRatio: detectedAspectRatio
            };
            
            if (generatedThumb) {
                const thumbUrl = await uploadFileToStorage(
                    new File([generatedThumb.blob], "thumb.jpg", { type: "image/jpeg" }), 
                    `users/${data.uid || 'guest'}/projects/${id}/thumb_${Date.now()}.jpg`
                );
                updates.thumbnail = thumbUrl;
                updates.thumbnailBlob = undefined;
            }

            updateProject(id, updates);
            setUploadingState(null);
        } catch (e) {
            console.error(e);
            setUploadingState(null);
        }
    }
  };

  const handleThumbnailUpload = async (id: string, file: File) => {
      // Upload directly
      if (hasCloudStorage) {
         try {
            const url = await uploadFileToStorage(file, `users/${data.uid || 'guest'}/projects/${id}/custom_thumb_${Date.now()}.jpg`);
            updateProject(id, { thumbnail: url, thumbnailBlob: undefined });
         } catch(e) {
             console.error(e);
         }
      } else {
         updateProject(id, { thumbnail: URL.createObjectURL(file), thumbnailBlob: file });
      }
  }

  const { isReady, missing } = checkPortfolioReadiness(data);

  return (
    <div className="h-full flex flex-col bg-zinc-950 border-r border-zinc-900 relative">
      
      {cropModalOpen && tempImgSrc && createPortal(
          <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-200">
              <div className="relative flex-1 bg-zinc-900 w-full h-full overflow-hidden">
                 <Cropper
                    image={tempImgSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    onCropChange={setCrop}
                    onCropComplete={(_, px) => setCroppedAreaPixels(px)}
                    onZoomChange={setZoom}
                    objectFit="contain"
                 />
              </div>
              <div className="p-6 bg-zinc-950 border-t border-zinc-800 flex flex-col gap-6 safe-area-pb">
                 <div className="flex items-center gap-4 px-2">
                     <ZoomOut size={16} className="text-zinc-500"/>
                     <input 
                        type="range" 
                        min={1} 
                        max={3} 
                        step={0.1} 
                        value={zoom} 
                        onChange={(e) => setZoom(Number(e.target.value))} 
                        className="flex-1 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
                     />
                     <ZoomIn size={16} className="text-zinc-500"/>
                 </div>
                 <div className="flex gap-3">
                     <Button variant="secondary" className="flex-1 py-3" onClick={() => { setCropModalOpen(false); setTempImgSrc(null); setZoom(1); }}>Cancel</Button>
                     <Button variant="primary" className="flex-1 py-3" onClick={saveCroppedImage} icon={profileImageUploading ? <Loader2 className="animate-spin" size={14}/> : <Crop size={14}/>}>
                        {profileImageUploading ? 'Uploading...' : 'Save & Upload'}
                     </Button>
                 </div>
              </div>
          </div>,
          document.body
      )}

      {showQr && createPortal(
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in" onClick={() => setShowQr(false)}>
              <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 max-w-sm w-full" onClick={e => e.stopPropagation()}>
                  <div className="bg-black p-4 rounded-xl">
                    <img 
                        src={getQrUrl()} 
                        alt="Portfolio QR" 
                        className="w-48 h-48"
                    />
                  </div>
                  <div className="text-center">
                      <h3 className="text-black font-bold text-lg mb-1">Scan to View</h3>
                      <p className="text-zinc-500 text-xs break-all">{getShareLink()}</p>
                  </div>
                  <Button 
                    onClick={() => downloadQrCode(getQrUrl(), `${data.username}-portfolio-qr.png`)} 
                    className="w-full" 
                    icon={<Download size={16}/>}
                  >
                      Download QR
                  </Button>
                  <Button variant="secondary" onClick={() => setShowQr(false)} className="w-full">Close</Button>
              </div>
          </div>,
          document.body
      )}

      {/* Header */}
      <div className="p-6 border-b border-zinc-900 bg-zinc-950 flex justify-between items-center sticky top-0 z-50">
        <div>
          <h2 className="text-xl font-display font-bold text-white mb-1">Frames Studio</h2>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${hasUnsavedChanges ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`}></span>
            <p className="text-xs text-zinc-500">{hasUnsavedChanges ? 'Unsaved' : 'Saved'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
             <Button 
                variant={hasUnsavedChanges ? "primary" : "secondary"} 
                size="sm" 
                onClick={onPublish}
                className="hidden sm:flex"
            >
                {isSaving ? <Loader2 className="animate-spin" size={14}/> : 'Save'}
            </Button>
            
            <div className="relative group">
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onPreview}
                    disabled={!isReady}
                    className={`border-zinc-700 ${!isReady ? 'opacity-50 cursor-not-allowed' : ''}`}
                    icon={<Eye size={16}/>}
                >
                    Preview Portfolio
                </Button>
                {/* Validation Tooltip */}
                {!isReady && (
                    <div className="absolute top-full right-0 mt-2 w-64 bg-zinc-900 border border-red-500/50 rounded-xl p-4 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                        <div className="flex items-center gap-2 text-red-400 font-bold text-xs mb-2">
                            <AlertTriangle size={14}/> Action Required
                        </div>
                        <ul className="text-xs text-zinc-400 space-y-1 list-disc pl-4">
                            {missing.map(m => (
                                <li key={m}>{m}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-900 overflow-x-auto no-scrollbar bg-zinc-950 flex-shrink-0">
        {[
           { id: 'dashboard', icon: LayoutDashboard },
           { id: 'profile', icon: User },
           { id: 'content', icon: Video },
           { id: 'tools', icon: Wrench },
           { id: 'testimonials', icon: MessageSquare },
           { id: 'settings', icon: Settings }
        ].map((tab) => (
           <button 
           key={tab.id}
           onClick={() => setActiveTab(tab.id as any)}
           className={`flex-1 py-4 px-3 text-xs font-medium transition-all flex flex-col items-center gap-1 min-w-[80px] relative ${activeTab === tab.id ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
         >
           <tab.icon size={20} className={activeTab === tab.id ? 'text-indigo-500' : ''}/>
           <span className="capitalize text-xs mt-1">{tab.id === 'settings' ? 'Account' : tab.id}</span>
           {activeTab === tab.id && <span className="absolute bottom-0 left-0 w-full h-[2px] bg-indigo-500"></span>}
         </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-zinc-950">
        <div className="max-w-4xl mx-auto p-6 md:p-12 space-y-12">
        
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn">
             
             {!isReady && (
                 <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 flex flex-col sm:flex-row items-start gap-4">
                     <div className="p-3 bg-red-500/10 rounded-full text-red-500"><AlertTriangle size={24}/></div>
                     <div>
                         <h3 className="text-white font-bold text-lg">Portfolio Incomplete</h3>
                         <p className="text-zinc-400 text-sm mt-1 mb-3">You need to complete your profile before you can preview or share your portfolio.</p>
                         <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                             {missing.map(m => (
                                 <li key={m} className="text-xs text-red-400 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> {m}</li>
                             ))}
                         </ul>
                     </div>
                 </div>
             )}

             <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-white font-bold text-lg flex items-center gap-2"><Share2 size={18}/> Share Your Work</h3>
                    {isReady && <span className="text-xs text-green-500 font-bold bg-green-500/10 px-2 py-1 rounded">Active</span>}
                </div>
                
                <div className="bg-black rounded-lg p-4 border border-zinc-800 flex items-center justify-between gap-4">
                   <div className="flex items-center gap-3 text-zinc-500 overflow-hidden flex-1">
                      <Link size={16} className="flex-shrink-0 text-indigo-500"/>
                      <span className="text-sm font-mono truncate text-zinc-300">{getShareLink()}</span>
                   </div>
                   <Button size="sm" onClick={copyLink} icon={copySuccess ? <CheckCircle2 size={14}/> : <Copy size={14}/>}>
                        {copySuccess ? 'Copied' : 'Copy'}
                    </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button variant="secondary" className="w-full py-4" onClick={openLink} icon={<ExternalLink size={16}/>}>
                        Open in New Tab
                    </Button>
                    <Button variant="outline" className="w-full py-4" onClick={() => setShowQr(true)} icon={<QrCode size={16}/>}>
                        Get QR Code
                    </Button>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-center gap-8 p-6 bg-zinc-900/30 rounded-2xl border border-zinc-800">
                <div className="w-32 h-32 rounded-full bg-zinc-800 overflow-hidden border-2 border-zinc-700 relative group flex-shrink-0">
                  <img src={data.profileImage} alt="Profile" className="w-full h-full object-cover" />
                  {profileImageUploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="animate-spin text-white"/></div>}
                </div>
                <div className="flex-1 text-center sm:text-left space-y-4">
                    <div>
                        <h3 className="text-lg font-bold text-white">Profile Picture</h3>
                        <p className="text-xs text-zinc-500">Recommended: 400x400px (JPG/PNG)</p>
                    </div>
                    <Button variant="secondary" onClick={() => handleFileUpload('image/*', handleProfileImageUpload)} icon={<Upload size={14}/>}>
                        Change Image
                    </Button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800 pb-2">Identity</h3>
                  <Input label="Full Name" value={data.name} onChange={(e) => updateField('name', e.target.value)} />
                  <Input label="Job Title" value={data.role} onChange={(e) => updateField('role', e.target.value)} placeholder="e.g. Video Editor"/>
                  <Input label="Location" value={data.location} onChange={(e) => updateField('location', e.target.value)} placeholder="City, Country"/>
                  <Input label="Languages" value={data.languages} onChange={(e) => updateField('languages', e.target.value)} />
                </div>

                <div className="space-y-4">
                   <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800 pb-2">Bio</h3>
                   <div className="relative h-full">
                     <TextArea label="Introduction" value={data.bio} onChange={(e) => updateField('bio', e.target.value)} rows={8} placeholder="Tell your story..." className="h-full"/>
                     <button onClick={handleAiBio} className="absolute bottom-3 right-3 text-indigo-400 hover:text-indigo-300 transition-colors bg-zinc-900 p-2 rounded-lg border border-indigo-500/30" title="Generate Bio with Gemini">
                         {isGeneratingBio ? <Loader2 size={16} className="animate-spin"/> : <div className="flex items-center gap-1 text-xs font-bold uppercase"><Sparkles size={14} /> AI Generate</div>}
                     </button>
                  </div>
                </div>
            </div>

            <div className="space-y-4 pt-8 border-t border-zinc-900">
              <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4">Social Links</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SocialInput label="Email" value={data.socials.email} onChange={(e) => updateSocials('email', e.target.value)} placeholder="you@example.com"/>
                  <SocialInput label="Instagram" value={data.socials.instagram || ''} onChange={(e) => updateSocials('instagram', e.target.value)} placeholder="instagram.com/username"/>
                  <SocialInput label="LinkedIn" value={data.socials.linkedin || ''} onChange={(e) => updateSocials('linkedin', e.target.value)} placeholder="linkedin.com/in/username"/>
                  <SocialInput label="Twitter / X" value={data.socials.twitter || ''} onChange={(e) => updateSocials('twitter', e.target.value)} placeholder="x.com/username"/>
                  <SocialInput label="YouTube" value={data.socials.youtube || ''} onChange={(e) => updateSocials('youtube', e.target.value)} placeholder="youtube.com/@channel"/>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="space-y-12 animate-fadeIn">
            {/* Showreel */}
            <div className="bg-zinc-900/30 p-6 rounded-2xl border border-zinc-800 space-y-6">
              <div className="flex justify-between items-center">
                   <h3 className="text-lg font-bold text-white flex items-center gap-2"><Video size={20} className="text-indigo-400"/> Showreel</h3>
                   <div className="flex bg-black rounded-lg p-1 border border-zinc-800">
                        <button onClick={() => setShowreelInputMethod('upload')} className={`px-4 py-1.5 text-xs font-bold uppercase rounded-md transition-colors ${showreelInputMethod === 'upload' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>Upload</button>
                        <button onClick={() => setShowreelInputMethod('link')} className={`px-4 py-1.5 text-xs font-bold uppercase rounded-md transition-colors ${showreelInputMethod === 'link' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>Link</button>
                   </div>
              </div>

              {showreelInputMethod === 'upload' ? (
                  showreelUploading ? (
                     <div className="h-48 bg-black/50 border border-zinc-800 rounded-xl flex flex-col items-center justify-center p-4">
                        <Loader2 className="animate-spin mb-4 text-indigo-500" size={32}/>
                        <span className="text-sm text-zinc-400">Uploading Video... {Math.round(showreelUploading.progress)}%</span>
                     </div>
                  ) : (
                     <div className="relative">
                         {data.showreelLink && !data.showreelLink.startsWith('http') && <div className="text-sm text-green-500 mb-3 flex items-center gap-2 font-medium"><CheckCircle2 size={16}/> Showreel Uploaded Successfully</div>}
                         <Button size="lg" className="w-full h-48 border border-dashed border-zinc-700 bg-black/20 hover:bg-black/40 hover:border-zinc-500 transition-all group" variant="ghost" onClick={() => handleFileUpload('video/*', handleShowreelVideoUpload)}>
                            <div className="flex flex-col items-center">
                                <Upload size={32} className="text-zinc-500 group-hover:text-white mb-4 transition-colors"/>
                                <span className="text-sm text-zinc-400 group-hover:text-white font-medium">Click to upload video file (MP4, MOV)</span>
                            </div>
                         </Button>
                     </div>
                  )
              ) : (
                  <Input label="Video URL" value={data.showreelLink} onChange={(e) => updateField('showreelLink', e.target.value)} placeholder="https://..." className="py-3 text-base" />
              )}
            </div>

            <div className="space-y-6">
               <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
                 <h3 className="text-lg font-bold text-white">Project Gallery</h3>
                 <Button variant="secondary" onClick={addProject} icon={<Plus size={16}/>}>Add Project</Button>
               </div>
               
               <div className="grid grid-cols-1 gap-4">
                 {data.projects.map((project) => {
                   const isUploading = uploadingState?.id === project.id;
                   const isExpanded = expandedProject === project.id;
                   
                   return (
                   <div key={project.id} className={`bg-zinc-900/40 border rounded-xl overflow-hidden transition-all ${isExpanded ? 'border-zinc-700 bg-zinc-900 shadow-xl' : 'border-zinc-800 hover:border-zinc-700'}`}>
                     <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setExpandedProject(isExpanded ? null : project.id)}>
                       <div className="flex items-center gap-4">
                         <div className="w-16 h-16 rounded-lg bg-black bg-cover bg-center border border-zinc-800 flex-shrink-0" style={{backgroundImage: `url(${project.thumbnail})`}}></div>
                         <div>
                             <span className="text-base font-bold text-white block">{project.title}</span>
                             <span className="text-xs text-zinc-500 uppercase tracking-wider">{project.category} • {project.type}</span>
                         </div>
                       </div>
                       <div className="flex gap-2">
                           <button onClick={(e) => removeProject(project.id, e)} className="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={18}/></button>
                           <div className={`p-2 text-zinc-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}><ChevronDown size={18}/></div>
                       </div>
                     </div>
                     
                     {isExpanded && (
                       <div className="p-6 border-t border-zinc-800 space-y-6 bg-black/20">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <Input label="Project Title" value={project.title} onChange={(e) => updateProject(project.id, { title: e.target.value })} />
                             <Input label="Category" value={project.category} onChange={(e) => updateProject(project.id, { category: e.target.value })} />
                         </div>
                         
                         <div className="relative">
                            <TextArea label="Description" value={project.description} onChange={(e) => updateProject(project.id, { description: e.target.value })} rows={3} />
                            <button 
                                onClick={() => handleAiDescription(project.id, project.title, project.description)} 
                                className="absolute top-0 right-0 text-indigo-400 hover:text-white text-[10px] uppercase font-bold flex items-center gap-1 bg-indigo-500/10 px-2 py-1 rounded"
                                disabled={generatingDescId === project.id}
                            >
                                {generatingDescId === project.id ? <Loader2 size={10} className="animate-spin"/> : <Wand2 size={10} />}
                                Magic Fix
                            </button>
                         </div>

                         <div className="space-y-2">
                            <label className="text-xs font-medium text-zinc-500 uppercase">Media Type</label>
                            <div className="flex bg-black rounded-lg border border-zinc-800 p-1 w-full md:w-1/2">
                                <button onClick={() => updateProject(project.id, { type: 'video' })} className={`flex-1 text-xs py-2 rounded ${project.type !== 'image' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500'}`}><Video size={14} className="inline mr-2"/>Video</button>
                                <button onClick={() => updateProject(project.id, { type: 'image' })} className={`flex-1 text-xs py-2 rounded ${project.type === 'image' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500'}`}><ImageIcon size={14} className="inline mr-2"/>Image</button>
                            </div>
                         </div>

                         {project.type !== 'image' && (
                             <div className="space-y-2">
                                <label className="text-xs font-medium text-zinc-500 uppercase">Video Source</label>
                                {isUploading ? (
                                    <div className="h-12 bg-zinc-800/50 rounded flex items-center justify-center text-sm text-indigo-400">
                                        <Loader2 className="animate-spin mr-2" size={16}/> Uploading...
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        <div className="flex gap-3">
                                            <Button variant="secondary" onClick={() => handleFileUpload('video/*', (f) => handleProjectVideoUpload(project.id, f))} className="whitespace-nowrap">Upload File</Button>
                                            <Input placeholder="Or paste Google Drive / YouTube URL" value={project.link} onChange={(e) => updateProject(project.id, { link: e.target.value })} className="flex-1"/>
                                        </div>
                                        <p className="text-[10px] text-zinc-600">Supports YouTube, Vimeo, and Google Drive (Public View Link)</p>
                                    </div>
                                )}
                             </div>
                         )}

                         <div className="space-y-2">
                            <label className="text-xs font-medium text-zinc-500 uppercase">{project.type === 'image' ? 'Image File' : 'Custom Thumbnail'}</label>
                            {project.thumbnail && <div className="relative group w-full md:w-1/2 aspect-video rounded-lg overflow-hidden border border-zinc-800 mb-2">
                                <img src={project.thumbnail} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button size="sm" onClick={() => handleFileUpload('image/*', (f) => handleThumbnailUpload(project.id, f))}>Change</Button>
                                </div>
                            </div>}
                            {!project.thumbnail && (
                                <Button size="sm" variant="secondary" onClick={() => handleFileUpload('image/*', (f) => handleThumbnailUpload(project.id, f))} className="w-full md:w-1/2 h-24 border-dashed">
                                    Upload {project.type === 'image' ? 'Image' : 'Thumbnail'}
                                </Button>
                            )}
                         </div>
                       </div>
                     )}
                   </div>
                   );
                 })}
               </div>
            </div>
          </div>
        )}

        {/* --- TOOLS TAB (VISUAL SELECTOR) --- */}
        {activeTab === 'tools' && (
            <div className="space-y-12 animate-fadeIn">
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
                         <div>
                             <h3 className="text-lg font-bold text-white uppercase tracking-wider">Editing Software</h3>
                             <p className="text-sm text-zinc-500">Select the tools you use. Mark your main tool with a star.</p>
                         </div>
                         <span className="text-xs font-mono bg-zinc-900 px-2 py-1 rounded text-zinc-400">{data.tools.length} Selected</span>
                    </div>
                    {/* Primary Tool Reminder */}
                    {!data.primaryTool && data.tools.length > 0 && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 p-4 rounded-xl flex items-center gap-3">
                            <AlertTriangle size={20}/>
                            <p className="text-sm">Please select a <strong>Primary Workflow</strong> by clicking the star icon on your main editing software.</p>
                        </div>
                    )}
                    <ToolSelector 
                        type="editing" 
                        selectedTools={data.tools} 
                        primaryTool={data.primaryTool} 
                        onSelect={(tools) => updateField('tools', tools)}
                        onSetPrimary={(tool) => updateField('primaryTool', tool)}
                        className="grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                    />
                </div>
                
                <div className="w-full h-px bg-zinc-900"></div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
                         <h3 className="text-lg font-bold text-white uppercase tracking-wider">AI Tools</h3>
                         <span className="text-xs font-mono bg-zinc-900 px-2 py-1 rounded text-zinc-400">{data.aiTools.length} Selected</span>
                    </div>
                    <ToolSelector 
                        type="ai" 
                        selectedTools={data.aiTools} 
                        onSelect={(tools) => updateField('aiTools', tools)}
                        className="grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                    />
                </div>
            </div>
        )}

        {activeTab === 'testimonials' && (
            <div className="space-y-6 animate-fadeIn">
                 <div className="flex justify-between items-center mb-4 border-b border-zinc-900 pb-4">
                    <h3 className="text-lg font-bold text-white">Endorsements</h3>
                    <Button variant="secondary" onClick={addTestimonial} icon={<Plus size={16}/>}>Add</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {data.testimonials.map((t) => (
                        <div key={t.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4 relative group">
                            <button onClick={() => removeTestimonial(t.id)} className="absolute top-4 right-4 text-zinc-600 hover:text-red-500 p-1"><Trash2 size={16}/></button>
                            <Input label="Client Name" value={t.name} onChange={e => updateTestimonial(t.id, 'name', e.target.value)} />
                            <Input label="Role" value={t.role} onChange={e => updateTestimonial(t.id, 'role', e.target.value)} />
                            <TextArea label="Quote" value={t.quote} onChange={e => updateTestimonial(t.id, 'quote', e.target.value)} rows={4}/>
                        </div>
                    ))}
                </div>
                {data.testimonials.length === 0 && (
                        <div className="text-center py-24 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
                            <p className="text-zinc-500">No endorsements added yet.</p>
                        </div>
                    )}
            </div>
        )}

        {activeTab === 'settings' && (
           <div className="space-y-8 animate-fadeIn max-w-xl mx-auto">
              <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-8 text-center">
                 <h3 className="text-red-500 font-bold text-lg mb-2">Account Session</h3>
                 <p className="text-zinc-500 text-sm mb-6">Signed in as {data.username}</p>
                 <Button variant="outline" className="w-full border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white py-3" onClick={onLogout} icon={<LogOut size={16}/>}>
                    Log Out
                 </Button>
              </div>
           </div>
        )}
        </div>
      </div>
    </div>
  );
};