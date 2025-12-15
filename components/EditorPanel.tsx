import React, { useState, useCallback } from 'react';
import { PortfolioData, Project, Testimonial } from '../types';
import { Input, TextArea } from './ui/Input';
import { Button } from './ui/Button';
import { Plus, Trash2, Video, Wand2, Image, Link, ChevronDown, ChevronUp, Upload, X, LayoutDashboard, Copy, ExternalLink, FileVideo, User, MessageSquare, Loader2, CheckCircle2, Globe, Crop, Smartphone, Monitor, AlertCircle, ToggleRight, ToggleLeft, Settings, LogOut, Shield, Share2 } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { getCroppedImg, generateThumbnailFromVideo, encodeState } from '../utils';

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

const TagInput = ({ label, items, onChange }: { label: string, items: string[], onChange: (items: string[]) => void }) => {
    const [input, setInput] = useState('');

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTag();
        }
    };

    const addTag = () => {
        const trimmed = input.trim();
        if (trimmed && !items.includes(trimmed)) {
            onChange([...items, trimmed]);
            setInput('');
        }
    };

    const removeTag = (index: number) => {
        onChange(items.filter((_, i) => i !== index));
    };

    return (
        <div className="w-full space-y-2">
            <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider">{label}</label>
            <div className="flex flex-wrap gap-2 mb-2">
                {items.map((item, i) => (
                    <div key={i} className="flex items-center gap-1 bg-zinc-800 text-zinc-200 text-xs px-2 py-1 rounded-md border border-zinc-700">
                        <span>{item}</span>
                        <button onClick={() => removeTag(i)} className="hover:text-red-400"><X size={12}/></button>
                    </div>
                ))}
            </div>
            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={input} 
                    onChange={e => setInput(e.target.value)} 
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    placeholder="Type and press Enter..."
                />
                <Button size="sm" variant="secondary" onClick={addTag} icon={<Plus size={14}/>}>Add</Button>
            </div>
        </div>
    );
}

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

  // Delete Confirmation State
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);

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
         availability: { 
             ...data.availability, 
             status 
         } 
     };
     onChange(newData);
     setTimeout(() => {
        onPublish();
     }, 100);
  };

  const updateAvailabilityLink = (link: string) => {
      onChange({ 
          ...data, 
          availability: { 
              ...data.availability, 
              link 
          } 
      });
  };
  
  const updateSettings = (field: 'username' | 'password', value: string) => {
     onChange({
        ...data,
        settings: {
           ...data.settings,
           [field]: value
        }
     });
  };

  // --- Link Generator ---
  const getEncodedLink = () => {
     try {
        const encoded = encodeState(data);
        const origin = window.location.origin === 'null' || !window.location.origin ? 'https://cinefolio.app' : window.location.origin;
        return `${origin}${window.location.pathname}#varunshetty-portfolio?data=${encoded}`;
     } catch (e) {
        return '';
     }
  };

  const copyLink = () => {
    try {
      const link = getEncodedLink();
      navigator.clipboard.writeText(link);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (e) {
      console.warn('Clipboard write failed', e);
      alert('Could not access clipboard.');
    }
  };

  const openLink = () => {
      const link = getEncodedLink();
      window.open(link, '_blank');
  }

  // --- Project Helpers ---
  const addProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      title: "New Project",
      description: "Brief description...",
      thumbnail: `https://picsum.photos/600/800?random=${Date.now()}`,
      link: "",
      category: "Edit",
      aspectRatio: "16:9"
    };
    updateField('projects', [...data.projects, newProject]);
    setExpandedProject(newProject.id);
    setActiveInputMethod(prev => ({ ...prev, [newProject.id]: 'upload' }));
  };

  // Trigger modal
  const requestDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDeleteConfirmation(id);
  };

  // Actual deletion logic
  const confirmDelete = () => {
    if (deleteConfirmation) {
        const updatedProjects = data.projects.filter(p => p.id !== deleteConfirmation);
        // Explicitly update parent state
        onChange({ ...data, projects: updatedProjects });
        
        if (expandedProject === deleteConfirmation) {
            setExpandedProject(null);
        }
        setDeleteConfirmation(null);
    }
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    const newProjects = data.projects.map(p => 
      p.id === id ? { ...p, ...updates } : p
    );
    updateField('projects', newProjects);
  };

  const toggleInputMethod = (projectId: string, method: 'upload' | 'link') => {
      setActiveInputMethod(prev => ({ ...prev, [projectId]: method }));
  };

  // --- Testimonial Helpers ---
  const addTestimonial = () => {
    const newTestimonial: Testimonial = {
      id: Date.now().toString(),
      name: "Client Name",
      role: "Role",
      quote: "Great work..."
    };
    updateField('testimonials', [...data.testimonials, newTestimonial]);
  };

  const removeTestimonial = (id: string) => {
    updateField('testimonials', data.testimonials.filter(t => t.id !== id));
  };

  const updateTestimonial = (id: string, field: keyof Testimonial, value: string) => {
    const newTestimonials = data.testimonials.map(t => 
      t.id === id ? { ...t, [field]: value } : t
    );
    updateField('testimonials', newTestimonials);
  };

  // --- File Upload ---
  const handleFileUpload = (accept: string, callback: (file: File) => void) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        callback(file);
      }
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

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const saveCroppedImage = async () => {
      if (!tempImgSrc || !croppedAreaPixels) return;
      try {
          const croppedBlob = await getCroppedImg(tempImgSrc, croppedAreaPixels);
          const url = URL.createObjectURL(croppedBlob);
          const file = new File([croppedBlob], "profile_cropped.jpg", { type: "image/jpeg" });
          onChange({ ...data, profileImage: url, profileImageBlob: file });
          setCropModalOpen(false);
          setTempImgSrc(null);
      } catch (e) {
          console.error(e);
      }
  };

  const handleShowreelThumbUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    onChange({ ...data, showreelThumbnail: url, showreelThumbnailBlob: file });
  };

  const handleShowreelVideoUpload = (file: File) => {
    setShowreelUploading({ progress: 0 });
    let progress = 0;
    const interval = setInterval(() => {
        progress += 5;
        setShowreelUploading({ progress });
        if (progress >= 100) {
            clearInterval(interval);
            const url = URL.createObjectURL(file);
            onChange({ ...data, showreelLink: url, showreelBlob: file });
            setTimeout(() => setShowreelUploading(null), 500);
        }
    }, 50);
  };

  const handleProjectThumbUpload = (id: string, file: File) => {
    const url = URL.createObjectURL(file);
    updateProject(id, { thumbnail: url, thumbnailBlob: file });
  };

  const handleProjectVideoUpload = async (id: string, file: File) => {
    setUploadingState({ id, progress: 10 });
    
    // Attempt to detect aspect ratio from video metadata
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = URL.createObjectURL(file);
    let detectedAspectRatio: '16:9' | '9:16' = '16:9';
    
    video.onloadedmetadata = () => {
        if (video.videoHeight > video.videoWidth) {
            detectedAspectRatio = '9:16';
        }
    };

    // Start generating thumbnail
    let generatedThumb: { url: string, blob: Blob } | null = null;
    try {
        generatedThumb = await generateThumbnailFromVideo(file);
    } catch (e) {
        console.warn("Thumbnail generation skipped:", e);
    }

    // Simulate upload progress
    let progress = 30;
    const interval = setInterval(() => {
      progress += 10;
      setUploadingState({ id, progress });
      
      if (progress >= 100) {
        clearInterval(interval);
        const url = URL.createObjectURL(file);
        
        const updates: Partial<Project> = { 
            link: url, 
            customVideoBlob: file,
            aspectRatio: detectedAspectRatio
        };
        
        // Auto-set thumbnail if generated
        if (generatedThumb) {
            updates.thumbnail = generatedThumb.url;
            updates.thumbnailBlob = generatedThumb.blob;
        }

        updateProject(id, updates);
        setTimeout(() => setUploadingState(null), 500);
      }
    }, 100);
  };

  return (
    <div className="h-full flex flex-col bg-zinc-950 border-r border-zinc-800 relative">
      
      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-2xl w-full max-w-sm space-y-4 animate-in zoom-in-95 duration-200">
                <div className="flex flex-col gap-2">
                    <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                        <AlertCircle className="text-red-500" size={20} />
                        Delete Project?
                    </h3>
                    <p className="text-sm text-zinc-400">
                        Are you sure you want to remove this project? This action cannot be undone.
                    </p>
                </div>
                <div className="flex gap-3 pt-2">
                    <Button variant="secondary" className="flex-1" onClick={() => setDeleteConfirmation(null)}>Cancel</Button>
                    <Button 
                        variant="primary" 
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white border-none" 
                        onClick={confirmDelete}
                    >
                        Yes, Delete
                    </Button>
                </div>
            </div>
        </div>
      )}

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
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                 />
              </div>
              <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex flex-col gap-4">
                 <div className="flex items-center gap-2 px-2">
                    <span className="text-xs text-zinc-500 font-medium">Zoom</span>
                    <input 
                       type="range"
                       min={1}
                       max={3}
                       step={0.1}
                       value={zoom}
                       onChange={(e) => setZoom(Number(e.target.value))}
                       className="w-full h-1 bg-zinc-800 rounded-full appearance-none accent-indigo-500"
                    />
                 </div>
                 <div className="flex gap-3">
                     <Button variant="secondary" className="flex-1" onClick={() => setCropModalOpen(false)}>Cancel</Button>
                     <Button variant="primary" className="flex-1" onClick={saveCroppedImage} icon={<Crop size={14}/>}>Save Crop</Button>
                 </div>
              </div>
          </div>
      )}

      {/* Header */}
      <div className="p-6 border-b border-zinc-800 bg-zinc-950 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-display font-bold text-white mb-1">Frames Studio</h2>
          <p className="text-xs text-zinc-500">v1.2.0 • Pro Account</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 overflow-x-auto no-scrollbar bg-zinc-900/50">
        {[
           { id: 'dashboard', icon: LayoutDashboard },
           { id: 'profile', icon: User },
           { id: 'content', icon: Video },
           { id: 'testimonials', icon: MessageSquare },
           { id: 'tools', icon: Wand2 },
           { id: 'settings', icon: Settings }
        ].map((tab) => (
           <button 
           key={tab.id}
           onClick={() => setActiveTab(tab.id as any)}
           className={`flex-1 py-4 px-3 text-xs font-medium transition-all flex flex-col items-center gap-1 ${activeTab === tab.id ? 'bg-zinc-800 text-white border-b-2 border-indigo-500' : 'text-zinc-500 hover:text-zinc-300'}`}
         >
           <tab.icon size={16} />
           <span className="capitalize">{tab.id === 'settings' ? 'Account' : tab.id}</span>
         </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-zinc-950">
        
        {/* === DASHBOARD TAB === */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn">
             {/* Availability Toggle */}
             <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-white font-bold text-sm">Work Availability</h3>
                        <p className="text-xs text-zinc-500">Status shown on your profile</p>
                    </div>
                    <button 
                       onClick={() => updateAvailability(!data.availability.status)}
                       className={`relative w-12 h-6 rounded-full transition-colors duration-200 ease-in-out ${data.availability.status ? 'bg-green-500' : 'bg-zinc-700'}`}
                    >
                        <span className={`absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 shadow-md ${data.availability.status ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                </div>

                {!data.availability.status && (
                    <div className="space-y-3 pt-4 border-t border-zinc-800 animate-in fade-in slide-in-from-top-2">
                        <Input 
                            label="Current Project Link (Optional)"
                            placeholder="https://..."
                            value={data.availability.link || ''}
                            onChange={(e) => updateAvailabilityLink(e.target.value)}
                        />
                        <p className="text-[10px] text-zinc-500">Visitors will see "Currently Working" and can click this link.</p>
                    </div>
                )}
             </div>

             <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/10 border border-indigo-500/30 rounded-2xl p-6">
                <h3 className="text-white font-bold text-lg mb-2">Portfolio Status</h3>
                <div className="flex items-center gap-2 mb-6">
                   <span className={`w-2 h-2 rounded-full ${hasUnsavedChanges ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
                   <span className="text-sm text-zinc-300">
                      {hasUnsavedChanges ? 'Unsaved Draft' : 'Published & Live'}
                   </span>
                </div>

                <Button 
                   onClick={onPublish} 
                   className="w-full mb-2" 
                   variant={hasUnsavedChanges ? 'primary' : 'secondary'}
                >
                   {isSaving ? 'Publishing...' : 'Save & Publish Changes'}
                </Button>
                {hasUnsavedChanges && <p className="text-xs text-center text-zinc-500 mt-2">You have unsaved edits.</p>}
             </div>
             
             {/* Link generator */}
             <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                   <Share2 size={16} className="text-indigo-500"/>
                   <h3 className="text-white font-bold text-sm uppercase tracking-wider">Share Portfolio</h3>
                </div>
                
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                   <strong>Note:</strong> Since this is a serverless environment, this unique link contains all your portfolio data. It may be long, but it ensures your changes are visible to others without a backend database.
                </p>

                <div className="flex flex-col gap-2 bg-black rounded-lg p-3 border border-zinc-800">
                   {/* Simulated Short Link for Aesthetics */}
                   <div className="flex items-center gap-2 text-zinc-500 mb-1">
                      <Globe size={12} />
                      <span className="text-[10px] font-mono">cinefolio.app/varunshetty-portfolio</span>
                   </div>

                   <div className="flex items-center gap-2">
                      <Button size="sm" className="w-full text-xs" onClick={copyLink} icon={copySuccess ? <CheckCircle2 size={14}/> : <Copy size={14}/>}>
                         {copySuccess ? 'Copied to Clipboard' : 'Copy Shareable Link'}
                      </Button>
                      <Button size="sm" variant="secondary" className="px-3" onClick={openLink}>
                         <ExternalLink size={14} />
                      </Button>
                   </div>
                   <p className="text-[10px] text-zinc-600 text-center mt-1">
                      (Copies full data link for sharing)
                   </p>
                </div>
                
                <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3">
                   <p className="text-[10px] text-yellow-500/80">
                      <AlertCircle size={10} className="inline mr-1"/>
                      Local images/videos (uploads) cannot be shared via link. For public sharing, please use external URLs for your media.
                   </p>
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
                </div>
                <div className="flex flex-col gap-2">
                    <Button size="sm" variant="secondary" onClick={() => handleFileUpload('image/*', handleProfileImageUpload)} icon={<Upload size={14}/>}>
                        Upload & Crop
                    </Button>
                </div>
              </div>
              <p className="text-[10px] text-zinc-500">Recommended: Square aspect ratio (1:1)</p>
            </div>
            
            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <h3 className="text-sm font-bold text-white">Identity</h3>
              <Input label="Full Name" value={data.name} onChange={(e) => updateField('name', e.target.value)} />
              <Input label="Job Title" value={data.role} onChange={(e) => updateField('role', e.target.value)} />
              <TextArea label="Bio / Intro" value={data.bio} onChange={(e) => updateField('bio', e.target.value)} rows={4} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Base Location" value={data.location} onChange={(e) => updateField('location', e.target.value)} />
                <Input label="Languages" value={data.languages} onChange={(e) => updateField('languages', e.target.value)} />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <h3 className="text-sm font-bold text-white">Socials</h3>
              <p className="text-[10px] text-zinc-500 mb-2">Links will only appear on your portfolio if verified as valid.</p>
              
              <SocialInput 
                label="Email" 
                value={data.socials.email} 
                onChange={(e) => updateSocials('email', e.target.value)} 
                placeholder="you@example.com"
              />
              <SocialInput 
                label="Instagram" 
                value={data.socials.instagram || ''} 
                onChange={(e) => updateSocials('instagram', e.target.value)} 
                placeholder="https://instagram.com/username"
                platformDomain="instagram.com"
              />
              <SocialInput 
                label="Twitter / X" 
                value={data.socials.twitter || ''} 
                onChange={(e) => updateSocials('twitter', e.target.value)} 
                placeholder="https://x.com/username"
                platformDomain="x.com"
              />
              <SocialInput 
                label="YouTube" 
                value={data.socials.youtube || ''} 
                onChange={(e) => updateSocials('youtube', e.target.value)} 
                placeholder="https://youtube.com/@channel"
                platformDomain="youtube.com"
              />
              <SocialInput 
                label="LinkedIn" 
                value={data.socials.linkedin || ''} 
                onChange={(e) => updateSocials('linkedin', e.target.value)} 
                placeholder="https://linkedin.com/in/username"
                platformDomain="linkedin.com"
              />
            </div>
          </div>
        )}

        {/* ... CONTENT TAB ... */}
        {activeTab === 'content' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Showreel (unchanged) */}
            <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2"><Video size={14} className="text-purple-400"/> Featured Showreel</h3>
              
              <div className="flex p-1 bg-zinc-900 rounded-lg mb-2">
                 <button 
                    onClick={() => setShowreelInputMethod('upload')}
                    className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${showreelInputMethod === 'upload' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                 >
                    Upload File
                 </button>
                 <button 
                    onClick={() => setShowreelInputMethod('link')}
                    className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${showreelInputMethod === 'link' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                 >
                    External URL
                 </button>
              </div>

              {showreelInputMethod === 'upload' ? (
                  showreelUploading ? (
                     <div className="h-24 bg-zinc-900 border border-zinc-800 rounded-lg flex flex-col items-center justify-center p-4">
                        <div className="w-full flex justify-between text-xs text-zinc-400 mb-2">
                           <span>Uploading...</span>
                           <span>{showreelUploading.progress}%</span>
                        </div>
                        <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                           <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${showreelUploading.progress}%` }}></div>
                        </div>
                     </div>
                  ) : (
                      data.showreelLink.startsWith('blob:') ? (
                         <div className="bg-zinc-800 rounded-lg p-3 border border-zinc-700 flex items-center justify-between group">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="p-2 bg-zinc-900 rounded">
                                    <FileVideo size={20} className="text-indigo-400"/>
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                    <span className="text-xs font-medium text-white truncate">Local File</span>
                                    <span className="text-[10px] text-zinc-500 truncate">{data.showreelLink}</span>
                                </div>
                            </div>
                            <Button size="sm" variant="ghost" className="text-zinc-400 hover:text-red-400 p-1" onClick={() => updateField('showreelLink', '')}>
                                <Trash2 size={16}/>
                            </Button>
                         </div>
                      ) : (
                         <Button size="sm" className="w-full h-24 border-2 border-dashed border-zinc-700 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-500 flex flex-col gap-2" variant="ghost" onClick={() => handleFileUpload('video/*', handleShowreelVideoUpload)}>
                            <Upload size={24} className="text-zinc-400"/>
                            <div className="flex flex-col items-center">
                                <span className="text-xs font-medium text-zinc-300">Choose Video File</span>
                                <span className="text-[10px] text-zinc-500">MP4, MOV (Local DB)</span>
                            </div>
                         </Button>
                      )
                  )
              ) : (
                  <Input label="Video Link" value={data.showreelLink.startsWith('blob:') ? '' : data.showreelLink} onChange={(e) => updateField('showreelLink', e.target.value)} placeholder="https://youtube.com/..." />
              )}
              
              <div className="space-y-2">
                 <label className="text-xs font-medium text-zinc-500 uppercase">Poster Frame</label>
                 <div className="flex items-center gap-3">
                    <div className="w-20 h-12 bg-zinc-900 rounded border border-zinc-800 overflow-hidden">
                       <img src={data.showreelThumbnail} className="w-full h-full object-cover" />
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => handleFileUpload('image/*', handleShowreelThumbUpload)}>Change</Button>
                 </div>
              </div>
            </div>

            {/* Projects */}
            <div className="space-y-3">
               <div className="flex justify-between items-center">
                 <h3 className="text-sm font-bold text-white">Selected Works</h3>
                 <Button size="sm" variant="secondary" onClick={addProject} icon={<Plus size={14}/>}>Add</Button>
               </div>
               
               <div className="space-y-3">
                 {data.projects.map((project, idx) => {
                   const isUploading = uploadingState?.id === project.id;
                   const uploadProgress = uploadingState?.progress || 0;
                   const currentInputMethod = activeInputMethod[project.id] || (project.link && !project.link.startsWith('blob:') ? 'link' : 'upload');

                   return (
                   <div key={project.id} className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden animate-in slide-in-from-top-2 duration-300">
                     <div className="flex items-center justify-between p-3 hover:bg-zinc-800 transition-colors group relative">
                       <div 
                           className="flex items-center gap-3 overflow-hidden flex-1 cursor-pointer mr-2"
                           onClick={() => setExpandedProject(expandedProject === project.id ? null : project.id)}
                       >
                         <div className="w-10 h-10 rounded bg-zinc-800 flex-shrink-0 bg-cover bg-center" style={{backgroundImage: `url(${project.thumbnail})`}}></div>
                         <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-medium truncate text-white">{project.title}</span>
                            <span className="text-xs text-zinc-500 truncate">{project.category}</span>
                         </div>
                       </div>
                       
                       <div className="flex items-center gap-1 relative z-20">
                         <button 
                            type="button"
                            onClick={(e) => requestDelete(project.id, e)} 
                            className="w-8 h-8 flex items-center justify-center bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-500 transition-colors rounded-full z-20"
                            title="Delete Project"
                         >
                            <Trash2 size={16} />
                         </button>
                         <button 
                             type="button"
                             className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-colors rounded-full cursor-pointer"
                             onClick={() => setExpandedProject(expandedProject === project.id ? null : project.id)}
                         >
                            {expandedProject === project.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                         </button>
                       </div>
                     </div>
                     
                     {expandedProject === project.id && (
                       <div className="p-4 border-t border-zinc-800 space-y-4 bg-zinc-950">
                         <Input label="Title" value={project.title} onChange={(e) => updateProject(project.id, { title: e.target.value })} />
                         
                         <div className="grid grid-cols-2 gap-3">
                            <Input label="Category" value={project.category} onChange={(e) => updateProject(project.id, { category: e.target.value })} />
                            
                            {/* Aspect Ratio Toggle */}
                            <div className="w-full">
                                <label className="block text-xs font-medium text-zinc-500 mb-1 uppercase tracking-wider">Format</label>
                                <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-1">
                                    <button 
                                      onClick={() => updateProject(project.id, { aspectRatio: '16:9' })}
                                      className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-[10px] font-medium transition-colors ${!project.aspectRatio || project.aspectRatio === '16:9' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                                      title="Landscape 16:9"
                                    >
                                        <Monitor size={12}/> Landscape
                                    </button>
                                    <button 
                                      onClick={() => updateProject(project.id, { aspectRatio: '9:16' })}
                                      className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-[10px] font-medium transition-colors ${project.aspectRatio === '9:16' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                                      title="Portrait 9:16"
                                    >
                                        <Smartphone size={12}/> Vertical
                                    </button>
                                </div>
                            </div>
                         </div>

                         <TextArea label="Description" value={project.description || ''} onChange={(e) => updateProject(project.id, { description: e.target.value })} rows={2} />
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                               <label className="text-xs font-medium text-zinc-500 uppercase">Thumbnail</label>
                               <div className="flex flex-col gap-2">
                                  {project.thumbnail && <img src={project.thumbnail} className="w-full aspect-video object-cover rounded border border-zinc-800 bg-black" />}
                                  <div className="flex gap-2">
                                     <Button size="sm" className="flex-1" variant="secondary" onClick={() => handleFileUpload('image/*', (file) => handleProjectThumbUpload(project.id, file))}>
                                        <Upload size={14} className="mr-2"/> Upload
                                     </Button>
                                  </div>
                               </div>
                            </div>

                            <div className="space-y-2">
                               <label className="text-xs font-medium text-zinc-500 uppercase">Video Asset</label>
                               
                               {/* Uploading State */}
                               {isUploading && (
                                 <div className="h-24 bg-zinc-900 border border-zinc-800 rounded-lg flex flex-col items-center justify-center p-4">
                                    <div className="w-full flex justify-between text-xs text-zinc-400 mb-2">
                                       <span>Uploading...</span>
                                       <span>{uploadProgress}%</span>
                                    </div>
                                    <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                                       <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                                    </div>
                                 </div>
                               )}

                               {/* File Active State */}
                               {!isUploading && project.link && (
                                   <div className="bg-zinc-800 rounded-lg p-3 border border-zinc-700 flex items-center justify-between group">
                                      <div className="flex items-center gap-3 overflow-hidden">
                                          <div className="p-2 bg-zinc-900 rounded">
                                              <FileVideo size={20} className="text-indigo-400"/>
                                          </div>
                                          <div className="flex flex-col overflow-hidden">
                                              <span className="text-xs font-medium text-white truncate">{project.link.startsWith('blob:') ? 'Local File' : 'Link'}</span>
                                              <span className="text-[10px] text-zinc-500 truncate">{project.link}</span>
                                          </div>
                                      </div>
                                      <Button size="sm" variant="ghost" className="text-zinc-400 hover:text-red-400 p-1" onClick={() => updateProject(project.id, { link: '', customVideoBlob: undefined })}>
                                          <Trash2 size={16}/>
                                      </Button>
                                   </div>
                               )}

                               {/* Empty State - Choice */}
                               {!isUploading && !project.link && (
                                   <div className="space-y-3">
                                      {/* Tabs */}
                                      <div className="flex p-1 bg-zinc-900 rounded-lg">
                                         <button 
                                            onClick={() => toggleInputMethod(project.id, 'upload')}
                                            className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${currentInputMethod === 'upload' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                                         >
                                            Upload File
                                         </button>
                                         <button 
                                            onClick={() => toggleInputMethod(project.id, 'link')}
                                            className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${currentInputMethod === 'link' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                                         >
                                            External URL
                                         </button>
                                      </div>

                                      {/* Content based on Tab */}
                                      {currentInputMethod === 'upload' ? (
                                         <Button size="sm" className="w-full h-24 border-2 border-dashed border-zinc-700 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-500 flex flex-col gap-2" variant="ghost" onClick={() => handleFileUpload('video/*', (file) => handleProjectVideoUpload(project.id, file))}>
                                            <Upload size={24} className="text-zinc-400"/>
                                            <div className="flex flex-col items-center">
                                                <span className="text-xs font-medium text-zinc-300">Choose Video File</span>
                                                <span className="text-[10px] text-zinc-500">MP4, MOV (Local DB)</span>
                                            </div>
                                         </Button>
                                      ) : (
                                         <div className="space-y-2">
                                            <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg focus-within:border-indigo-500 transition-colors">
                                               <Globe size={14} className="text-zinc-500"/>
                                               <input 
                                                  placeholder="https://youtube.com/..." 
                                                  value={project.link} 
                                                  onChange={(e) => updateProject(project.id, { link: e.target.value })} 
                                                  className="bg-transparent border-none text-xs text-white placeholder-zinc-600 focus:outline-none w-full"
                                               />
                                            </div>
                                            <p className="text-[10px] text-zinc-600 px-1">Supports YouTube, Vimeo, or direct video links.</p>
                                         </div>
                                      )}
                                   </div>
                               )}
                            </div>
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

        {/* ... TESTIMONIALS (unchanged) ... */}
        {(activeTab === 'testimonials' || activeTab === 'tools') && (
           <div className="space-y-6 animate-fadeIn">
              {activeTab === 'testimonials' && (
                 <>
                    <div className="flex justify-between">
                       <h3 className="text-sm font-bold text-white">Testimonials</h3>
                       <Button size="sm" variant="secondary" onClick={addTestimonial} icon={<Plus size={14}/>}>Add</Button>
                    </div>
                    {data.testimonials.map((t) => (
                      <div key={t.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-3 relative animate-in slide-in-from-top-2">
                        <button onClick={() => removeTestimonial(t.id)} className="absolute top-4 right-4 text-zinc-600 hover:text-red-400"><Trash2 size={14} /></button>
                        <Input label="Name" value={t.name} onChange={(e) => updateTestimonial(t.id, 'name', e.target.value)} />
                        <Input label="Role" value={t.role} onChange={(e) => updateTestimonial(t.id, 'role', e.target.value)} />
                        <TextArea label="Quote" value={t.quote} onChange={(e) => updateTestimonial(t.id, 'quote', e.target.value)} rows={2} />
                      </div>
                    ))}
                 </>
              )}

              {activeTab === 'tools' && (
                 <>
                    <h3 className="text-sm font-bold text-white">Skills & Stack</h3>
                    
                    <div className="space-y-6">
                        <Input 
                            label="Primary Workflow (Main Card)" 
                            value={data.primaryTool || ''} 
                            onChange={(e) => updateField('primaryTool', e.target.value)} 
                            placeholder="e.g. DaVinci Resolve"
                        />
                        <TagInput 
                            label="Other Softwares" 
                            items={data.tools} 
                            onChange={(items) => updateField('tools', items)} 
                        />
                        <TagInput 
                            label="AI Tools" 
                            items={data.aiTools} 
                            onChange={(items) => updateField('aiTools', items)} 
                        />
                        <TagInput 
                            label="General Skills" 
                            items={data.skills} 
                            onChange={(items) => updateField('skills', items)} 
                        />
                    </div>
                 </>
              )}
           </div>
        )}

        {/* === ACCOUNT SETTINGS === */}
        {activeTab === 'settings' && (
           <div className="space-y-8 animate-fadeIn">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
                 <h3 className="text-white font-bold text-sm flex items-center gap-2">
                    <Shield size={16} className="text-indigo-500" />
                    Frames Account Access
                 </h3>
                 <p className="text-xs text-zinc-500">Update the credentials used to log in to this editor.</p>
                 
                 <div className="space-y-4 pt-2">
                    <Input 
                       label="Username" 
                       value={data.settings?.username || 'admin'} 
                       onChange={(e) => updateSettings('username', e.target.value)} 
                    />
                    <Input 
                       label="Password" 
                       value={data.settings?.password || 'cinefolio'} 
                       onChange={(e) => updateSettings('password', e.target.value)} 
                       type="text" // Show password for easier editing
                    />
                 </div>
              </div>

              <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
                 <h3 className="text-red-500 font-bold text-sm mb-2">Session Management</h3>
                 <p className="text-xs text-zinc-500 mb-4">Log out of the editor to return to the public view.</p>
                 <Button 
                    variant="outline" 
                    className="w-full border-red-500/30 text-red-500 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400"
                    onClick={onLogout}
                    icon={<LogOut size={16}/>}
                 >
                    Log Out
                 </Button>
              </div>
           </div>
        )}

      </div>
    </div>
  );
};