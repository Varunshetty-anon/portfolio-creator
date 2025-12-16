import React, { useState, useCallback } from 'react';
import { PortfolioData, Project, Testimonial } from '../types';
import { Input, TextArea } from './ui/Input';
import { Button } from './ui/Button';
import { Plus, Trash2, Video, Wand2, Image, ChevronDown, ChevronUp, Upload, X, LayoutDashboard, Copy, ExternalLink, FileVideo, User, MessageSquare, Loader2, CheckCircle2, Globe, Crop, Smartphone, Monitor, AlertCircle, Settings, LogOut, Shield, Share2, Eye, EyeOff, Cloud, Link, Sparkles, Wrench } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { getCroppedImg, generateThumbnailFromVideo, encodeState, uploadFileToStorage, isConfigured, hasCloudStorage, generateAiBio } from '../utils';

interface EditorPanelProps {
  data: PortfolioData;
  onChange: (newData: PortfolioData) => void;
  onPublish: () => void;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  onLogout?: () => void;
}

// Helper to validate URL
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

export const EditorPanel: React.FC<EditorPanelProps> = ({ data, onChange, onPublish, isSaving, hasUnsavedChanges, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile' | 'content' | 'testimonials' | 'tools' | 'settings'>('dashboard');
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [uploadingState, setUploadingState] = useState<{id: string, progress: number} | null>(null);
  const [showreelUploading, setShowreelUploading] = useState<{progress: number} | null>(null);
  const [activeInputMethod, setActiveInputMethod] = useState<Record<string, 'upload' | 'link'>>({});
  const [showreelInputMethod, setShowreelInputMethod] = useState<'upload' | 'link'>(data.showreelLink.startsWith('blob:') ? 'upload' : 'link');
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [profileImageUploading, setProfileImageUploading] = useState(false);
  
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

  // --- Link Generator ---
  const getShareLink = () => {
     const origin = window.location.origin === 'null' || !window.location.origin ? 'https://cinefolio.app' : window.location.origin;
     if (isConfigured) {
         return `${origin}${window.location.pathname}#${data.username}`;
     }
     return `${origin}${window.location.pathname}#${data.username}`;
  };

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

  // --- Project Helpers ---
  const addProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      title: "New Project",
      description: "Brief description...",
      thumbnail: `https://picsum.photos/600/800?random=${Date.now()}`,
      link: "",
      category: "Work",
      aspectRatio: "16:9",
      type: 'video'
    };
    updateField('projects', [...data.projects, newProject]);
    setExpandedProject(newProject.id);
    setActiveInputMethod(prev => ({ ...prev, [newProject.id]: 'upload' }));
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

  // --- File Upload ---
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
             // Fallback for offline/demo
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
                // Upload thumbnail too
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

  // --- Testimonials ---
  const addTestimonial = () => {
      const newT: Testimonial = {
          id: Date.now().toString(),
          name: "Client Name",
          role: "Director",
          quote: "Working with them was an absolute game changer."
      };
      updateField('testimonials', [...data.testimonials, newT]);
  };

  const removeTestimonial = (id: string) => {
      updateField('testimonials', data.testimonials.filter(t => t.id !== id));
  };

  const updateTestimonial = (id: string, field: keyof Testimonial, val: string) => {
      updateField('testimonials', data.testimonials.map(t => t.id === id ? { ...t, [field]: val } : t));
  };

  return (
    <div className="h-full flex flex-col bg-zinc-950 border-r border-zinc-800 relative">
      
      {/* Crop Modal */}
      {cropModalOpen && tempImgSrc && (
          <div className="absolute inset-0 z-50 bg-black flex flex-col">
              <div className="relative flex-1 bg-zinc-900">
                 <Cropper
                    image={tempImgSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    onCropChange={setCrop}
                    onCropComplete={useCallback((_, px) => setCroppedAreaPixels(px), [])}
                    onZoomChange={setZoom}
                 />
              </div>
              <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex flex-col gap-4">
                 <div className="flex gap-3">
                     <Button variant="secondary" className="flex-1" onClick={() => setCropModalOpen(false)}>Cancel</Button>
                     <Button variant="primary" className="flex-1" onClick={saveCroppedImage} icon={profileImageUploading ? <Loader2 className="animate-spin" size={14}/> : <Crop size={14}/>}>
                        {profileImageUploading ? 'Uploading...' : 'Save & Upload'}
                     </Button>
                 </div>
              </div>
          </div>
      )}

      {/* Header */}
      <div className="p-6 border-b border-zinc-800 bg-zinc-950 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-display font-bold text-white mb-1">Editor</h2>
          <p className="text-xs text-zinc-500">Logged in as {data.username}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 overflow-x-auto no-scrollbar bg-zinc-900/50">
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
           className={`flex-1 py-4 px-3 text-xs font-medium transition-all flex flex-col items-center gap-1 min-w-[70px] ${activeTab === tab.id ? 'bg-zinc-800 text-white border-b-2 border-indigo-500' : 'text-zinc-500 hover:text-zinc-300'}`}
         >
           <tab.icon size={16} />
           <span className="capitalize hidden md:block">{tab.id === 'settings' ? 'Account' : tab.id}</span>
           <span className="capitalize md:hidden">{tab.id === 'testimonials' ? 'Endorse' : (tab.id === 'settings' ? 'Acct' : tab.id)}</span>
         </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-zinc-950">
        
        {/* === DASHBOARD TAB === */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn">
             <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-white font-bold text-sm">Work Availability</h3>
                        <p className="text-xs text-zinc-500">Show on profile</p>
                    </div>
                    <button 
                       onClick={() => updateAvailability(!data.availability.status)}
                       className={`relative w-12 h-6 rounded-full transition-colors ${data.availability.status ? 'bg-green-500' : 'bg-zinc-700'}`}
                    >
                        <span className={`absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${data.availability.status ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                </div>
             </div>

             <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/10 border border-indigo-500/30 rounded-2xl p-6">
                <h3 className="text-white font-bold text-lg mb-2">Portfolio Status</h3>
                <div className="flex items-center gap-2 mb-6">
                   <span className={`w-2 h-2 rounded-full ${hasUnsavedChanges ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
                   <span className="text-sm text-zinc-300">
                      {hasUnsavedChanges ? 'Unsaved Draft' : 'Published & Live'}
                   </span>
                </div>

                <Button onClick={onPublish} className="w-full mb-2" variant={hasUnsavedChanges ? 'primary' : 'secondary'}>
                   {isSaving ? 'Publishing...' : 'Save & Publish'}
                </Button>
             </div>
             
             <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                   <Share2 size={16} className="text-indigo-500"/>
                   <h3 className="text-white font-bold text-sm uppercase tracking-wider">Share Portfolio</h3>
                </div>
                
                <div className="flex flex-col gap-2 bg-black rounded-lg p-3 border border-zinc-800">
                   <div className="flex items-center gap-2 text-zinc-500 mb-1">
                      <Link size={12} />
                      <span className="text-[10px] font-mono truncate text-white">.../#{data.username}</span>
                   </div>

                   <div className="flex items-center gap-2">
                      <Button size="sm" className="w-full text-xs" onClick={copyLink} icon={copySuccess ? <CheckCircle2 size={14}/> : <Copy size={14}/>}>
                         {copySuccess ? 'Copied' : 'Copy Link'}
                      </Button>
                      <Button size="sm" variant="secondary" className="px-3" onClick={openLink}>
                         <ExternalLink size={14} />
                      </Button>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* ... PROFILE TAB ... */}
        {activeTab === 'profile' && (
          <div className="space-y-5 animate-fadeIn">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2"><Image size={14}/> Avatar</h3>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-zinc-800 overflow-hidden border border-zinc-700 relative group">
                  <img src={data.profileImage} alt="Profile" className="w-full h-full object-cover" />
                  {profileImageUploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="animate-spin text-white"/></div>}
                </div>
                <Button size="sm" variant="secondary" onClick={() => handleFileUpload('image/*', handleProfileImageUpload)} icon={<Upload size={14}/>}>
                    Upload
                </Button>
              </div>
            </div>
            
            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <h3 className="text-sm font-bold text-white">Identity</h3>
              <Input label="Full Name" value={data.name} onChange={(e) => updateField('name', e.target.value)} />
              <Input label="Job Title" value={data.role} onChange={(e) => updateField('role', e.target.value)} />
              <div className="relative">
                 <TextArea label="Bio / Intro" value={data.bio} onChange={(e) => updateField('bio', e.target.value)} rows={4} />
                 <button onClick={handleAiBio} className="absolute bottom-3 right-3 text-indigo-400 hover:text-white transition-colors" title="Generate with AI">
                     {isGeneratingBio ? <Loader2 size={16} className="animate-spin"/> : <Sparkles size={16} />}
                 </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Location" value={data.location} onChange={(e) => updateField('location', e.target.value)} />
                <Input label="Languages" value={data.languages} onChange={(e) => updateField('languages', e.target.value)} />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <h3 className="text-sm font-bold text-white">Socials</h3>
              <SocialInput label="Email" value={data.socials.email} onChange={(e) => updateSocials('email', e.target.value)} placeholder="you@example.com"/>
              <SocialInput label="Instagram" value={data.socials.instagram || ''} onChange={(e) => updateSocials('instagram', e.target.value)} placeholder="https://instagram.com/username"/>
              <SocialInput label="LinkedIn" value={data.socials.linkedin || ''} onChange={(e) => updateSocials('linkedin', e.target.value)} placeholder="https://linkedin.com/in/username"/>
              <SocialInput label="Twitter / X" value={data.socials.twitter || ''} onChange={(e) => updateSocials('twitter', e.target.value)} placeholder="https://x.com/username"/>
              <SocialInput label="YouTube" value={data.socials.youtube || ''} onChange={(e) => updateSocials('youtube', e.target.value)} placeholder="https://youtube.com/@channel"/>
            </div>
          </div>
        )}

        {/* ... CONTENT TAB ... */}
        {activeTab === 'content' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Showreel */}
            <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2"><Video size={14} className="text-purple-400"/> Showreel</h3>
              
              <div className="flex p-1 bg-zinc-900 rounded-lg mb-2">
                 <button onClick={() => setShowreelInputMethod('upload')} className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${showreelInputMethod === 'upload' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>Upload</button>
                 <button onClick={() => setShowreelInputMethod('link')} className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${showreelInputMethod === 'link' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>Link</button>
              </div>

              {showreelInputMethod === 'upload' ? (
                  showreelUploading ? (
                     <div className="h-24 bg-zinc-900 border border-zinc-800 rounded-lg flex flex-col items-center justify-center p-4">
                        <Loader2 className="animate-spin mb-2" />
                        <span className="text-xs">Uploading...</span>
                     </div>
                  ) : (
                     <Button size="sm" className="w-full h-24 border-2 border-dashed border-zinc-700 bg-zinc-900/50 hover:bg-zinc-900" variant="ghost" onClick={() => handleFileUpload('video/*', handleShowreelVideoUpload)}>
                        <Upload size={24} className="text-zinc-400 mb-2"/>
                        <span className="text-xs">Select Video</span>
                     </Button>
                  )
              ) : (
                  <Input label="Link" value={data.showreelLink} onChange={(e) => updateField('showreelLink', e.target.value)} />
              )}
            </div>

            {/* Projects */}
            <div className="space-y-3">
               <div className="flex justify-between items-center">
                 <h3 className="text-sm font-bold text-white">Works</h3>
                 <Button size="sm" variant="secondary" onClick={addProject} icon={<Plus size={14}/>}>Add</Button>
               </div>
               
               <div className="space-y-3">
                 {data.projects.map((project) => {
                   const isUploading = uploadingState?.id === project.id;
                   return (
                   <div key={project.id} className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                     <div className="flex items-center justify-between p-3 hover:bg-zinc-800 cursor-pointer" onClick={() => setExpandedProject(expandedProject === project.id ? null : project.id)}>
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded bg-zinc-800 bg-cover bg-center" style={{backgroundImage: `url(${project.thumbnail})`}}></div>
                         <span className="text-sm font-medium text-white">{project.title}</span>
                       </div>
                       <div className="flex gap-2">
                           <button onClick={(e) => removeProject(project.id, e)} className="p-1 hover:text-red-500"><Trash2 size={16}/></button>
                           {expandedProject === project.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                       </div>
                     </div>
                     
                     {expandedProject === project.id && (
                       <div className="p-4 border-t border-zinc-800 space-y-4 bg-zinc-950">
                         <Input label="Title" value={project.title} onChange={(e) => updateProject(project.id, { title: e.target.value })} />
                         
                         <div className="grid grid-cols-2 gap-3">
                            <Input label="Category" value={project.category} onChange={(e) => updateProject(project.id, { category: e.target.value })} />
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-zinc-500 uppercase">Type</label>
                                <div className="flex bg-zinc-900 rounded border border-zinc-800 p-1">
                                    <button onClick={() => updateProject(project.id, { type: 'video' })} className={`flex-1 text-xs py-1 rounded ${project.type !== 'image' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>Video</button>
                                    <button onClick={() => updateProject(project.id, { type: 'image' })} className={`flex-1 text-xs py-1 rounded ${project.type === 'image' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>Image</button>
                                </div>
                            </div>
                         </div>

                         {project.type !== 'image' && (
                             <div className="space-y-2">
                                <label className="text-xs font-medium text-zinc-500 uppercase">Video Source</label>
                                {isUploading ? (
                                    <div className="text-xs text-center py-4">Uploading...</div>
                                ) : (
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="secondary" onClick={() => handleFileUpload('video/*', (f) => handleProjectVideoUpload(project.id, f))} className="flex-1">Upload File</Button>
                                        <Input placeholder="Or paste URL" value={project.link} onChange={(e) => updateProject(project.id, { link: e.target.value })} className="flex-[2]"/>
                                    </div>
                                )}
                             </div>
                         )}

                         <div className="space-y-2">
                            <label className="text-xs font-medium text-zinc-500 uppercase">{project.type === 'image' ? 'Image Upload' : 'Thumbnail'}</label>
                            {project.thumbnail && <img src={project.thumbnail} className="w-full aspect-video object-cover rounded mb-2" />}
                            <Button size="sm" variant="secondary" onClick={() => handleFileUpload('image/*', (f) => handleThumbnailUpload(project.id, f))} className="w-full">
                                {project.type === 'image' ? 'Upload Image' : 'Change Thumbnail'}
                            </Button>
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

        {/* ... TOOLS TAB ... */}
        {activeTab === 'tools' && (
            <div className="space-y-6 animate-fadeIn">
                <div className="space-y-4">
                    <Input label="Primary Workflow Tool" value={data.primaryTool} onChange={e => updateField('primaryTool', e.target.value)} placeholder="e.g. DaVinci Resolve"/>
                    <p className="text-xs text-zinc-500">This will be highlighted in your portfolio header.</p>
                </div>
                
                <div className="space-y-2 pt-4 border-t border-zinc-800">
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Other Tools (Comma separated)</label>
                    <TextArea 
                        rows={3}
                        value={data.tools.join(', ')} 
                        onChange={e => updateField('tools', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} 
                        placeholder="Premiere Pro, After Effects, Photoshop..."
                    />
                </div>

                <div className="space-y-2 pt-4 border-t border-zinc-800">
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">AI Tools (Comma separated)</label>
                    <TextArea 
                        rows={2}
                        value={data.aiTools.join(', ')} 
                        onChange={e => updateField('aiTools', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} 
                        placeholder="Midjourney, RunwayML..."
                    />
                </div>
            </div>
        )}

        {/* ... TESTIMONIALS TAB ... */}
        {activeTab === 'testimonials' && (
            <div className="space-y-6 animate-fadeIn">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-white">Endorsements</h3>
                    <Button size="sm" variant="secondary" onClick={addTestimonial} icon={<Plus size={14}/>}>Add</Button>
                </div>

                <div className="space-y-4">
                    {data.testimonials.map((t) => (
                        <div key={t.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3 relative group">
                            <button onClick={() => removeTestimonial(t.id)} className="absolute top-2 right-2 text-zinc-600 hover:text-red-500 p-1"><Trash2 size={14}/></button>
                            <Input label="Client Name" value={t.name} onChange={e => updateTestimonial(t.id, 'name', e.target.value)} />
                            <Input label="Role" value={t.role} onChange={e => updateTestimonial(t.id, 'role', e.target.value)} />
                            <TextArea label="Quote" value={t.quote} onChange={e => updateTestimonial(t.id, 'quote', e.target.value)} rows={3}/>
                        </div>
                    ))}
                    {data.testimonials.length === 0 && (
                        <div className="text-center py-8 border border-dashed border-zinc-800 rounded-xl">
                            <p className="text-zinc-500 text-xs">No endorsements yet.</p>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* === SETTINGS TAB === */}
        {activeTab === 'settings' && (
           <div className="space-y-8 animate-fadeIn">
              <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
                 <h3 className="text-red-500 font-bold text-sm mb-2">Session</h3>
                 <Button variant="outline" className="w-full border-red-500/30 text-red-500" onClick={onLogout} icon={<LogOut size={16}/>}>
                    Log Out
                 </Button>
              </div>
           </div>
        )}

      </div>
    </div>
  );
};