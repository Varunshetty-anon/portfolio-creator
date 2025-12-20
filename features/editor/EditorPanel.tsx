import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { PortfolioData, Project } from '../../types';
import { Input, TextArea } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ToolSelector } from '../../components/ToolSelector';
import { Plus, Trash2, Video, Upload, ChevronDown, Loader2, CheckCircle2, Database, AlertTriangle, Eye, Settings, LogOut, Wrench, LayoutDashboard, User, X, RotateCcw, AlertCircle, Youtube, HardDrive, Link, Download, Globe, ExternalLink, QrCode, BarChart3, MousePointerClick } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { getCroppedImg, generateThumbnailFromVideo, uploadFileToStorage, getVideoMetadata, getPortfolioStats, cleanupUnusedMedia, PROJECT_CONTENT_TYPES, PROJECT_SUBJECT_MATTERS, EDITING_TOOLS_LIST, getAspectRatioFromDims, probeImageDimensions, downloadQrCode } from '../../lib/utils';

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

const PublishButton = ({ onPublish, hasUnsavedChanges }: { onPublish: () => Promise<void>, hasUnsavedChanges: boolean }) => {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

    const handleClick = async () => {
        setStatus('loading');
        try {
            await onPublish();
            setStatus('success');
            setTimeout(() => setStatus('idle'), 2500);
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
            className={`transition-all duration-300 border-none ${status === 'success' ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-white text-black hover:bg-zinc-200'} font-bold min-w-[100px]`}
        >
            <AnimatePresence mode="wait">
                {status === 'loading' ? (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <Loader2 className="animate-spin" size={14}/>
                    </motion.div>
                ) : status === 'success' ? (
                    <motion.div key="success" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                         <CheckCircle2 size={14} strokeWidth={3} /> Published
                    </motion.div>
                ) : (
                    <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                        <Upload size={14} strokeWidth={2.5} className="mr-2"/> Publish
                    </motion.div>
                )}
            </AnimatePresence>
        </Button>
    );
}

const getLinkIndicator = (url: string) => {
    if (!url) return null;
    let isValid = false;
    try {
        const u = new URL(url);
        if (['http:', 'https:'].includes(u.protocol)) isValid = true;
    } catch(e) { isValid = false; }

    if (!isValid) {
        if (url.length > 5) return { icon: AlertCircle, color: 'text-amber-500', label: 'Invalid URL', border: '!border-amber-500/50', isError: true };
        return null;
    }

    const lower = url.toLowerCase();
    if (lower.includes('youtube.com') || lower.includes('youtu.be')) return { icon: Youtube, color: 'text-red-500', label: 'YouTube', border: '!border-red-500/50' };
    if (lower.includes('drive.google.com')) return { icon: HardDrive, color: 'text-blue-500', label: 'Drive', border: '!border-blue-500/50' };
    if (lower.includes('vimeo.com')) return { icon: Video, color: 'text-sky-500', label: 'Vimeo', border: '!border-sky-500/50' };
    if (lower.includes('dropbox.com')) return { icon: Database, color: 'text-indigo-400', label: 'Dropbox', border: '!border-indigo-500/50' };
    return { icon: Link, color: 'text-emerald-500', label: 'Web', border: '!border-emerald-500/50' };
};

interface ProjectCardEditorProps {
    project: Project;
    onChange: (p: Partial<Project>) => void;
    onDelete: () => void;
    onUploadImage: (file: File) => void;
    uploadStatus: any;
}

const ProjectCardEditor: React.FC<ProjectCardEditorProps> = ({ 
    project, onChange, onDelete, onUploadImage, uploadStatus
}) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const linkStatus = getLinkIndicator(project.link);
    const [isValidating, setIsValidating] = useState(false);

    const handleLinkChange = (val: string) => {
        onChange({ link: val });
        if (val.length > 10) {
            setIsValidating(true);
            const timeout = setTimeout(async () => {
                const metadata = await getVideoMetadata(val);
                if (metadata.thumbnail) onChange({ thumbnail: metadata.thumbnail, aspectRatio: metadata.aspectRatio });
                else if (metadata.aspectRatio) onChange({ aspectRatio: metadata.aspectRatio });
                setIsValidating(false);
            }, 800);
            return () => clearTimeout(timeout);
        } else {
            setIsValidating(false);
        }
    };

    const toggleSoftware = (toolName: string) => {
        const current = project.softwareUsed || [];
        if (current.includes(toolName)) onChange({ softwareUsed: current.filter(t => t !== toolName) });
        else onChange({ softwareUsed: [...current, toolName] });
    }

    // IMPORTANT: removed overflow-hidden from the main container to prevent cutting off shadows/dropdowns
    return (
        <motion.div 
            layout
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`bg-zinc-900 border border-zinc-800 rounded-2xl transition-all duration-300 ${isExpanded ? 'ring-1 ring-zinc-700' : 'hover:border-zinc-700'} relative`}
        >
             <div className="p-4 flex flex-col sm:flex-row gap-4 items-start relative z-10">
                 {/* Thumbnail Section */}
                 <div className="w-full sm:w-32 aspect-video bg-black rounded-lg overflow-hidden shrink-0 border border-zinc-800 relative group cursor-pointer" onClick={() => {
                     // Trigger file upload via label
                 }}>
                     <img src={project.thumbnail || "https://picsum.photos/400/225"} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    
                    <input 
                        type="file" 
                        className="hidden" 
                        id={`upload-${project.id}`}
                        accept="image/*,video/*"
                        onChange={(e) => {
                            if (e.target.files?.[0]) onUploadImage(e.target.files[0]);
                        }}
                    />
                    
                    <label 
                        htmlFor={`upload-${project.id}`}
                        className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                        onClick={(e) => e.stopPropagation()} 
                    >
                        <Upload size={20} className="text-white mb-1"/>
                        <span className="text-[9px] font-bold uppercase text-white tracking-wider">Change</span>
                    </label>

                    {project.aspectRatio && (
                        <div className="absolute bottom-1 right-1 bg-black/70 text-[8px] px-1 rounded text-zinc-300 backdrop-blur-sm pointer-events-none z-0">
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

                {/* Main Inputs */}
                <div className="flex-1 space-y-3 w-full min-w-0">
                    <div className="flex justify-between items-start gap-2">
                        <input 
                            className="bg-transparent border-none p-0 text-white font-bold text-sm w-full focus:ring-0 placeholder:text-zinc-600" 
                            value={project.title} 
                            onChange={e => onChange({ title: e.target.value })} 
                            placeholder="Project Title"
                        />
                        <div className="flex items-center gap-2 shrink-0">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-zinc-800 rounded-full" onClick={() => setIsExpanded(!isExpanded)}>
                                <ChevronDown className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} size={16} />
                            </Button>
                            <Button size="sm" className="h-8 w-8 p-0 bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/10 rounded-full" onClick={onDelete}>
                                <Trash2 size={14}/>
                            </Button>
                        </div>
                    </div>

                    <div className="flex gap-2 items-center">
                         <div className="relative flex-1 group/input">
                            <Input 
                                value={project.link} 
                                onChange={e => handleLinkChange(e.target.value)} 
                                placeholder="Paste Link (Drive, Dropbox, YouTube...)"
                                className={`h-8 text-[10px] py-1 pr-7 bg-black/40 ${linkStatus ? linkStatus.border : ''}`}
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                                <AnimatePresence mode="wait">
                                    {isValidating ? (
                                        <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1">
                                            <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider">Loading</span>
                                            <Loader2 className="animate-spin text-indigo-500" size={10} />
                                        </motion.div>
                                    ) : linkStatus ? (
                                        <motion.div key="icon" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} className={linkStatus.color} title={linkStatus.label}>
                                            <linkStatus.icon size={12} />
                                        </motion.div>
                                    ) : null}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </div>
             </div>

             <AnimatePresence>
                 {isExpanded && (
                     <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: 'auto', opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }} 
                        className="border-t border-zinc-800 bg-black/20"
                     >
                         <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="space-y-4">
                                 <div>
                                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Description</label>
                                    <TextArea 
                                        value={project.description} 
                                        onChange={e => onChange({ description: e.target.value })} 
                                        placeholder="Short summary of the project..." 
                                        rows={3}
                                        className="bg-black/30 text-xs border-zinc-800 resize-y"
                                    />
                                 </div>
                                 <div className="grid grid-cols-2 gap-3">
                                     <div>
                                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Content Type</label>
                                        <select 
                                            value={project.contentType || ''} 
                                            onChange={e => onChange({ contentType: e.target.value })}
                                            className="w-full bg-black/30 border border-zinc-800 rounded-lg px-2 py-2 text-zinc-300 text-xs focus:outline-none focus:border-zinc-600 appearance-none"
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
                                            className="w-full bg-black/30 border border-zinc-800 rounded-lg px-2 py-2 text-zinc-300 text-xs focus:outline-none focus:border-zinc-600 appearance-none"
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
                                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto custom-scrollbar p-1 border border-zinc-800/50 rounded-lg bg-black/20">
                                        {EDITING_TOOLS_LIST.map(tool => {
                                            const isActive = (project.softwareUsed || []).includes(tool.name);
                                            return (
                                                <button 
                                                    key={tool.name}
                                                    onClick={() => toggleSoftware(tool.name)}
                                                    className={`text-[9px] px-2 py-1 rounded-md border transition-all ${isActive ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' : 'bg-transparent border-transparent text-zinc-500 hover:border-zinc-800 hover:text-zinc-300'}`}
                                                >
                                                    {tool.name}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                     <div>
                                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Aspect Ratio</label>
                                        <select 
                                            value={project.aspectRatio || '16:9'} 
                                            onChange={e => onChange({ aspectRatio: e.target.value as any })}
                                            className="w-full bg-black/30 border border-zinc-800 rounded-lg px-2 py-2 text-zinc-300 text-xs focus:outline-none focus:border-zinc-600 appearance-none"
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
                                            className="w-full bg-black/30 border border-zinc-800 rounded-lg px-2 py-2 text-zinc-300 text-xs focus:outline-none focus:border-zinc-600 appearance-none"
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
        </motion.div>
    )
}

export const EditorPanel: React.FC<EditorPanelProps> = ({ data, onChange, onSave, onPublish, isSaving, hasUnsavedChanges, onLogout, onDeleteAccount, onPreview }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile' | 'content' | 'testimonials' | 'tools' | 'settings'>('dashboard');
  const [uploadStatus, setUploadStatus] = useState<{ id: string; progress: number, step?: string } | null>(null);
  
  // States
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  
  const [toast, setToast] = useState<{ show: boolean; message: string; undoData?: { project: Project; index: number } } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [stats, setStats] = useState({ views: 0, clicks: 0 });
  
  // Image Crop
  const [cropModal, setCropModal] = useState<{ open: boolean; src: string | null }>({ open: false, src: null });
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedPixels, setCroppedPixels] = useState<any>(null);

  const toastTimerRef = useRef<any>(null);
  const dataRef = useRef(data);

  // Sync ref with prop updates
  useEffect(() => { dataRef.current = data; }, [data]);

  useEffect(() => {
      if (activeTab === 'dashboard' && data.uid) {
          getPortfolioStats(data.uid).then(setStats);
      }
  }, [activeTab, data.uid]);

  // Debounced effect for Showreel Metadata
  useEffect(() => {
    const timer = setTimeout(async () => {
        const currentLink = dataRef.current.showreelLink;
        if(currentLink && currentLink.length > 10) {
            const meta = await getVideoMetadata(currentLink);
            if (meta.thumbnail && meta.thumbnail !== dataRef.current.showreelThumbnail) {
                 // Use the ref to ensure we are spreading the latest data, not closing over stale props
                 onChange({ ...dataRef.current, showreelThumbnail: meta.thumbnail });
            }
        }
    }, 1200);
    return () => clearTimeout(timer);
  }, [data.showreelLink, onChange]); 

  useEffect(() => {
    if (toast?.show) {
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setToast(null), 5000);
    }
  }, [toast]);

  const updateField = (f: keyof PortfolioData, v: any) => onChange({ ...data, [f]: v });
  const updateProject = (id: string, updates: Partial<Project>) => {
      onChange({ ...data, projects: data.projects.map(p => p.id === id ? { ...p, ...updates } : p) });
  };

  const handleAddProject = () => {
      const newProject: Project = { 
          id: Date.now().toString(), 
          title: "", 
          description: "", 
          thumbnail: "", 
          link: "", 
          category: "Work", 
          type: "video", 
          aspectRatio: '16:9'
      };
      // Insert at the beginning of the array
      updateField('projects', [newProject, ...data.projects]);
  };
  
  const handleProjectImage = async (projectId: string, file: File) => {
     const isVideo = file.type.startsWith('video/');
     const isImage = file.type.startsWith('image/');
     if (!isVideo && !isImage) return; 

     setUploadStatus({ id: projectId, progress: 0 });

     try {
         if (isVideo) {
             const { url: thumbUrl, blob: thumbBlob, aspectRatio } = await generateThumbnailFromVideo(file);

             // Optimistic Update
             const videoUrl = URL.createObjectURL(file);
             updateProject(projectId, {
                 link: videoUrl,
                 thumbnail: thumbUrl,
                 type: 'video',
                 aspectRatio: aspectRatio,
                 contentType: 'Upload' 
             });

             const videoStoragePath = `users/${data.uid}/projects/${projectId}_vid_${Date.now()}`;
             const storageVideoUrl = await uploadFileToStorage(file, videoStoragePath, (progress) => {
                 setUploadStatus({ id: projectId, progress: progress * 0.8 }); 
             });

             const thumbStoragePath = `users/${data.uid}/projects/${projectId}_thumb_${Date.now()}.jpg`;
             const thumbFile = new File([thumbBlob], "thumbnail.jpg", { type: "image/jpeg" });
             const storageThumbUrl = await uploadFileToStorage(thumbFile, thumbStoragePath, (progress) => {
                 setUploadStatus({ id: projectId, progress: 80 + (progress * 0.2) });
             });

             updateProject(projectId, {
                 link: storageVideoUrl,
                 thumbnail: storageThumbUrl
             });

         } else {
             // Image Logic
             const objectUrl = URL.createObjectURL(file);
             const { width, height } = await probeImageDimensions(objectUrl);
             const aspectRatio = getAspectRatioFromDims(width, height);

             updateProject(projectId, {
                 link: objectUrl,
                 thumbnail: objectUrl,
                 type: 'image',
                 aspectRatio: aspectRatio
             });

             const storagePath = `users/${data.uid}/projects/${projectId}_img_${Date.now()}`;
             const url = await uploadFileToStorage(file, storagePath, (p) => setUploadStatus({ id: projectId, progress: p }));

             updateProject(projectId, { link: url, thumbnail: url });
         }
     } catch (e) {
         console.error(e);
         setToast({ show: true, message: "Upload failed. Please check your connection." });
     } finally {
         setUploadStatus(null);
     }
  };

  const handleDeleteAccount = async () => {
      if (!onDeleteAccount) return;
      setIsDeleting(true);
      await onDeleteAccount();
  }

  const handleCleanup = async () => {
      if (!data.uid) return;
      setIsCleaning(true);
      try {
          const count = await cleanupUnusedMedia(data.uid, data);
          setToast({ show: true, message: `Cleanup complete. Removed ${count} files.` });
      } catch (e) {
          setToast({ show: true, message: "Cleanup failed. Please try again." });
      } finally {
          setIsCleaning(false);
          setShowCleanupModal(false);
      }
  };
  
  const confirmProjectDeletion = () => {
      if (projectToDelete) {
          const idx = data.projects.findIndex(p => p.id === projectToDelete.id);
          const newProjects = data.projects.filter(p => p.id !== projectToDelete.id);
          updateField('projects', newProjects);
          setToast({ show: true, message: `Deleted "${projectToDelete.title}"`, undoData: { project: projectToDelete, index: idx } });
          setProjectToDelete(null);
      }
  };

  const handleUndo = () => {
      if (!toast?.undoData) return;
      const { project, index } = toast.undoData;
      const newProjects = [...data.projects];
      if (index >= 0 && index <= newProjects.length) newProjects.splice(index, 0, project);
      else newProjects.push(project);
      updateField('projects', newProjects);
      setToast(null);
  };

  const getShareLink = () => `${window.location.origin}/#${data.username}`; 
  const getQrUrl = () => `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(getShareLink())}&format=png`;

  return (
    <div className="h-screen flex flex-col bg-black text-white overflow-hidden font-sans">
        <header className="px-6 py-4 border-b border-zinc-800 bg-[#09090b] flex justify-between items-center z-50 shrink-0">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center text-black font-black text-xs">FS</div>
                <div>
                    <h2 className="text-sm font-bold text-white tracking-wide">FRAMES STUDIO</h2>
                    <p className="text-[10px] text-zinc-500 font-medium">v1.0 • {data.username}</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                {hasUnsavedChanges && <span className="text-[10px] text-zinc-500 font-bold uppercase mr-2 animate-pulse">Unsaved Changes</span>}
                <Button size="sm" variant="secondary" onClick={() => onSave()} disabled={isSaving || !!uploadStatus} className="h-8 text-xs font-medium">
                    {isSaving ? <Loader2 className="animate-spin" size={12}/> : 'Save Draft'}
                </Button>
                <PublishButton onPublish={onPublish} hasUnsavedChanges={hasUnsavedChanges} />
                <div className="h-5 w-px bg-zinc-800 mx-2"></div>
                <Button variant="ghost" size="sm" onClick={onPreview} icon={<Eye size={14}/>} className="text-zinc-400 hover:text-white">Preview</Button>
            </div>
        </header>

        {/* ... Modals (QR, Cleanup, Delete) ... */}
        {showQr && createPortal(
            <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in" onClick={() => setShowQr(false)}>
                <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                    <div className="bg-black p-4 rounded-xl shadow-inner"><img src={getQrUrl()} alt="Portfolio QR" className="w-48 h-48" loading="lazy" /></div>
                    <div className="text-center">
                        <h3 className="text-black font-bold text-lg mb-1">Scan to View</h3>
                        <p className="text-zinc-500 text-xs break-all">{getShareLink()}</p>
                    </div>
                    <Button onClick={() => downloadQrCode(getQrUrl(), `${data.username}-portfolio-qr.png`)} className="w-full bg-black text-white hover:bg-zinc-800" icon={<Download size={16}/>}>Download QR</Button>
                    <Button variant="secondary" onClick={() => setShowQr(false)} className="w-full">Close</Button>
                </div>
            </div>, document.body
        )}
        
        {showCleanupModal && createPortal(
            <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in" onClick={() => setShowCleanupModal(false)}>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                    <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mb-4 text-zinc-400"><Database size={20}/></div>
                    <h3 className="text-white font-bold text-xl mb-2">Cleanup Storage?</h3>
                    <p className="text-zinc-400 text-sm mb-6 leading-relaxed">This will permanently delete any media files not currently referenced in your draft or published portfolio.</p>
                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={() => setShowCleanupModal(false)}>Cancel</Button>
                        <Button className="flex-1 bg-white text-black hover:bg-zinc-200" onClick={handleCleanup} disabled={isCleaning}>
                            {isCleaning ? <Loader2 className="animate-spin" size={14}/> : 'Confirm Cleanup'}
                        </Button>
                    </div>
                </div>
            </div>, document.body
        )}

        {showDeleteModal && createPortal(
             <div className="fixed inset-0 z-[1000] bg-red-950/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in" onClick={() => setShowDeleteModal(false)}>
                <div className="bg-black border border-red-900/50 rounded-2xl p-8 max-w-sm w-full shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
                    <div className="absolute inset-0 bg-red-600/5 pointer-events-none"/>
                    <div className="w-12 h-12 bg-red-950 rounded-full flex items-center justify-center mb-4 text-red-500 border border-red-900"><AlertTriangle size={20}/></div>
                    <h3 className="text-white font-bold text-xl mb-2">Delete Portfolio?</h3>
                    <p className="text-zinc-400 text-sm mb-6 leading-relaxed">This action is irreversible. All your data, media, and published links will be permanently destroyed.</p>
                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1 border-zinc-800" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
                        <Button className="flex-1 bg-red-600 text-white hover:bg-red-700 border-none" onClick={handleDeleteAccount} disabled={isDeleting}>
                            {isDeleting ? <Loader2 className="animate-spin" size={14}/> : 'Delete Forever'}
                        </Button>
                    </div>
                </div>
            </div>, document.body
        )}

        <div className="flex-1 flex overflow-hidden">
            <nav className="w-16 border-r border-zinc-900 flex flex-col gap-6 py-8 items-center bg-[#09090b] shrink-0">
                {[
                    { id: 'dashboard', icon: LayoutDashboard },
                    { id: 'profile', icon: User },
                    { id: 'content', icon: Video },
                    { id: 'tools', icon: Wrench },
                    { id: 'settings', icon: Settings }
                ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`p-3 rounded-xl transition-all relative group ${activeTab === tab.id ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-zinc-500 hover:text-white hover:bg-zinc-800'}`}>
                        <tab.icon size={20} strokeWidth={2} />
                        {activeTab === tab.id && <motion.div layoutId="activeTab" className="absolute -right-0.5 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-l-full" />}
                    </button>
                ))}
            </nav>

            <main className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar bg-black">
                <div className="max-w-3xl mx-auto space-y-12 pb-20">
                    {/* Dashboard Tab */}
                    {activeTab === 'dashboard' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* ... Dashboard content ... */}
                            <div className="bg-gradient-to-br from-indigo-900/20 to-zinc-900 border border-indigo-500/10 p-8 rounded-3xl space-y-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-32 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"/>
                                <div className="flex justify-between items-start relative z-10">
                                    <div>
                                        <h3 className="text-2xl font-bold text-white tracking-tight">Portfolio Status</h3>
                                        <p className="text-zinc-400 text-sm mt-1">Manage your public presence.</p>
                                    </div>
                                    {data.meta?.publish?.isPublished && (
                                        <span className="px-3 py-1 bg-green-500/10 text-green-400 text-[10px] font-bold uppercase rounded-full border border-green-500/20 flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/> Live
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 bg-black/40 p-4 rounded-xl border border-zinc-800/50 backdrop-blur-sm">
                                    <Globe size={16} className="text-zinc-500" />
                                    <code className="text-xs text-zinc-300 flex-1 truncate font-mono">{getShareLink()}</code>
                                    <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={() => { navigator.clipboard.writeText(getShareLink()); }}>Copy</Button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                     <Button variant="outline" className="w-full py-6 border-zinc-800 hover:bg-zinc-800" onClick={() => window.open(getShareLink(), '_blank')}>Open Live Site <ExternalLink size={14} className="ml-2"/></Button>
                                     <Button variant="outline" className="w-full py-6 border-zinc-800 hover:bg-zinc-800" onClick={() => setShowQr(true)}>Get QR Code <QrCode size={14} className="ml-2"/></Button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl">
                                     <div className="flex items-center gap-3 text-zinc-500 mb-4">
                                         <BarChart3 size={18} />
                                         <span className="text-xs font-bold uppercase tracking-widest">Total Views</span>
                                     </div>
                                     <span className="text-5xl font-display font-black text-white tracking-tighter">{stats.views}</span>
                                </div>
                                <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl">
                                     <div className="flex items-center gap-3 text-zinc-500 mb-4">
                                         <MousePointerClick size={18} />
                                         <span className="text-xs font-bold uppercase tracking-widest">Clicks</span>
                                     </div>
                                     <span className="text-5xl font-display font-black text-white tracking-tighter">{stats.clicks}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Profile Tab */}
                    {activeTab === 'profile' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="flex items-center gap-8 bg-zinc-900/30 p-6 rounded-3xl border border-zinc-800">
                                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-zinc-800 relative group shrink-0 bg-black">
                                    <img src={data.profileImage} className="w-full h-full object-cover transition-opacity group-hover:opacity-50" />
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
                                    }} className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Upload size={24} className="text-white"/></button>
                                </div>
                                <div className="flex-1 space-y-4">
                                    <Input label="Display Name" value={data.name} onChange={e => updateField('name', e.target.value)} />
                                    <Input label="Professional Role" value={data.role} onChange={e => updateField('role', e.target.value)} placeholder="Senior Video Editor" />
                                </div>
                            </div>
                            <TextArea label="Bio" value={data.bio} onChange={e => updateField('bio', e.target.value)} rows={4} className="text-base" />
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Instagram" value={data.socials.instagram} onChange={e => updateField('socials', { ...data.socials, instagram: e.target.value })} />
                                <Input label="YouTube" value={data.socials.youtube} onChange={e => updateField('socials', { ...data.socials, youtube: e.target.value })} />
                            </div>
                        </div>
                    )}

                    {/* Content Tab */}
                    {activeTab === 'content' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center px-1">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Featured Showreel</h3>
                                </div>
                                <div className="relative bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800">
                                    <div className="flex gap-4 items-start">
                                        <div className="flex-1 space-y-2">
                                            <Input 
                                                placeholder="Paste YouTube / Vimeo / Drive Link..." 
                                                value={data.showreelLink} 
                                                onChange={e => updateField('showreelLink', e.target.value)}
                                                className="bg-black/50 border-zinc-700 focus:border-indigo-500 transition-colors"
                                            />
                                            <p className="text-[10px] text-zinc-500 pl-1">Supported: YouTube, Vimeo, Google Drive, Dropbox (Direct Link).</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-6">
                                <div className="flex justify-between items-center px-1">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Selected Works</h3>
                                    <Button size="sm" onClick={handleAddProject} className="bg-white text-black hover:bg-zinc-200">
                                        <Plus size={14}/> Add Project
                                    </Button>
                                </div>
                                <div className="space-y-4">
                                    <LayoutGroup>
                                        {data.projects.map(p => (
                                            <ProjectCardEditor 
                                                key={p.id}
                                                project={p}
                                                onChange={(updates) => updateProject(p.id, updates)}
                                                onDelete={() => setProjectToDelete(p)}
                                                onUploadImage={(file) => handleProjectImage(p.id, file)}
                                                uploadStatus={uploadStatus?.id === p.id ? uploadStatus : null}
                                            />
                                        ))}
                                    </LayoutGroup>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Tools Tab */}
                    {activeTab === 'tools' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
                             <div className="space-y-8">
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4 block px-1">Primary Software</label>
                                    <ToolSelector 
                                        type="editing"
                                        selectedTools={data.tools || []}
                                        primaryTool={data.primaryTool}
                                        onSelect={(tools) => updateField('tools', tools)}
                                        onSetPrimary={(tool) => updateField('primaryTool', tool)}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4 block px-1">AI & Plugins</label>
                                    <ToolSelector 
                                        type="ai"
                                        selectedTools={data.aiTools || []}
                                        onSelect={(tools) => updateField('aiTools', tools)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Settings Tab */}
                    {activeTab === 'settings' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            {/* ... Settings content ... */}
                            <div className="bg-zinc-900/30 border border-zinc-800 p-8 rounded-3xl space-y-6">
                                <div className="flex items-center justify-between">
                                    <div><h4 className="font-bold text-white">Account</h4><p className="text-xs text-zinc-500">Manage your credentials.</p></div>
                                    <Button variant="ghost" onClick={onLogout} icon={<LogOut size={14}/>} className="text-zinc-400 hover:text-white">Logout</Button>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <Input label="Username" value={data.username} onChange={e => updateField('username', e.target.value.toLowerCase().replace(/\s/g, ''))} />
                                    </div>
                                    <Input label="Email" value={data.contactEmail} disabled className="opacity-50 cursor-not-allowed" />
                                </div>
                            </div>
                             <div className="bg-zinc-900/30 border border-zinc-800 p-8 rounded-3xl space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Database size={16} className="text-zinc-400" />
                                    <h4 className="font-bold text-white">Storage</h4>
                                </div>
                                <p className="text-xs text-zinc-500 mb-4 max-w-md">
                                    Remove unused media files to keep your storage clean. This action is irreversible.
                                </p>
                                <Button 
                                    variant="outline" 
                                    onClick={() => setShowCleanupModal(true)} 
                                    className="border-zinc-800 hover:bg-zinc-800"
                                >
                                    Cleanup Unused Files
                                </Button>
                            </div>
                            <div className="p-8 border border-red-900/20 bg-red-950/10 rounded-3xl">
                                <h4 className="text-red-500 font-bold mb-2 uppercase text-xs tracking-widest flex items-center gap-2"><AlertTriangle size={14}/> Danger Zone</h4>
                                <div className="flex items-center justify-between mt-4">
                                    <p className="text-zinc-500 text-xs">Permanently delete your portfolio and all associated data.</p>
                                    <Button size="sm" className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border-none transition-colors" onClick={() => setShowDeleteModal(true)}>
                                        Delete Account
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
        
        {/* ... Portals ... */}
        <AnimatePresence>
            {toast && toast.show && (
                createPortal(
                    <motion.div 
                        initial={{ opacity: 0, y: 20, scale: 0.9 }} 
                        animate={{ opacity: 1, y: 0, scale: 1 }} 
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[2000] bg-zinc-900 text-white pl-4 pr-2 py-2 rounded-full shadow-2xl flex items-center gap-4 border border-zinc-800 backdrop-blur-md"
                    >
                        <span className="text-xs font-medium text-zinc-200">{toast.message}</span>
                        {toast.undoData && (
                            <>
                                <div className="h-4 w-px bg-zinc-800"></div>
                                <button onClick={handleUndo} className="text-indigo-400 text-xs font-bold uppercase tracking-wider hover:text-indigo-300 hover:bg-indigo-500/10 px-3 py-1.5 rounded-full transition-colors flex items-center gap-2">
                                    <RotateCcw size={12}/> Undo
                                </button>
                            </>
                        )}
                        <button onClick={() => setToast(null)} className="p-1 hover:bg-zinc-800 rounded-full text-zinc-500 hover:text-white transition-colors">
                            <X size={14}/>
                        </button>
                    </motion.div>, document.body
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
            </div>, document.body
        )}

        {cropModal.open && createPortal(
            <div className="fixed inset-0 z-[1000] bg-black flex flex-col p-8">
                <div className="flex-1 relative bg-zinc-900 rounded-3xl overflow-hidden">
                    <Cropper image={cropModal.src!} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(_, p) => setCroppedPixels(p)} />
                </div>
                <div className="py-8 flex justify-center gap-4">
                    <Button variant="outline" onClick={() => setCropModal({ open: false, src: null })}>Cancel</Button>
                    <Button disabled={uploadStatus?.id === 'profile'} onClick={async () => {
                        if (!cropModal.src || !croppedPixels) return;
                        setUploadStatus({ id: 'profile', progress: 0 });
                        try {
                            const blob = await getCroppedImg(cropModal.src, croppedPixels);
                            const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
                            const downloadUrl = await uploadFileToStorage(file, `users/${data.uid}/profile/avatar_${Date.now()}.jpg`, (p) => setUploadStatus({ id: 'profile', progress: p }));
                            updateField('profileImage', downloadUrl);
                            setCropModal({ open: false, src: null });
                        } catch (e) { console.error(e); } finally { setUploadStatus(null); }
                    }}>
                        {uploadStatus?.id === 'profile' ? <Loader2 className="animate-spin" /> : 'Save Photo'}
                    </Button>
                </div>
            </div>, document.body
        )}
    </div>
  );
};