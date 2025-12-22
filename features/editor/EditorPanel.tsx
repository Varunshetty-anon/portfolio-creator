import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, LayoutGroup, Reorder } from 'framer-motion';
import { PortfolioData, Project, Album } from '../../types';
import { Input, TextArea } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ToolSelector } from '../../components/ToolSelector';
import { ImageCropper } from '../../components/ImageCropper';
import { Plus, Trash2, Video, Upload, ChevronDown, Loader2, CheckCircle2, AlertTriangle, Eye, Settings, LogOut, Wrench, LayoutDashboard, User, X, Link, Youtube, HardDrive, Database, Globe, ExternalLink, QrCode, Download, Copy, Link2, Check, Play, GripVertical, FolderPlus, Folder, FileVideo, Instagram, Twitter, Linkedin, MonitorPlay } from 'lucide-react';
import { uploadFileToStorage, getVideoMetadata, getPortfolioStats, PROJECT_CONTENT_TYPES, EDITING_TOOLS_LIST, downloadQrCode, generateThumbnailFromVideo, getDirectVideoUrl } from '../../lib/utils';

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

const PublishButton = ({ onPublish }: { onPublish: () => Promise<void> }) => {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
    const handleClick = async () => {
        setStatus('loading');
        try { await onPublish(); setStatus('success'); setTimeout(() => setStatus('idle'), 2500); } catch (e) { setStatus('idle'); }
    };
    return (
        <Button size="sm" onClick={handleClick} disabled={status === 'loading'} className={`transition-all rounded-full px-6 text-xs font-bold ${status === 'success' ? 'bg-green-600 text-white' : 'bg-white text-black hover:bg-zinc-200'}`}>
            {status === 'loading' ? <Loader2 className="animate-spin" size={14}/> : status === 'success' ? 'Live' : 'Publish'}
        </Button>
    );
}

const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) => (
    <div className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-700 transition-all" onClick={() => onChange(!checked)}>
        <span className="text-sm font-medium text-zinc-300">{label}</span>
        <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${checked ? 'bg-green-500' : 'bg-zinc-800'}`}>
            <motion.div 
                animate={{ x: checked ? 24 : 0 }}
                className="w-4 h-4 bg-white rounded-full shadow-md"
            />
        </div>
    </div>
);

const ProjectCardEditor: React.FC<{ project: Project; albums: Album[]; onChange: (p: Partial<Project>) => void; onDelete: () => void; onAutoSave: () => void }> = ({ project, albums, onChange, onDelete, onAutoSave }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [linkStatus, setLinkStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');

    // Link Validation & Auto-Save Logic
    const handleLinkChange = async (val: string) => {
        const directUrl = getDirectVideoUrl(val);
        onChange({ link: directUrl });
        
        if (!directUrl) {
            setLinkStatus('idle');
            return;
        }

        if (directUrl.length < 8) {
             setLinkStatus('invalid');
             return;
        }

        setLinkStatus('validating');

        const timer = setTimeout(async () => {
            try {
                const m = await getVideoMetadata(directUrl);
                if (m.thumbnail) {
                    onChange({ link: directUrl, thumbnail: m.thumbnail, aspectRatio: m.aspectRatio });
                    setLinkStatus('valid');
                    onAutoSave();
                } else {
                    setLinkStatus('valid');
                }
            } catch (e) {
                setLinkStatus('invalid');
            }
        }, 1000);

        return () => clearTimeout(timer);
    };

    return (
        <div className={`bg-zinc-900/50 border rounded-xl overflow-visible transition-all duration-300 ${isExpanded ? 'border-zinc-700 bg-zinc-900' : 'border-zinc-800 hover:border-zinc-700'}`}>
             <div className="p-4 flex gap-4 items-start cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                 <div className="w-40 aspect-video bg-black rounded-lg border border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center relative group">
                    {project.thumbnail ? <img src={project.thumbnail} className="w-full h-full object-cover"/> : <Video size={16} className="text-zinc-700"/>}
                    {linkStatus === 'validating' && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 size={12} className="animate-spin text-white"/></div>}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white truncate">{project.title || "Untitled Project"}</h4>
                        {linkStatus === 'valid' && <CheckCircle2 size={12} className="text-green-500" />}
                    </div>
                    <p className="text-xs text-zinc-500 mt-1 truncate">{project.contentType || "Video"} • {project.link ? "Linked" : "No Link"}</p>
                    {project.albumId && (
                        <span className="inline-block mt-2 px-2 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-400 border border-zinc-700">
                            {albums.find(a => a.id === project.albumId)?.title || 'Unknown Album'}
                        </span>
                    )}
                </div>
                <button onClick={(e) => {e.stopPropagation(); onDelete();}} className="p-2 text-zinc-600 hover:text-red-500"><Trash2 size={14}/></button>
             </div>

             <AnimatePresence>
                 {isExpanded && (
                     <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="border-t border-zinc-800 bg-zinc-900/30 overflow-hidden">
                         <div className="p-5 space-y-4">
                             <Input label="Title" value={project.title} onChange={e => onChange({ title: e.target.value })} />
                             
                             <div className="relative">
                                <Input 
                                    label="Video Link" 
                                    value={project.link} 
                                    onChange={e => handleLinkChange(e.target.value)} 
                                    placeholder="YouTube, Vimeo, Drive..." 
                                    className={`pr-10 transition-colors ${linkStatus === 'invalid' ? 'border-red-500 focus:border-red-500' : linkStatus === 'valid' ? 'border-green-500/50 focus:border-green-500' : ''}`}
                                />
                                <div className="absolute right-3 top-[34px]">
                                    {linkStatus === 'validating' && <Loader2 size={14} className="animate-spin text-zinc-500" />}
                                    {linkStatus === 'valid' && <Check size={14} className="text-green-500" />}
                                    {linkStatus === 'invalid' && <AlertTriangle size={14} className="text-red-500" />}
                                </div>
                             </div>

                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Type</label>
                                    <select 
                                        value={project.contentType} 
                                        onChange={e => onChange({ contentType: e.target.value })}
                                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-200 text-sm focus:outline-none focus:border-zinc-600"
                                    >
                                        {PROJECT_CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Folder</label>
                                    <select 
                                        value={project.albumId || ''} 
                                        onChange={e => onChange({ albumId: e.target.value || undefined })}
                                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-200 text-sm focus:outline-none focus:border-zinc-600"
                                    >
                                        <option value="">Uncategorized</option>
                                        {albums.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                                    </select>
                                </div>
                             </div>

                             <TextArea label="Description" value={project.description} onChange={e => onChange({ description: e.target.value })} rows={3} />
                             
                             <div>
                                 <label className="block text-[10px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Tools Used</label>
                                 <div className="flex flex-wrap gap-2">
                                     {EDITING_TOOLS_LIST.map(tool => (
                                         <button 
                                            key={tool.name}
                                            onClick={() => {
                                                const exists = project.softwareUsed?.includes(tool.name);
                                                const newVal = exists ? project.softwareUsed?.filter(t => t !== tool.name) : [...(project.softwareUsed || []), tool.name];
                                                onChange({ softwareUsed: newVal });
                                            }}
                                            className={`px-3 py-1 rounded-full text-xs border transition-all ${project.softwareUsed?.includes(tool.name) ? 'bg-white text-black border-white font-bold' : 'bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-600'}`}
                                         >
                                             {tool.name}
                                         </button>
                                     ))}
                                 </div>
                             </div>
                         </div>
                     </motion.div>
                 )}
             </AnimatePresence>
        </div>
    );
};

export const EditorPanel: React.FC<EditorPanelProps> = ({ 
    data, onChange, onSave, onPublish, isSaving, hasUnsavedChanges, onLogout, onDeleteAccount, onPreview 
}) => {
    const [activeTab, setActiveTab] = useState<'profile' | 'projects' | 'design'>('profile');
    const [stats, setStats] = useState({ views: 0, clicks: 0 });
    const [linkCopied, setLinkCopied] = useState(false);
    const [cropperState, setCropperState] = useState<{ isOpen: boolean; img: string | null }>({ isOpen: false, img: null });

    useEffect(() => {
        if (data.uid) getPortfolioStats(data.uid).then(setStats);
    }, [data.uid]);

    const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = () => setCropperState({ isOpen: true, img: reader.result as string });
            reader.readAsDataURL(file);
        }
    };

    const handleCropComplete = async (blob: Blob) => {
        const file = new File([blob], 'profile.jpg', { type: 'image/jpeg' });
        try {
            const url = await uploadFileToStorage(file, `users/${data.uid}/profile/avatar_${Date.now()}.jpg`);
            onChange({ ...data, profileImage: url });
            setCropperState({ isOpen: false, img: null });
        } catch (e) {
            console.error("Upload failed", e);
        }
    };

    const getPortfolioUrl = () => {
        return `${window.location.origin}/#/v/${data.settings?.username}`;
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(getPortfolioUrl());
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
    };

    const handleDownloadQr = () => {
        const url = getPortfolioUrl();
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
        downloadQrCode(qrUrl, 'portfolio-qr.png');
    };

    const addProject = () => {
        const newProject: Project = {
            id: Date.now().toString(),
            title: '',
            description: '',
            thumbnail: '',
            link: '',
            category: 'Showreel',
            type: 'video',
            contentType: 'Brand Trailer',
            softwareUsed: []
        };
        onChange({ ...data, projects: [newProject, ...(data.projects || [])] });
    };

    const updateProject = (id: string, updates: Partial<Project>) => {
        const updated = data.projects.map(p => p.id === id ? { ...p, ...updates } : p);
        onChange({ ...data, projects: updated });
    };

    const deleteProject = (id: string) => {
        onChange({ ...data, projects: data.projects.filter(p => p.id !== id) });
    };

    const addAlbum = () => {
        const title = prompt("Album Name:");
        if (title) {
            const newAlbum: Album = { id: Date.now().toString(), title };
            onChange({ ...data, albums: [...(data.albums || []), newAlbum] });
        }
    };

    const deleteAlbum = (id: string) => {
        if (confirm("Delete album? Projects will become uncategorized.")) {
            onChange({ ...data, albums: data.albums?.filter(a => a.id !== id) });
        }
    }

    return (
        <div className="flex h-screen bg-[#050505] text-white font-sans overflow-hidden">
            {cropperState.isOpen && cropperState.img && (
                <ImageCropper imageSrc={cropperState.img} onCancel={() => setCropperState({ isOpen: false, img: null })} onCropComplete={handleCropComplete} />
            )}

            <aside className="w-20 lg:w-64 border-r border-zinc-900 flex flex-col justify-between bg-zinc-950 z-20">
                <div>
                    <div className="p-6 flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded flex items-center justify-center font-black text-black">F</div>
                        <span className="hidden lg:block font-bold text-lg tracking-tight">Frames.</span>
                    </div>
                    <nav className="px-3 space-y-1">
                        {[
                            { id: 'profile', icon: User, label: 'Profile' },
                            { id: 'projects', icon: LayoutDashboard, label: 'Projects' },
                            { id: 'design', icon: Wrench, label: 'Settings' }
                        ].map(item => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id as any)}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${activeTab === item.id ? 'bg-zinc-900 text-white shadow-inner' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'}`}
                            >
                                <item.icon size={20} />
                                <span className="hidden lg:block text-sm font-medium">{item.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="p-4 border-t border-zinc-900 space-y-2">
                    <div className="hidden lg:block p-3 bg-zinc-900/50 rounded-lg border border-zinc-800 mb-2">
                         <div className="flex items-center gap-2 mb-1">
                             <Eye size={14} className="text-zinc-500" />
                             <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Views</span>
                         </div>
                         <span className="text-xl font-mono font-bold">{stats.views}</span>
                    </div>
                    {onPreview && (
                        <button onClick={onPreview} className="w-full flex items-center justify-center lg:justify-start gap-3 p-3 text-zinc-500 hover:text-white transition-colors rounded-lg hover:bg-zinc-900/50">
                            <MonitorPlay size={18} />
                            <span className="hidden lg:block text-sm">Preview</span>
                        </button>
                    )}
                     <button onClick={onLogout} className="w-full flex items-center justify-center lg:justify-start gap-3 p-3 text-red-500/70 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10">
                        <LogOut size={18} />
                        <span className="hidden lg:block text-sm">Sign Out</span>
                    </button>
                </div>
            </aside>

            <main className="flex-1 flex flex-col min-w-0 bg-[#050505] relative">
                <header className="h-16 border-b border-zinc-900 flex items-center justify-between px-6 bg-[#050505]/80 backdrop-blur-md z-10 sticky top-0">
                    <div className="flex items-center gap-4">
                        <h2 className="font-display font-bold text-lg capitalize">{activeTab}</h2>
                        {hasUnsavedChanges && <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded border border-yellow-500/20 animate-pulse">Unsaved</span>}
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex items-center gap-2 mr-4 text-xs text-zinc-500">
                             <span className={isSaving ? "opacity-100" : "opacity-0 transition-opacity"}>{isSaving ? "Saving..." : "Saved"}</span>
                        </div>
                        
                        {data.meta?.publish?.isPublished && (
                            <div className="hidden md:flex items-center gap-1 mr-2 px-2 py-1 bg-zinc-900 rounded-lg border border-zinc-800">
                                <a 
                                    href={getPortfolioUrl()} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
                                >
                                    <ExternalLink size={12} />
                                    Open
                                </a>
                                <div className="w-px h-4 bg-zinc-800"></div>
                                <button 
                                    onClick={handleCopyLink}
                                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
                                >
                                    {linkCopied ? <Check size={12} className="text-green-500"/> : <Link2 size={12} />}
                                    {linkCopied ? 'Copied' : 'Copy'}
                                </button>
                                <div className="w-px h-4 bg-zinc-800"></div>
                                <button 
                                    onClick={handleDownloadQr}
                                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
                                    title="Download QR"
                                >
                                    <QrCode size={12} />
                                </button>
                            </div>
                        )}

                        <Button size="sm" variant="secondary" onClick={() => onSave()}>Save Draft</Button>
                        <PublishButton onPublish={onPublish} />
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10">
                    <div className="max-w-4xl mx-auto space-y-12 pb-24">
                        
                        {activeTab === 'profile' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                                <section className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                    <div className="md:col-span-4 flex flex-col items-center text-center gap-4">
                                        <div className="relative group w-40 h-40 rounded-full bg-zinc-900 border-2 border-dashed border-zinc-700 hover:border-zinc-500 transition-colors overflow-hidden flex items-center justify-center cursor-pointer">
                                            {data.profileImage ? (
                                                <img src={data.profileImage} className="w-full h-full object-cover" alt="Profile"/>
                                            ) : (
                                                <User size={32} className="text-zinc-600"/>
                                            )}
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-xs font-medium">
                                                <Upload size={20} className="mb-1"/>
                                                <span>Change Photo</span>
                                            </div>
                                            <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleProfileImageUpload} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Availability</p>
                                            <Toggle 
                                                label={data.availability?.status ? "Available for work" : "Unavailable"} 
                                                checked={data.availability?.status || false} 
                                                onChange={v => onChange({...data, availability: { ...data.availability, status: v }})}
                                            />
                                        </div>
                                    </div>
                                    <div className="md:col-span-8 space-y-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input label="Display Name" value={data.name} onChange={e => onChange({...data, name: e.target.value})} />
                                            <Input label="Role / Title" value={data.role} onChange={e => onChange({...data, role: e.target.value})} />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input label="Location" value={data.location} onChange={e => onChange({...data, location: e.target.value})} />
                                            <Input label="Languages" value={data.languages} onChange={e => onChange({...data, languages: e.target.value})} />
                                        </div>
                                        <TextArea label="Bio" value={data.bio} onChange={e => onChange({...data, bio: e.target.value})} rows={4} />
                                        <Input label="Contact Email" value={data.contactEmail} onChange={e => onChange({...data, contactEmail: e.target.value})} />
                                    </div>
                                </section>
                                
                                <div className="h-px bg-zinc-900 w-full" />

                                <section className="space-y-6">
                                    <h3 className="text-xl font-display font-bold text-white">Socials</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input label="Instagram" placeholder="@username" value={data.socials?.instagram || ''} onChange={e => onChange({...data, socials: {...data.socials, instagram: e.target.value} as any})} icon={<Instagram size={14}/>} />
                                        <Input label="Twitter / X" placeholder="@username" value={data.socials?.twitter || ''} onChange={e => onChange({...data, socials: {...data.socials, twitter: e.target.value} as any})} icon={<Twitter size={14}/>} />
                                        <Input label="LinkedIn" placeholder="username" value={data.socials?.linkedin || ''} onChange={e => onChange({...data, socials: {...data.socials, linkedin: e.target.value} as any})} icon={<Linkedin size={14}/>} />
                                        <Input label="YouTube" placeholder="@channel" value={data.socials?.youtube || ''} onChange={e => onChange({...data, socials: {...data.socials, youtube: e.target.value} as any})} icon={<Youtube size={14}/>} />
                                        <Input label="Discord" placeholder="username#0000 or Server" value={data.socials?.discord || ''} onChange={e => onChange({...data, socials: {...data.socials, discord: e.target.value} as any})} icon={<Globe size={14}/>} />
                                    </div>
                                </section>
                            </motion.div>
                        )}

                        {activeTab === 'projects' && (
                             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-zinc-900/30 border border-zinc-800 rounded-2xl">
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Folders & Organization</h3>
                                        <p className="text-zinc-500 text-sm mt-1">Group your projects into albums (e.g., Commercials, Music Videos).</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {data.albums?.map(album => (
                                            <div key={album.id} className="group relative px-3 py-1.5 bg-zinc-800 rounded-lg text-xs font-medium text-zinc-300 flex items-center gap-2 border border-zinc-700">
                                                <Folder size={12}/>
                                                {album.title}
                                                <button onClick={() => deleteAlbum(album.id)} className="hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>
                                            </div>
                                        ))}
                                        <button onClick={addAlbum} className="p-2 bg-white text-black rounded-lg hover:bg-zinc-200 transition-colors"><FolderPlus size={16}/></button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-bold text-white">Project List</h3>
                                        <Button onClick={addProject} icon={<Plus size={16}/>}>Add Project</Button>
                                    </div>
                                    
                                    <Reorder.Group axis="y" values={data.projects || []} onReorder={(newOrder) => onChange({...data, projects: newOrder})} className="space-y-3">
                                        {data.projects?.map(project => (
                                            <Reorder.Item key={project.id} value={project}>
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-4 cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400"><GripVertical size={20}/></div>
                                                    <div className="flex-1 min-w-0">
                                                        <ProjectCardEditor 
                                                            project={project} 
                                                            albums={data.albums || []}
                                                            onChange={(updates) => updateProject(project.id, updates)} 
                                                            onDelete={() => deleteProject(project.id)}
                                                            onAutoSave={() => onSave()}
                                                        />
                                                    </div>
                                                </div>
                                            </Reorder.Item>
                                        ))}
                                    </Reorder.Group>
                                    
                                    {(!data.projects || data.projects.length === 0) && (
                                        <div className="text-center py-16 border-2 border-dashed border-zinc-900 rounded-2xl">
                                            <p className="text-zinc-500 mb-4">No projects yet.</p>
                                            <Button variant="outline" onClick={addProject}>Create Your First Project</Button>
                                        </div>
                                    )}
                                </div>
                             </motion.div>
                        )}

                        {activeTab === 'design' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                                <section>
                                     <h3 className="text-xl font-bold text-white mb-6">Tools & Skills</h3>
                                     <div className="space-y-8">
                                        <div>
                                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 block">Software Stack</label>
                                            <ToolSelector 
                                                type="editing"
                                                selectedTools={data.tools || []}
                                                primaryTool={data.primaryTool}
                                                onSelect={(tools) => onChange({...data, tools})}
                                                onSetPrimary={(tool) => onChange({...data, primaryTool: tool})}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3 block">AI Tools</label>
                                            <ToolSelector 
                                                type="ai"
                                                selectedTools={data.aiTools || []}
                                                onSelect={(tools) => onChange({...data, aiTools: tools})}
                                            />
                                        </div>
                                     </div>
                                </section>

                                <div className="h-px bg-zinc-900 w-full" />

                                <section>
                                    <h3 className="text-xl font-bold text-white mb-6">Account Actions</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 border border-red-900/30 bg-red-900/10 rounded-xl">
                                            <div>
                                                <h4 className="font-bold text-red-500 text-sm">Delete Portfolio</h4>
                                                <p className="text-red-400/60 text-xs mt-1">Permanently remove your site and data.</p>
                                            </div>
                                            <Button variant="outline" size="sm" onClick={() => { if(confirm("Are you sure? This cannot be undone.")) onDeleteAccount?.(); }} className="border-red-900/50 text-red-500 hover:bg-red-950">Delete</Button>
                                        </div>
                                    </div>
                                </section>
                            </motion.div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};