import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PortfolioData, Project, Testimonial } from '../types';
import { Input, TextArea } from './ui/Input';
import { Button } from './ui/Button';
import { ToolSelector } from './ToolSelector';
import { Plus, Trash2, Video, Wand2, Image as ImageIcon, ChevronDown, Upload, X, LayoutDashboard, Copy, ExternalLink, User, MessageSquare, Loader2, CheckCircle2, Globe, Crop, Settings, LogOut, AlertCircle, Sparkles, Wrench, ZoomIn, ZoomOut, QrCode, Download, AlertTriangle, Eye, Monitor, Smartphone, HelpCircle, Info, BarChart3, MousePointerClick } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { getCroppedImg, generateThumbnailFromVideo, uploadFileToStorage, hasCloudStorage, generateAiBio, generateAiDescription, checkPortfolioReadiness, downloadQrCode, getYouTubeThumbnail, getDriveThumbnail, generateAiThumbnail, getPortfolioStats } from '../utils';

interface EditorPanelProps {
  data: PortfolioData;
  onChange: (newData: PortfolioData) => void;
  onPublish: () => void;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  onLogout?: () => void;
  onDeleteAccount?: () => void;
  onPreview?: () => void;
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

export const EditorPanel: React.FC<EditorPanelProps> = ({ data, onChange, onPublish, isSaving, hasUnsavedChanges, onLogout, onDeleteAccount, onPreview }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile' | 'content' | 'testimonials' | 'tools' | 'settings'>('dashboard');
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<{ id: string; progress: number } | null>(null);
  const [linkValidation, setLinkValidation] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [stats, setStats] = useState({ views: 0, clicks: 0 });
  
  // Image Crop State
  const [cropModal, setCropModal] = useState<{ open: boolean; src: string | null }>({ open: false, src: null });
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedPixels, setCroppedPixels] = useState<any>(null);

  useEffect(() => {
      if (activeTab === 'dashboard' && data.uid) {
          getPortfolioStats(data.uid).then(setStats);
      }
  }, [activeTab, data.uid]);

  const updateField = (f: keyof PortfolioData, v: any) => onChange({ ...data, [f]: v });
  const updateProject = (id: string, updates: Partial<Project>) => {
      onChange({ ...data, projects: data.projects.map(p => p.id === id ? { ...p, ...updates } : p) });
  };

  const handleProjectVideo = async (projectId: string, file: File) => {
    const localUrl = URL.createObjectURL(file);
    const tempProjects = data.projects.map(p => p.id === projectId ? { ...p, link: localUrl } : p);
    onChange({ ...data, projects: tempProjects });
    
    setUploadStatus({ id: projectId, progress: 1 });

    try {
        const downloadUrl = await uploadFileToStorage(
            file, 
            `users/${data.uid}/projects/${projectId}_${Date.now()}.mp4`, 
            (p) => setUploadStatus({ id: projectId, progress: p })
        );
        const finalProjects = data.projects.map(p => p.id === projectId ? { ...p, link: downloadUrl } : p);
        onChange({ ...data, projects: finalProjects });
    } finally { 
        setUploadStatus(null); 
    }
  };

  const handleShowreel = async (file: File) => {
    const localUrl = URL.createObjectURL(file);
    updateField('showreelLink', localUrl);
    
    setUploadStatus({ id: 'showreel', progress: 1 });
    
    try {
        const downloadUrl = await uploadFileToStorage(
            file, 
            `users/${data.uid}/showreels/main_${Date.now()}.mp4`, 
            (p) => setUploadStatus({ id: 'showreel', progress: p })
        );
        updateField('showreelLink', downloadUrl);
    } finally { 
        setUploadStatus(null); 
    }
  };

  const getShareLink = () => {
      const baseUrl = window.location.origin;
      return `${baseUrl}/#${data.username}`; 
  };
  
  const getQrUrl = () => {
      return `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(getShareLink())}&format=png`;
  }

  // Simulate link validation animation
  const handleLinkInput = (id: string, val: string) => {
      updateProject(id, { link: val });
      setLinkValidation(id);
      setTimeout(() => setLinkValidation(null), 1500);
  };

  return (
    <div className="h-screen flex flex-col bg-black text-white overflow-hidden">
        {/* Header */}
        <header className="p-4 border-b border-zinc-800 bg-zinc-950 flex justify-between items-center z-50">
            <div className="flex items-baseline gap-2">
                <h2 className="text-xl font-display font-black tracking-tighter">FRAMES</h2>
                <span className="text-[9px] bg-white text-black px-1.5 font-bold rounded">STUDIO</span>
            </div>
            <div className="flex items-center gap-4">
                {hasUnsavedChanges && <span className="text-[10px] text-orange-500 font-bold animate-pulse">UNSAVED</span>}
                <Button size="sm" onClick={onPublish} disabled={isSaving}>{isSaving ? <Loader2 className="animate-spin" size={14}/> : 'Save Changes'}</Button>
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

        {/* Main Layout */}
        <div className="flex-1 flex overflow-hidden">
            {/* Sidebar Tabs */}
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

            {/* Scrollable Editor Area */}
            <main className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.05),transparent)]">
                <div className="max-w-3xl mx-auto space-y-12">
                    {activeTab === 'dashboard' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                            <div className="bg-indigo-500/10 border border-indigo-500/20 p-8 rounded-3xl space-y-4">
                                <h3 className="text-xl font-bold">Your Portfolio is Live</h3>
                                <p className="text-zinc-400 text-sm">Share this unique URL with clients and recruiters. Updates are instant after saving.</p>
                                <div className="flex items-center gap-3 bg-black/50 p-4 rounded-xl border border-zinc-800">
                                    <Globe size={16} className="text-indigo-500" />
                                    <code className="text-xs text-zinc-300 flex-1 truncate">{getShareLink()}</code>
                                    <Button size="sm" onClick={() => { navigator.clipboard.writeText(getShareLink()); alert("Copied!"); }}>Copy</Button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                     <Button variant="outline" className="w-full py-6 border-dashed" onClick={() => window.open(getShareLink(), '_blank')}>Open Public Portfolio <ExternalLink size={14} className="ml-2"/></Button>
                                     <Button variant="outline" className="w-full py-6 border-dashed" onClick={() => setShowQr(true)}>Get QR Code <QrCode size={14} className="ml-2"/></Button>
                                </div>
                            </div>
                            
                            {/* Analytics Stats */}
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
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Showreel</h3>
                                
                                <div className="relative">
                                    {uploadStatus?.id === 'showreel' && (
                                        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10 rounded-xl backdrop-blur-sm">
                                            <div className="flex flex-col items-center gap-2">
                                                <Loader2 className="animate-spin text-indigo-500" size={24}/>
                                                <span className="text-[10px] uppercase font-bold text-white">Uploading {Math.round(uploadStatus.progress)}%</span>
                                            </div>
                                        </div>
                                    )}

                                    <Button className="w-full h-32 border-2 border-dashed border-zinc-800 bg-zinc-950 hover:border-indigo-500 group relative overflow-hidden" variant="ghost" onClick={() => {
                                        const input = document.createElement('input');
                                        input.type = 'file';
                                        input.onchange = (e: any) => handleShowreel(e.target.files[0]);
                                        input.click();
                                    }}>
                                        <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <Upload className="mr-2 group-hover:scale-110 transition-transform"/> 
                                        {data.showreelLink ? 'Replace Showreel' : 'Upload Showreel'}
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Projects</h3>
                                    <Button size="sm" onClick={() => updateField('projects', [...data.projects, { id: Date.now().toString(), title: "New Project", description: "Edit summary", thumbnail: "", link: "", category: "Work", type: "video" }])}><Plus size={14}/> Add</Button>
                                </div>
                                <div className="space-y-4">
                                    {data.projects.map(p => (
                                        <div key={p.id} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl flex gap-4 relative overflow-hidden group/card">
                                            
                                            {/* Project Progress Overlay */}
                                            {uploadStatus?.id === p.id && (
                                                <div className="absolute inset-0 bg-black/80 z-20 flex items-center justify-center backdrop-blur-sm">
                                                    <div className="w-full max-w-[50%]">
                                                        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden mb-2">
                                                            <motion.div 
                                                                className="h-full bg-indigo-500" 
                                                                initial={{ width: 0 }} 
                                                                animate={{ width: `${uploadStatus.progress}%` }} 
                                                            />
                                                        </div>
                                                        <p className="text-center text-[10px] font-bold">Uploading...</p>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="w-24 h-24 bg-black rounded-lg overflow-hidden shrink-0 border border-zinc-800"><img src={p.thumbnail} className="w-full h-full object-cover"/></div>
                                            <div className="flex-1 space-y-2">
                                                <input className="bg-transparent border-none p-0 text-white font-bold w-full focus:ring-0" value={p.title} onChange={e => updateProject(p.id, { title: e.target.value })} />
                                                <div className="flex gap-2">
                                                    <select 
                                                        value={p.type} 
                                                        onChange={e => updateProject(p.id, { type: e.target.value as 'video'|'image' })}
                                                        className="bg-black text-[10px] text-zinc-400 border border-zinc-800 rounded px-1"
                                                    >
                                                        <option value="video">Video</option>
                                                        <option value="image">Image</option>
                                                    </select>
                                                    <input className="bg-transparent border-none p-0 text-zinc-500 text-xs w-full focus:ring-0" value={p.category} onChange={e => updateProject(p.id, { category: e.target.value })} placeholder="Category" />
                                                </div>
                                                
                                                <div className="flex gap-2 pt-1 items-center">
                                                    {p.type === 'video' ? (
                                                        <>
                                                            <Button size="sm" variant="outline" className="h-8 text-[10px]" onClick={() => {
                                                                const input = document.createElement('input');
                                                                input.type = 'file';
                                                                input.accept = 'video/*';
                                                                input.onchange = (e: any) => handleProjectVideo(p.id, e.target.files[0]);
                                                                input.click();
                                                            }}>Upload</Button>
                                                            <div className="relative flex-1">
                                                                <Input 
                                                                    value={p.link} 
                                                                    onChange={e => handleLinkInput(p.id, e.target.value)} 
                                                                    placeholder="Drive/YouTube Link"
                                                                    className="h-8 text-[10px] py-1"
                                                                />
                                                                <AnimatePresence>
                                                                    {linkValidation === p.id && (
                                                                        <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="absolute right-2 top-1/2 -translate-y-1/2 text-green-500">
                                                                            <Loader2 className="animate-spin" size={12} />
                                                                        </motion.div>
                                                                    )}
                                                                </AnimatePresence>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <Button size="sm" variant="outline" className="h-8 text-[10px]" onClick={() => {
                                                            const input = document.createElement('input');
                                                            input.type = 'file';
                                                            input.accept = 'image/*';
                                                            input.onchange = (e: any) => {
                                                                const file = e.target.files[0];
                                                                const url = URL.createObjectURL(file);
                                                                updateProject(p.id, { link: url, thumbnail: url }); 
                                                                 uploadFileToStorage(file, `users/${data.uid}/projects/${p.id}_img_${Date.now()}`).then(url => {
                                                                     updateProject(p.id, { link: url, thumbnail: url });
                                                                 });
                                                            };
                                                            input.click();
                                                        }}>Upload Image</Button>
                                                    )}
                                                    
                                                    <Button size="sm" variant="ghost" className="h-8 text-[10px] text-red-500" onClick={() => updateField('projects', data.projects.filter(proj => proj.id !== p.id))}><Trash2 size={12}/></Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
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
                            <div className="p-6 border border-red-900/20 bg-red-900/5 rounded-2xl">
                                <h4 className="text-red-500 font-bold mb-2 uppercase text-xs tracking-widest flex items-center gap-2"><AlertTriangle size={14}/> Danger Zone</h4>
                                {!confirmDelete ? (
                                    <Button variant="ghost" className="text-red-500 text-xs p-0 h-auto" onClick={() => setConfirmDelete(true)}>Delete Portfolio and Data permanently</Button>
                                ) : (
                                    <div className="flex items-center gap-4 mt-2">
                                        <p className="text-[10px] text-red-400 font-bold flex-1 uppercase">Warning: This cannot be undone.</p>
                                        <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Button>
                                        <Button size="sm" className="bg-red-600 text-white hover:bg-red-700 border-none" onClick={onDeleteAccount}>Wipe Everything</Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>

        {/* Image Cropper Portal */}
        {cropModal.open && createPortal(
            <div className="fixed inset-0 z-[1000] bg-black flex flex-col p-8">
                <div className="flex-1 relative bg-zinc-900 rounded-3xl overflow-hidden">
                    <Cropper image={cropModal.src!} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(_, p) => setCroppedPixels(p)} />
                </div>
                <div className="py-8 flex justify-center gap-4">
                    <Button variant="outline" onClick={() => setCropModal({ open: false, src: null })}>Cancel</Button>
                    <Button onClick={async () => {
                        const blob = await getCroppedImg(cropModal.src!, croppedPixels);
                        const url = URL.createObjectURL(blob);
                        updateField('profileImage', url);
                        setCropModal({ open: false, src: null });
                        const uploadUrl = await uploadFileToStorage(new File([blob], 'profile.jpg'), `users/${data.uid}/profile_${Date.now()}.jpg`);
                        updateField('profileImage', uploadUrl);
                    }}>Save Photo</Button>
                </div>
            </div>,
            document.body
        )}
    </div>
  );
};