import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PortfolioData, Project, Testimonial } from '../../types';
import { Input, TextArea } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ToolSelector } from '../../components/ToolSelector';
import { Plus, Trash2, Video, Wand2, Image as ImageIcon, ChevronDown, Upload, X, LayoutDashboard, Copy, ExternalLink, User, MessageSquare, Loader2, CheckCircle2, Globe, Crop, Settings, LogOut, AlertCircle, Sparkles, Wrench, ZoomIn, ZoomOut, QrCode, Download, AlertTriangle, Eye, Monitor, Smartphone, HelpCircle, Info, BarChart3, MousePointerClick, Save, UploadCloud, Link, Youtube, HardDrive, Database, RotateCcw, PenSquare, XCircle, Check } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { getCroppedImg, generateThumbnailFromVideo, uploadFileToStorage, hasCloudStorage, generateAiBio, generateAiDescription, downloadQrCode, getVideoMetadata, getDriveThumbnail, generateAiThumbnail, getPortfolioStats, cleanupUnusedMedia, saveDraft, PROJECT_CONTENT_TYPES, PROJECT_SUBJECT_MATTERS, EDITING_TOOLS_LIST } from '../../lib/utils';

// ... (Existing Imports and Interfaces)
interface EditorPanelProps {
  data: PortfolioData;
  onChange: (newData: PortfolioData) => void;
  onSave: () => Promise<void>;
  onPublish: () => Promise<void>;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  onLogout?: () => void;
  onDeleteAccount?: () => Promise<void>;
  onPreview?: () => void;
}

// ... (Existing Components: PublishButton, Tooltip, getLinkIndicator)

const PublishButton = ({ onPublish, hasUnsavedChanges }: { onPublish: () => Promise<void>, hasUnsavedChanges: boolean }) => {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

    const handleClick = async () => {
        setStatus('loading');
        try {
            await onPublish();
            setStatus('success');
            setTimeout(() => setStatus('idle'), 2000);
        } catch (e) {
            console.error(e);
            setStatus('idle');
        }
    };

    return (
        <Button 
            size="sm" 
            onClick={handleClick} 
            disabled={status === 'loading'} 
            className={`transition-all duration-300 border-none ${status === 'success' ? 'bg-green-500 hover:bg-green-500' : 'bg-indigo-600 hover:bg-indigo-500'} text-white`}
        >
            <AnimatePresence mode="wait">
                {status === 'loading' ? (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <Loader2 className="animate-spin" size={14}/>
                    </motion.div>
                ) : status === 'success' ? (
                    <motion.div key="success" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                         <CheckCircle2 size={14} /> Published
                    </motion.div>
                ) : (
                    <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                        <UploadCloud size={14}/> Publish
                    </motion.div>
                )}
            </AnimatePresence>
        </Button>
    );
}

const Tooltip = ({ text, children }: { text: string; children?: React.ReactNode }) => {
    const [isVisible, setIsVisible] = useState(false);
    return (
        <div className="relative inline-block" onMouseEnter={() => setIsVisible(true)} onMouseLeave={() => setIsVisible(false)}>
            {children}
            <AnimatePresence>
                {isVisible && (
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-zinc-800 text-zinc-100 text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-2xl border border-zinc-700 whitespace-nowrap z-[1000] pointer-events-none">
                        {text}<div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-8 border-transparent border-t-zinc-800"></div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const getLinkIndicator = (url: string) => {
    if (!url) return null;
    
    let isValid = false;
    try {
        const u = new URL(url);
        if (['http:', 'https:'].includes(u.protocol)) isValid = true;
    } catch(e) {
        isValid = false;
    }

    if (!isValid) {
        if (url.length > 5) {
             return { 
                 icon: AlertCircle, 
                 color: 'text-amber-500', 
                 label: 'Invalid URL', 
                 border: '!border-amber-500/50 focus:!border-amber-500 focus:!ring-amber-500/20',
                 isError: true 
             };
        }
        return null;
    }

    const lower = url.toLowerCase();
    
    if (lower.includes('youtube.com') || lower.includes('youtu.be')) 
        return { icon: Youtube, color: 'text-red-500', label: 'YouTube', border: '!border-red-500/50 focus:!border-red-500 focus:!ring-red-500/20' };
    
    if (lower.includes('drive.google.com')) 
        return { icon: HardDrive, color: 'text-blue-500', label: 'Drive', border: '!border-blue-500/50 focus:!border-blue-500 focus:!ring-blue-500/20' };
    
    if (lower.includes('vimeo.com'))
        return { icon: Video, color: 'text-sky-500', label: 'Vimeo', border: '!border-sky-500/50 focus:!border-sky-500 focus:!ring-sky-500/20' };
        
    return { icon: Link, color: 'text-emerald-500', label: 'Web', border: '!border-emerald-500/50 focus:!border-emerald-500 focus:!ring-emerald-500/20' };
};

// --- Project Editor Component ---
const ProjectCardEditor = ({ 
    project, 
    onChange, 
    onDelete, 
    onUploadVideo, 
    onUploadImage,
    uploadStatus
}: { 
    project: Project, 
    onChange: (p: Partial<Project>) => void, 
    onDelete: () => void, 
    onUploadVideo: (file: File) => void, 
    onUploadImage: (file: File) => void,
    uploadStatus: any 
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const linkStatus = getLinkIndicator(project.link);
    const [localLinkInput, setLocalLinkInput] = useState(project.link);
    const [isValidating, setIsValidating] = useState(false);

    const handleLinkChange = (val: string) => {
        setLocalLinkInput(val);
        onChange({ link: val });
        
        if (val.length > 10) {
            setIsValidating(true);
            // Debounce the metadata fetch
            const timeout = setTimeout(async () => {
                const metadata = await getVideoMetadata(val);
                if (metadata.thumbnail) {
                    onChange({ 
                        thumbnail: metadata.thumbnail, 
                        aspectRatio: metadata.aspectRatio // Auto-persist aspect ratio from link
                    });
                } else if (metadata.aspectRatio) {
                     onChange({ aspectRatio: metadata.aspectRatio });
                }
                setIsValidating(false);
            }, 800);
            return () => clearTimeout(timeout);
        } else {
            setIsValidating(false);
        }
    };

    const toggleSoftware = (toolName: string) => {
        const current = project.softwareUsed || [];
        if (current.includes(toolName)) {
            onChange({ softwareUsed: current.filter(t => t !== toolName) });
        } else {
            onChange({ softwareUsed: [...current, toolName] });
        }
    }

    return (
        <div className={`bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden transition-all duration-300 ${isExpanded ? 'ring-1 ring-zinc-700' : ''}`}>
             {/* Header / Condensed View */}
             <div className="p-4 flex gap-4 items-start">
                 <div className="w-24 h-24 bg-black rounded-lg overflow-hidden shrink-0 border border-zinc-800 relative group cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                    <img src={project.thumbnail || "https://picsum.photos/400/225"} className="w-full h-full object-cover" />
                    {project.aspectRatio && (
                        <div className="absolute bottom-1 right-1 bg-black/70 text-[8px] px-1 rounded text-zinc-300 backdrop-blur-sm">
                            {project.aspectRatio}
                        </div>
                    )}
                    {uploadStatus && (
                        <div className="absolute inset-0 bg-black/80 z-20 flex items-center justify-center backdrop-blur-sm">
                            <div className="w-full px-2">
                                <div className="h-1 bg-zinc-800 rounded-full overflow-hidden mb-1">
                                    <motion.div className="h-full bg-indigo-500" initial={{ width: 0 }} animate={{ width: `${uploadStatus.progress}%` }} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex-1 space-y-3">
                    <div className="flex justify-between items-start gap-2">
                        <input 
                            className="bg-transparent border-none p-0 text-white font-bold text-sm w-full focus:ring-0 placeholder:text-zinc-600" 
                            value={project.title} 
                            onChange={e => onChange({ title: e.target.value })} 
                            placeholder="Project Title"
                        />
                        <div className="flex items-center gap-1">
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setIsExpanded(!isExpanded)}>
                                {isExpanded ? <ChevronDown className="rotate-180 transition-transform" size={14} /> : <ChevronDown className="transition-transform" size={14} />}
                            </Button>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-500 hover:text-red-400" onClick={onDelete}>
                                <Trash2 size={12}/>
                            </Button>
                        </div>
                    </div>

                    <div className="flex gap-2 items-center">
                         {/* Link Input */}
                         <div className="relative flex-1 group/input">
                            <Input 
                                value={project.link} 
                                onChange={e => handleLinkChange(e.target.value)} 
                                placeholder={project.type === 'video' ? "Drive / YouTube / Vimeo Link" : "Image URL"}
                                className={`h-8 text-[10px] py-1 pr-7 bg-black/30 ${linkStatus ? linkStatus.border : ''}`}
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                                <AnimatePresence mode="wait">
                                    {isValidating ? (
                                        <motion.div key="loader" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                                            <Loader2 className="animate-spin text-zinc-600" size={12} />
                                        </motion.div>
                                    ) : linkStatus ? (
                                        <motion.div key="icon" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} className={linkStatus.color} title={linkStatus.label}>
                                            <linkStatus.icon size={12} />
                                        </motion.div>
                                    ) : null}
                                </AnimatePresence>
                            </div>
                        </div>
                        
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0" title="Upload Media" onClick={() => {
                             const input = document.createElement('input');
                             input.type = 'file';
                             input.accept = project.type === 'video' ? 'video/*' : 'image/*';
                             input.onchange = (e: any) => project.type === 'video' ? onUploadVideo(e.target.files[0]) : onUploadImage(e.target.files[0]);
                             input.click();
                        }}>
                            <Upload size={12} />
                        </Button>
                    </div>
                </div>
             </div>

             {/* Expanded Metadata Panel */}
             <AnimatePresence>
                 {isExpanded && (
                     <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: 'auto', opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }} 
                        className="border-t border-zinc-800 bg-black/20"
                     >
                         <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="space-y-4">
                                 <div>
                                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Description</label>
                                    <TextArea 
                                        value={project.description} 
                                        onChange={e => onChange({ description: e.target.value })} 
                                        placeholder="Short summary of the project..." 
                                        rows={3}
                                        className="bg-black/30 text-xs"
                                    />
                                 </div>
                                 <div className="grid grid-cols-2 gap-2">
                                     <div>
                                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Content Type</label>
                                        <select 
                                            value={project.contentType || ''} 
                                            onChange={e => onChange({ contentType: e.target.value })}
                                            className="w-full bg-black/30 border border-zinc-800 rounded-lg px-2 py-2 text-zinc-300 text-xs focus:outline-none focus:border-zinc-600"
                                        >
                                            <option value="">Select Type...</option>
                                            {PROJECT_CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                     </div>
                                     <div>
                                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Subject Matter</label>
                                        <select 
                                            value={project.subjectMatter || ''} 
                                            onChange={e => onChange({ subjectMatter: e.target.value })}
                                            className="w-full bg-black/30 border border-zinc-800 rounded-lg px-2 py-2 text-zinc-300 text-xs focus:outline-none focus:border-zinc-600"
                                        >
                                            <option value="">Select Subject...</option>
                                            {PROJECT_SUBJECT_MATTERS.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                     </div>
                                 </div>
                             </div>

                             <div className="space-y-4">
                                <div>
                                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Editing Software</label>
                                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto custom-scrollbar p-1">
                                        {EDITING_TOOLS_LIST.map(tool => {
                                            const isActive = (project.softwareUsed || []).includes(tool.name);
                                            return (
                                                <button 
                                                    key={tool.name}
                                                    onClick={() => toggleSoftware(tool.name)}
                                                    className={`text-[9px] px-2 py-1 rounded border transition-colors ${isActive ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300' : 'bg-black/40 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                                                >
                                                    {tool.name}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                     <div>
                                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Aspect Ratio</label>
                                        <select 
                                            value={project.aspectRatio || '16:9'} 
                                            onChange={e => onChange({ aspectRatio: e.target.value as any })}
                                            className="w-full bg-black/30 border border-zinc-800 rounded-lg px-2 py-2 text-zinc-300 text-xs focus:outline-none focus:border-zinc-600"
                                        >
                                            <option value="16:9">16:9 (Landscape)</option>
                                            <option value="9:16">9:16 (Portrait)</option>
                                            <option value="4:3">4:3 (Classic)</option>
                                            <option value="1:1">1:1 (Square)</option>
                                        </select>
                                     </div>
                                     <div>
                                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Media Type</label>
                                        <select 
                                            value={project.type} 
                                            onChange={e => onChange({ type: e.target.value as any })}
                                            className="w-full bg-black/30 border border-zinc-800 rounded-lg px-2 py-2 text-zinc-300 text-xs focus:outline-none focus:border-zinc-600"
                                        >
                                            <option value="video">Video</option>
                                            <option value="image">Image</option>
                                        </select>
                                     </div>
                                </div>
                             </div>
                         </div>
                     </motion.div>
                 )}
             </AnimatePresence>
        </div>
    )
}

export const EditorPanel: React.FC<EditorPanelProps> = ({ data, onChange, onSave, onPublish, isSaving, hasUnsavedChanges, onLogout, onDeleteAccount, onPreview }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile' | 'content' | 'testimonials' | 'tools' | 'settings'>('dashboard');
  const [uploadStatus, setUploadStatus] = useState<{ id: string; progress: number, step?: string } | null>(null);
  
  // Deletion States
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string; undoData?: { project: Project; index: number } } | null>(null);
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [stats, setStats] = useState({ views: 0, clicks: 0 });
  
  // Image Crop State
  const [cropModal, setCropModal] = useState<{ open: boolean; src: string | null }>({ open: false, src: null });
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedPixels, setCroppedPixels] = useState<any>(null);

  const toastTimerRef = useRef<any>(null);

  useEffect(() => {
      if (activeTab === 'dashboard' && data.uid) {
          getPortfolioStats(data.uid).then(setStats);
      }
  }, [activeTab, data.uid]);

  useEffect(() => {
    if (toast?.show) {
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => {
            setToast(null);
        }, 5000);
    }
    return () => {
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    }
  }, [toast]);

  // Helper wrapper for auto-save after media operations
  const triggerAutoSave = async (newData: PortfolioData) => {
      onChange(newData);
      if (newData.uid) {
          await saveDraft(newData.uid, newData);
      }
  }

  const updateField = (f: keyof PortfolioData, v: any) => onChange({ ...data, [f]: v });
  const updateProject = (id: string, updates: Partial<Project>) => {
      onChange({ ...data, projects: data.projects.map(p => p.id === id ? { ...p, ...updates } : p) });
  };

  const handleProjectVideo = async (projectId: string, file: File) => {
    setUploadStatus({ id: projectId, progress: 0, step: 'Processing...' });

    try {
        const { url: thumbBlobUrl, blob: thumbBlob, aspectRatio } = await generateThumbnailFromVideo(file);
        
        setUploadStatus({ id: projectId, progress: 10, step: 'Uploading Video...' });
        const videoPath = `users/${data.uid}/projects/${projectId}_${Date.now()}.mp4`;
        const videoUrl = await uploadFileToStorage(file, videoPath, (p) => {
            setUploadStatus({ id: projectId, progress: 10 + (p * 0.7), step: 'Uploading Video...' });
        });

        setUploadStatus({ id: projectId, progress: 85, step: 'Uploading Thumbnail...' });
        const thumbPath = `users/${data.uid}/projects/${projectId}_thumb_${Date.now()}.jpg`;
        const thumbUrl = await uploadFileToStorage(new File([thumbBlob], 'thumb.jpg'), thumbPath);

        const finalProjects = data.projects.map(p => p.id === projectId ? { 
            ...p, 
            link: videoUrl, 
            thumbnail: thumbUrl,
            aspectRatio: aspectRatio 
        } : p);
        
        const newData = { ...data, projects: finalProjects };
        await triggerAutoSave(newData);
        
        setUploadStatus({ id: projectId, progress: 100, step: 'Done' });

    } catch (e) {
        console.error("Video Upload Failed", e);
    } finally { 
        setTimeout(() => setUploadStatus(null), 1000); 
    }
  };
  
  const handleProjectImage = async (projectId: string, file: File) => {
     const url = URL.createObjectURL(file);
     // Optimistic update
     updateProject(projectId, { link: url, thumbnail: url, type: 'image' }); 
     
     uploadFileToStorage(file, `users/${data.uid}/projects/${projectId}_img_${Date.now()}`).then(url => {
        updateProject(projectId, { link: url, thumbnail: url });
     });
  };

  const handleShowreel = async (file: File) => {
    setUploadStatus({ id: 'showreel', progress: 0, step: 'Processing...' });
    
    try {
        const { blob: thumbBlob } = await generateThumbnailFromVideo(file);
        
        setUploadStatus({ id: 'showreel', progress: 10, step: 'Uploading Video...' });
        const videoPath = `users/${data.uid}/showreels/main_${Date.now()}.mp4`;
        const videoUrl = await uploadFileToStorage(file, videoPath, (p) => {
            setUploadStatus({ id: 'showreel', progress: 10 + (p * 0.7), step: 'Uploading Video...' });
        });

        setUploadStatus({ id: 'showreel', progress: 85, step: 'Uploading Thumbnail...' });
        const thumbPath = `users/${data.uid}/showreels/thumb_${Date.now()}.jpg`;
        const thumbUrl = await uploadFileToStorage(new File([thumbBlob], 'thumb.jpg'), thumbPath);

        const newData = { ...data, showreelLink: videoUrl, showreelThumbnail: thumbUrl };
        await triggerAutoSave(newData);
        
        setUploadStatus({ id: 'showreel', progress: 100, step: 'Done' });

    } catch(e) {
        console.error(e);
    } finally { 
        setTimeout(() => setUploadStatus(null), 1000); 
    }
  };

  const handleDeleteAccount = async () => {
      if (!onDeleteAccount) return;
      setIsDeleting(true);
      await onDeleteAccount();
  }

  const handleCleanup = async () => {
      if (!data.uid) return;
      if (!window.confirm("This will permanently delete unused media files. Continue?")) return;
      setIsCleaning(true);
      try {
          const count = await cleanupUnusedMedia(data.uid, data);
          setToast({ show: true, message: `Cleanup complete. Removed ${count} files.` });
      } catch (e) {
          console.error("Cleanup failed", e);
          setToast({ show: true, message: "Cleanup failed. Please try again." });
      } finally {
          setIsCleaning(false);
      }
  };
  
  const confirmProjectDeletion = () => {
      if (projectToDelete) {
          const idx = data.projects.findIndex(p => p.id === projectToDelete.id);
          const newProjects = data.projects.filter(p => p.id !== projectToDelete.id);
          updateField('projects', newProjects);
          
          setToast({
              show: true,
              message: `Deleted "${projectToDelete.title}"`,
              undoData: { project: projectToDelete, index: idx }
          });
          
          setProjectToDelete(null);
      }
  };

  const handleUndo = () => {
      if (!toast?.undoData) return;
      const { project, index } = toast.undoData;
      const newProjects = [...data.projects];
      if (index >= 0 && index <= newProjects.length) {
          newProjects.splice(index, 0, project);
      } else {
          newProjects.push(project);
      }
      updateField('projects', newProjects);
      setToast(null);
  };

  const getShareLink = () => {
      const baseUrl = window.location.origin;
      return `${baseUrl}/#${data.username}`; 
  };
  
  const getQrUrl = () => {
      return `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(getShareLink())}&format=png`;
  }

  const handleShowreelLinkInput = (val: string) => {
      updateField('showreelLink', val);
      if (val.length > 10) {
          setTimeout(async () => {
              const metadata = await getVideoMetadata(val);
              if (metadata.thumbnail) {
                  updateField('showreelThumbnail', metadata.thumbnail);
              }
          }, 800);
      }
  }

  return (
    <div className="h-screen flex flex-col bg-black text-white overflow-hidden">
        <header className="p-4 border-b border-zinc-800 bg-zinc-950 flex justify-between items-center z-50">
            <div className="flex items-baseline gap-2">
                <h2 className="text-xl font-display font-black tracking-tighter">FRAMES</h2>
                <span className="text-[9px] bg-white text-black px-1.5 font-bold rounded">STUDIO</span>
            </div>
            <div className="flex items-center gap-3">
                {hasUnsavedChanges && <span className="text-[10px] text-zinc-500 font-bold uppercase mr-2">Unsaved Changes</span>}
                <Button size="sm" variant="secondary" onClick={() => onSave()} disabled={isSaving || !!uploadStatus} icon={<Save size={14}/>}>
                    {isSaving ? 'Saving...' : 'Save Draft'}
                </Button>
                
                <PublishButton onPublish={onPublish} hasUnsavedChanges={hasUnsavedChanges} />

                <div className="h-6 w-px bg-zinc-800 mx-1"></div>
                <Button variant="outline" size="sm" onClick={onPreview} icon={<Eye size={14}/>}>Preview</Button>
            </div>
        </header>
        
         {showQr && createPortal(
            <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in" onClick={() => setShowQr(false)}>
                <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 max-w-sm w-full" onClick={e => e.stopPropagation()}>
                    <div className="bg-black p-4 rounded-xl"><img src={getQrUrl()} alt="Portfolio QR" className="w-48 h-48" loading="lazy" /></div>
                    <div className="text-center">
                        <h3 className="text-black font-bold text-lg mb-1">Scan to View</h3>
                        <p className="text-zinc-500 text-xs break-all">{getShareLink()}</p>
                    </div>
                    <Button onClick={() => downloadQrCode(getQrUrl(), `${data.username}-portfolio-qr.png`)} className="w-full" icon={<Download size={16}/>}>Download QR</Button>
                    <Button variant="secondary" onClick={() => setShowQr(false)} className="w-full">Close</Button>
                </div>
            </div>,
            document.body
        )}

        <div className="flex-1 flex overflow-hidden">
            <nav className="w-16 border-r border-zinc-900 flex flex-col gap-4 py-8 items-center bg-zinc-950/50">
                {[
                    { id: 'dashboard', icon: LayoutDashboard },
                    { id: 'profile', icon: User },
                    { id: 'content', icon: Video },
                    { id: 'tools', icon: Wrench },
                    { id: 'settings', icon: Settings }
                ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`p-3 rounded-xl transition-all ${activeTab === tab.id ? 'bg-indigo-500 text-white shadow-lg' : 'text-zinc-600 hover:text-white'}`}>
                        <tab.icon size={20} />
                    </button>
                ))}
            </nav>

            <main className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.05),transparent)]">
                <div className="max-w-3xl mx-auto space-y-12">
                    {activeTab === 'dashboard' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                            <div className="bg-indigo-500/10 border border-indigo-500/20 p-8 rounded-3xl space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xl font-bold">Your Portfolio is Live</h3>
                                        <p className="text-zinc-400 text-sm mt-1">Share this unique URL with clients. Publish changes to update.</p>
                                    </div>
                                    {data.meta?.publish?.isPublished && (
                                        <span className="px-3 py-1 bg-green-500/20 text-green-500 text-[10px] font-bold uppercase rounded-full border border-green-500/20">Published</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 bg-black/50 p-4 rounded-xl border border-zinc-800">
                                    <Globe size={16} className="text-indigo-500" />
                                    <code className="text-xs text-zinc-300 flex-1 truncate">{getShareLink()}</code>
                                    <Button size="sm" onClick={() => { navigator.clipboard.writeText(getShareLink()); }}>Copy</Button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                     <Button variant="outline" className="w-full py-6 border-dashed" onClick={() => window.open(getShareLink(), '_blank')}>Open Public Portfolio <ExternalLink size={14} className="ml-2"/></Button>
                                     <Button variant="outline" className="w-full py-6 border-dashed" onClick={() => setShowQr(true)}>Get QR Code <QrCode size={14} className="ml-2"/></Button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl flex flex-col justify-between h-32 relative overflow-hidden">
                                     <div className="absolute right-0 top-0 p-32 bg-indigo-500/5 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
                                     <div className="flex items-center gap-3 text-zinc-500 mb-2">
                                         <BarChart3 size={16} />
                                         <span className="text-xs font-bold uppercase tracking-widest">Total Views</span>
                                     </div>
                                     <span className="text-4xl font-display font-black text-white">{stats.views}</span>
                                </div>
                                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl flex flex-col justify-between h-32 relative overflow-hidden">
                                     <div className="absolute right-0 top-0 p-32 bg-purple-500/5 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
                                     <div className="flex items-center gap-3 text-zinc-500 mb-2">
                                         <MousePointerClick size={16} />
                                         <span className="text-xs font-bold uppercase tracking-widest">Interactions</span>
                                     </div>
                                     <span className="text-4xl font-display font-black text-white">{stats.clicks}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div className="space-y-8 animate-in fade-in">
                            <div className="flex items-center gap-8">
                                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-zinc-800 relative group shrink-0">
                                    <img src={data.profileImage} className="w-full h-full object-cover" />
                                    {uploadStatus?.id === 'profile' && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                            <Loader2 className="animate-spin text-white" size={24}/>
                                        </div>
                                    )}
                                    <button onClick={() => {
                                        const input = document.createElement('input');
                                        input.type = 'file';
                                        input.onchange = (e: any) => {
                                            const file = e.target.files[0];
                                            const reader = new FileReader();
                                            reader.onload = () => setCropModal({ open: true, src: reader.result as string });
                                            reader.readAsDataURL(file);
                                        };
                                        input.click();
                                    }} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Upload size={24}/></button>
                                </div>
                                <div className="flex-1 space-y-4">
                                    <Input label="Display Name" value={data.name} onChange={e => updateField('name', e.target.value)} />
                                    <Input label="Professional Role" value={data.role} onChange={e => updateField('role', e.target.value)} placeholder="Senior Video Editor" />
                                </div>
                            </div>
                            <TextArea label="Bio" value={data.bio} onChange={e => updateField('bio', e.target.value)} rows={4} />
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Instagram" value={data.socials.instagram} onChange={e => updateField('socials', { ...data.socials, instagram: e.target.value })} />
                                <Input label="YouTube" value={data.socials.youtube} onChange={e => updateField('socials', { ...data.socials, youtube: e.target.value })} />
                            </div>
                        </div>
                    )}

                    {activeTab === 'content' && (
                        <div className="space-y-12 animate-in fade-in">
                            {/* Showreel Section */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Showreel</h3>
                                    <Button size="sm" variant="ghost" onClick={() => onSave()} icon={<Save size={12} className="text-zinc-500"/>} className="text-xs text-zinc-500 hover:text-white">Save Section</Button>
                                </div>
                                <div className="relative">
                                    {uploadStatus?.id === 'showreel' && (
                                        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10 rounded-xl backdrop-blur-sm">
                                            <div className="flex flex-col items-center gap-2">
                                                <Loader2 className="animate-spin text-indigo-500" size={24}/>
                                                <span className="text-[10px] uppercase font-bold text-white">{uploadStatus.step} {Math.round(uploadStatus.progress)}%</span>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex gap-4 items-start">
                                        <div className="flex-1 space-y-2">
                                            <Input 
                                                placeholder="Or paste YouTube / Vimeo / Drive Link..." 
                                                value={data.showreelLink} 
                                                onChange={e => handleShowreelLinkInput(e.target.value)}
                                                className="bg-black/50"
                                            />
                                            <p className="text-[10px] text-zinc-500">Supported: YouTube, Vimeo, Google Drive, or Direct Upload.</p>
                                        </div>
                                        <Button className="h-10 border-2 border-dashed border-zinc-800 bg-zinc-950 hover:border-indigo-500 group relative overflow-hidden" variant="ghost" onClick={() => {
                                            const input = document.createElement('input');
                                            input.type = 'file';
                                            input.onchange = (e: any) => handleShowreel(e.target.files[0]);
                                            input.click();
                                        }}>
                                            <Upload className="mr-2 group-hover:scale-110 transition-transform" size={16}/> 
                                            Upload File
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Projects Section */}
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Projects</h3>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="ghost" onClick={() => onSave()} icon={<Save size={12} className="text-zinc-500"/>} className="text-xs text-zinc-500 hover:text-white">Save Section</Button>
                                        <Button size="sm" onClick={() => {
                                            const newProject: Project = { 
                                                id: Date.now().toString(), 
                                                title: "New Project", 
                                                description: "Short edit summary", 
                                                thumbnail: "", 
                                                link: "", 
                                                category: "Work", 
                                                type: "video",
                                                aspectRatio: '16:9'
                                            };
                                            updateField('projects', [newProject, ...data.projects]);
                                        }}>
                                            <Plus size={14}/> Add
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    {data.projects.map(p => (
                                        <ProjectCardEditor 
                                            key={p.id}
                                            project={p}
                                            onChange={(updates) => updateProject(p.id, updates)}
                                            onDelete={() => setProjectToDelete(p)}
                                            onUploadVideo={(file) => handleProjectVideo(p.id, file)}
                                            onUploadImage={(file) => handleProjectImage(p.id, file)}
                                            uploadStatus={uploadStatus?.id === p.id ? uploadStatus : null}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'tools' && (
                        <div className="space-y-12 animate-in fade-in">
                             <div className="space-y-8 pb-4">
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 block">Software Stack (Select Primary Workflow with Star)</label>
                                    <ToolSelector 
                                        type="editing"
                                        selectedTools={data.tools || []}
                                        primaryTool={data.primaryTool}
                                        onSelect={(tools) => updateField('tools', tools)}
                                        onSetPrimary={(tool) => updateField('primaryTool', tool)}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 block">AI Tools</label>
                                    <ToolSelector 
                                        type="ai"
                                        selectedTools={data.aiTools || []}
                                        onSelect={(tools) => updateField('aiTools', tools)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="space-y-8 animate-in fade-in">
                            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl space-y-6">
                                <div className="flex items-center justify-between">
                                    <div><h4 className="font-bold">Account Access</h4><p className="text-xs text-zinc-500">Your profile is visible at frames.app/v/{data.username}</p></div>
                                    <Tooltip text="Sign out of Frames Studio"><Button variant="ghost" onClick={onLogout} icon={<LogOut size={14}/>}>Logout</Button></Tooltip>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <Input label="Username" value={data.username} onChange={e => updateField('username', e.target.value.toLowerCase().replace(/\s/g, ''))} />
                                        <Tooltip text="Used for your shareable link"><Info size={14} className="text-zinc-500 mt-5"/></Tooltip>
                                    </div>
                                    <Input label="Login Email" value={data.contactEmail} disabled className="opacity-50" />
                                </div>
                            </div>
                             <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Database size={16} className="text-zinc-400" />
                                    <h4 className="font-bold">Storage & Media</h4>
                                </div>
                                <p className="text-xs text-zinc-500 mb-4">
                                    Clean up unused media files to free up space. This will permanently delete any images or videos that are not currently used in your published portfolio or saved draft.
                                </p>
                                <Button 
                                    variant="outline" 
                                    onClick={handleCleanup} 
                                    disabled={isCleaning}
                                    icon={isCleaning ? <Loader2 className="animate-spin" size={14}/> : <Trash2 size={14}/>}
                                >
                                    {isCleaning ? "Cleaning..." : "Remove Unused Files"}
                                </Button>
                            </div>
                            <div className="p-6 border border-red-900/20 bg-red-900/5 rounded-2xl">
                                <h4 className="text-red-500 font-bold mb-2 uppercase text-xs tracking-widest flex items-center gap-2"><AlertTriangle size={14}/> Danger Zone</h4>
                                {!confirmDelete ? (
                                    <Button variant="ghost" className="text-red-500 text-xs p-0 h-auto" onClick={() => setConfirmDelete(true)}>Delete Portfolio and Data permanently</Button>
                                ) : (
                                    <div className="flex items-center gap-4 mt-2">
                                        <p className="text-[10px] text-red-400 font-bold flex-1 uppercase">Warning: This cannot be undone.</p>
                                        <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Button>
                                        <Button size="sm" className="bg-red-600 text-white hover:bg-red-700 border-none" onClick={handleDeleteAccount} disabled={isDeleting}>
                                            {isDeleting ? <Loader2 className="animate-spin" size={14}/> : 'Wipe Everything'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>

        {/* ... (Portals unchanged) ... */}
        <AnimatePresence>
            {toast && toast.show && (
                createPortal(
                    <motion.div 
                        initial={{ opacity: 0, y: 20, scale: 0.9 }} 
                        animate={{ opacity: 1, y: 0, scale: 1 }} 
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[2000] bg-zinc-800 text-white pl-4 pr-2 py-2 rounded-full shadow-2xl flex items-center gap-4 border border-zinc-700/50 backdrop-blur-md"
                    >
                        <span className="text-xs font-medium text-zinc-200">{toast.message}</span>
                        <div className="h-4 w-px bg-zinc-700"></div>
                        <button onClick={handleUndo} className="text-indigo-400 text-xs font-bold uppercase tracking-wider hover:text-indigo-300 hover:bg-indigo-500/10 px-3 py-1.5 rounded-full transition-colors flex items-center gap-2">
                            <RotateCcw size={12}/> Undo
                        </button>
                        <button onClick={() => setToast(null)} className="p-1 hover:bg-zinc-700 rounded-full text-zinc-500 hover:text-white transition-colors">
                            <X size={14}/>
                        </button>
                    </motion.div>,
                    document.body
                )
            )}
        </AnimatePresence>

        {projectToDelete && createPortal(
            <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in" onClick={() => setProjectToDelete(null)}>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col items-center gap-6 max-w-sm w-full text-center shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
                    <div className="absolute inset-0 bg-red-500/5 pointer-events-none" />
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-2 ring-1 ring-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                        <Trash2 size={28} />
                    </div>
                    <div className="space-y-2 relative z-10">
                        <h3 className="text-white font-display font-bold text-2xl tracking-tight">Delete Project?</h3>
                        <p className="text-zinc-400 text-sm leading-relaxed">
                            You are about to permanently delete <br/>
                            <span className="text-white font-bold bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700 mx-1">{projectToDelete.title}</span>
                        </p>
                    </div>
                    <div className="flex gap-3 w-full mt-2 relative z-10">
                        <Button variant="outline" className="flex-1 border-zinc-700 hover:bg-zinc-800" onClick={() => setProjectToDelete(null)}>Cancel</Button>
                        <Button className="flex-1 bg-red-600 hover:bg-red-500 text-white border-none shadow-lg shadow-red-900/20" onClick={confirmProjectDeletion}>
                            Delete
                        </Button>
                    </div>
                </div>
            </div>,
            document.body
        )}

        {cropModal.open && createPortal(
            <div className="fixed inset-0 z-[1000] bg-black flex flex-col p-8">
                <div className="flex-1 relative bg-zinc-900 rounded-3xl overflow-hidden">
                    <Cropper image={cropModal.src!} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(_, p) => setCroppedPixels(p)} />
                </div>
                <div className="py-8 flex justify-center gap-4">
                    <Button variant="outline" onClick={() => setCropModal({ open: false, src: null })}>Cancel</Button>
                    <Button 
                        disabled={uploadStatus?.id === 'profile'}
                        onClick={async () => {
                            if (!cropModal.src || !croppedPixels) return;
                            setUploadStatus({ id: 'profile', progress: 0 });
                            try {
                                const blob = await getCroppedImg(cropModal.src, croppedPixels);
                                const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
                                const path = `users/${data.uid}/profile/avatar_${Date.now()}.jpg`;
                                const downloadUrl = await uploadFileToStorage(file, path, (p) => setUploadStatus({ id: 'profile', progress: p }));
                                updateField('profileImage', downloadUrl);
                                setCropModal({ open: false, src: null });
                            } catch (e) {
                                console.error("Upload failed", e);
                            } finally {
                                setUploadStatus(null);
                            }
                        }}
                    >
                        {uploadStatus?.id === 'profile' ? <Loader2 className="animate-spin" /> : 'Save Photo'}
                    </Button>
                </div>
            </div>,
            document.body
        )}
    </div>
  );
};
