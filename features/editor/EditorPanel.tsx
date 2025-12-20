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

const PublishButton = ({ onPublish }: { onPublish: () => Promise<void> }) => {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

    const handleClick = async () => {
        setStatus('loading');
        try {
            await onPublish();
            setStatus('success');
            setTimeout(() => setStatus('idle'), 2500);
        } catch (e) {
            setStatus('idle');
        }
    };

    return (
        <Button 
            size="sm" onClick={handleClick} disabled={status === 'loading'} 
            className={`transition-all duration-300 border-none ${status === 'success' ? 'bg-green-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-500'} font-bold min-w-[120px] rounded-full`}
        >
            <AnimatePresence mode="wait">
                {status === 'loading' ? <motion.div key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><Loader2 className="animate-spin" size={14}/></motion.div> :
                 status === 'success' ? <motion.div key="s" initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="flex items-center gap-2"><CheckCircle2 size={14} /> Live</motion.div> :
                 <motion.div key="i" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Go Live</motion.div>}
            </AnimatePresence>
        </Button>
    );
}

const getLinkIndicator = (url: string) => {
    if (!url) return null;
    const lower = url.toLowerCase();
    if (lower.includes('youtube.com') || lower.includes('youtu.be')) return { icon: Youtube, color: 'text-red-500', label: 'YouTube', border: 'border-red-900/50' };
    if (lower.includes('drive.google.com')) return { icon: HardDrive, color: 'text-blue-500', label: 'Drive', border: 'border-blue-900/50' };
    if (lower.includes('vimeo.com')) return { icon: Video, color: 'text-sky-500', label: 'Vimeo', border: 'border-sky-900/50' };
    if (lower.includes('dropbox.com')) return { icon: Database, color: 'text-indigo-400', label: 'Dropbox', border: 'border-indigo-900/50' };
    return { icon: Link, color: 'text-emerald-500', label: 'URL', border: 'border-emerald-900/50' };
};

const ProjectCardEditor: React.FC<{ project: Project; onChange: (p: Partial<Project>) => void; onDelete: () => void; onUploadImage: (file: File) => void; uploadStatus: any }> = ({ 
    project, onChange, onDelete, onUploadImage, uploadStatus
}) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const linkStatus = getLinkIndicator(project.link);
    const [isValidating, setIsValidating] = useState(false);

    const handleLinkChange = (val: string) => {
        onChange({ link: val });
        if (val.length > 10) {
            setIsValidating(true);
            setTimeout(async () => {
                const metadata = await getVideoMetadata(val);
                if (metadata.thumbnail) onChange({ thumbnail: metadata.thumbnail, aspectRatio: metadata.aspectRatio });
                setIsValidating(false);
            }, 1000);
        }
    };

    return (
        <motion.div layout className={`bg-zinc-900/40 border ${isExpanded ? 'border-zinc-700 ring-1 ring-zinc-800' : 'border-zinc-800'} rounded-2xl overflow-hidden transition-all duration-300`}>
             <div className="p-5 flex flex-col sm:flex-row gap-5 items-start">
                 <div className="w-full sm:w-40 aspect-video bg-black rounded-xl overflow-hidden shrink-0 border border-zinc-800 relative group cursor-pointer">
                    <img src={project.thumbnail || "https://picsum.photos/400/225"} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                    <input type="file" className="hidden" id={`u-${project.id}`} accept="image/*,video/*" onChange={(e) => e.target.files?.[0] && onUploadImage(e.target.files[0])} />
                    <label htmlFor={`u-${project.id}`} className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                        <Upload size={20} className="text-white mb-1"/>
                        <span className="text-[9px] font-black uppercase text-white tracking-widest">Update Media</span>
                    </label>
                    {uploadStatus && (
                        <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm z-30">
                            <Loader2 className="animate-spin text-white" size={20}/>
                        </div>
                    )}
                </div>

                <div className="flex-1 space-y-4 w-full">
                    <div className="flex justify-between items-start">
                        <input className="bg-transparent border-none p-0 text-white font-bold text-lg w-full focus:ring-0 placeholder:text-zinc-700" value={project.title} onChange={e => onChange({ title: e.target.value })} placeholder="Project Title" />
                        <div className="flex gap-2">
                            <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 text-zinc-500 hover:text-white transition-colors"><ChevronDown className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} size={18} /></button>
                            <button onClick={onDelete} className="p-2 text-zinc-700 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                        </div>
                    </div>
                    <div className="relative">
                        <Input value={project.link} onChange={e => handleLinkChange(e.target.value)} placeholder="Link (Drive, YouTube, etc.)" className={`h-10 pr-10 bg-black/40 border-zinc-800 ${linkStatus?.border || ''}`} />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {isValidating ? <Loader2 className="animate-spin text-zinc-500" size={14}/> : linkStatus && <div className={linkStatus.color}><linkStatus.icon size={16}/></div>}
                        </div>
                    </div>
                </div>
             </div>

             <AnimatePresence>
                 {isExpanded && (
                     <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="border-t border-zinc-800 bg-black/20 overflow-hidden">
                         <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="space-y-4">
                                 <TextArea label="Description" value={project.description} onChange={e => onChange({ description: e.target.value })} placeholder="Short summary..." rows={3} className="bg-black/40 text-xs" />
                                 <div className="grid grid-cols-2 gap-4">
                                     <div className="space-y-1">
                                        <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-1">Type</label>
                                        <select value={project.contentType || ''} onChange={e => onChange({ contentType: e.target.value })} className="w-full bg-black/40 border border-zinc-800 rounded-xl px-3 py-2.5 text-zinc-300 text-xs focus:ring-1 focus:ring-zinc-700 outline-none appearance-none">{PROJECT_CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select>
                                     </div>
                                     <div className="space-y-1">
                                        <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-1">Ratio</label>
                                        <select value={project.aspectRatio || '16:9'} onChange={e => onChange({ aspectRatio: e.target.value as any })} className="w-full bg-black/40 border border-zinc-800 rounded-xl px-3 py-2.5 text-zinc-300 text-xs focus:ring-1 focus:ring-zinc-700 outline-none appearance-none"><option value="16:9">16:9</option><option value="9:16">9:16</option><option value="4:3">4:3</option><option value="1:1">1:1</option></select>
                                     </div>
                                 </div>
                             </div>
                             <div className="space-y-1">
                                <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-1">Software Used</label>
                                <div className="grid grid-cols-2 gap-2 h-[150px] overflow-y-auto custom-scrollbar p-1">
                                    {EDITING_TOOLS_LIST.map(tool => (
                                        <button key={tool.name} onClick={() => { const cur = project.softwareUsed || []; onChange({ softwareUsed: cur.includes(tool.name) ? cur.filter(t => t !== tool.name) : [...cur, tool.name] }); }} className={`px-3 py-2 rounded-xl border text-[10px] font-bold text-left transition-all ${project.softwareUsed?.includes(tool.name) ? 'bg-white text-black border-white' : 'bg-black/40 text-zinc-500 border-zinc-800 hover:border-zinc-700'}`}>{tool.name}</button>
                                    ))}
                                </div>
                             </div>
                         </div>
                     </motion.div>
                 )}
             </AnimatePresence>
        </motion.div>
    );
}

export const EditorPanel: React.FC<EditorPanelProps> = ({ data, onChange, onSave, onPublish, isSaving, hasUnsavedChanges, onLogout, onDeleteAccount, onPreview }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile' | 'content' | 'tools' | 'settings'>('dashboard');
  const [uploadStatus, setUploadStatus] = useState<{ id: string; progress: number } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [stats, setStats] = useState({ views: 0, clicks: 0 });
  
  useEffect(() => { if (activeTab === 'dashboard' && data.uid) getPortfolioStats(data.uid).then(setStats); }, [activeTab, data.uid]);

  const updateField = (f: keyof PortfolioData, v: any) => onChange({ ...data, [f]: v });
  const updateProject = (id: string, updates: Partial<Project>) => onChange({ ...data, projects: data.projects.map(p => p.id === id ? { ...p, ...updates } : p) });

  const handleProjectImage = async (projectId: string, file: File) => {
     setUploadStatus({ id: projectId, progress: 0 });
     try {
         if (file.type.startsWith('video/')) {
             const { url: tUrl, blob: tBlob, aspectRatio } = await generateThumbnailFromVideo(file);
             const vUrl = await uploadFileToStorage(file, `users/${data.uid}/v/${projectId}_${Date.now()}`, p => setUploadStatus({ id: projectId, progress: p }));
             const stUrl = await uploadFileToStorage(new File([tBlob], "t.jpg"), `users/${data.uid}/t/${projectId}_${Date.now()}.jpg`);
             updateProject(projectId, { link: vUrl, thumbnail: stUrl, aspectRatio, type: 'video' });
         } else {
             const url = await uploadFileToStorage(file, `users/${data.uid}/p/${projectId}_${Date.now()}`, p => setUploadStatus({ id: projectId, progress: p }));
             updateProject(projectId, { link: url, thumbnail: url, type: 'image' });
         }
     } finally { setUploadStatus(null); }
  };

  return (
    <div className="h-screen flex flex-col bg-black text-white font-sans overflow-hidden">
        <header className="px-8 py-5 border-b border-zinc-900 bg-[#050505] flex justify-between items-center z-50 shrink-0 shadow-xl">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-sm">F</div>
                <div><h2 className="text-sm font-black tracking-widest text-white uppercase">Frames Studio</h2><p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">{data.username}</p></div>
            </div>
            <div className="flex items-center gap-4">
                {hasUnsavedChanges && <span className="text-[9px] text-indigo-500 font-black uppercase tracking-widest mr-2 flex items-center gap-2"><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"/> Unsaved Draft</span>}
                <Button size="sm" variant="ghost" onClick={onSave} disabled={isSaving} className="text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 px-6 rounded-full">{isSaving ? <Loader2 className="animate-spin" size={14}/> : 'Save'}</Button>
                <PublishButton onPublish={onPublish} />
                <div className="h-6 w-px bg-zinc-900 mx-2" />
                <Button variant="ghost" size="sm" onClick={onPreview} className="text-zinc-400 hover:text-white bg-zinc-900/50 rounded-full px-5"><Eye size={16} className="mr-2"/> Preview</Button>
            </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
            <nav className="w-20 border-r border-zinc-950 flex flex-col gap-8 py-10 items-center bg-[#050505] shrink-0">
                {[
                    { id: 'dashboard', icon: LayoutDashboard }, { id: 'profile', icon: User },
                    { id: 'content', icon: Video }, { id: 'tools', icon: Wrench }, { id: 'settings', icon: Settings }
                ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`p-4 rounded-2xl transition-all relative group ${activeTab === tab.id ? 'bg-white text-black shadow-2xl' : 'text-zinc-600 hover:text-white hover:bg-zinc-900'}`}>
                        <tab.icon size={22} strokeWidth={2.5} />
                    </button>
                ))}
            </nav>

            <main className="flex-1 overflow-y-auto p-12 lg:p-16 custom-scrollbar bg-[#050505]">
                <div className="max-w-4xl mx-auto space-y-16 pb-32">
                    {activeTab === 'dashboard' && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
                            <div className="bg-gradient-to-br from-indigo-950/40 to-zinc-950 border border-indigo-500/10 p-12 rounded-[3rem] space-y-10 relative overflow-hidden">
                                <div className="flex justify-between items-start relative z-10">
                                    <div><h3 className="text-4xl font-display font-black text-white tracking-tighter uppercase leading-none mb-2">Live Portfolio</h3><p className="text-zinc-500 text-base font-light">Your creative identity is live on the web.</p></div>
                                    <div className="px-4 py-2 bg-green-500/10 text-green-400 text-[10px] font-black uppercase rounded-full border border-green-500/20 flex items-center gap-2">Live</div>
                                </div>
                                <div className="flex items-center gap-4 bg-black/60 p-5 rounded-2xl border border-zinc-800 shadow-inner">
                                    <Globe size={18} className="text-zinc-600" /><code className="text-sm text-zinc-300 flex-1 truncate font-mono">{window.location.origin}/#{data.username}</code>
                                    <Button size="sm" variant="secondary" className="bg-white text-black hover:bg-zinc-200 rounded-lg" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/#${data.username}`)}>Copy Link</Button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                     <Button variant="outline" className="py-8 border-zinc-800 rounded-3xl text-sm font-bold uppercase tracking-widest" onClick={() => window.open(`${window.location.origin}/#${data.username}`, '_blank')}>Visit Site</Button>
                                     <Button variant="outline" className="py-8 border-zinc-800 rounded-3xl text-sm font-bold uppercase tracking-widest" onClick={() => {}}>QR Access</Button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="bg-zinc-950 border border-zinc-900 p-10 rounded-[2.5rem]"><div className="flex items-center gap-3 text-zinc-700 mb-6 uppercase text-[10px] font-black tracking-widest"><BarChart3 size={16} /> Total Views</div><span className="text-7xl font-display font-black text-white tracking-tighter">{stats.views}</span></div>
                                <div className="bg-zinc-950 border border-zinc-900 p-10 rounded-[2.5rem]"><div className="flex items-center gap-3 text-zinc-700 mb-6 uppercase text-[10px] font-black tracking-widest"><MousePointerClick size={16} /> Interaction</div><span className="text-7xl font-display font-black text-white tracking-tighter">{stats.clicks}</span></div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="flex flex-col md:flex-row items-center gap-10 bg-zinc-950 p-10 rounded-[3rem] border border-zinc-900">
                                <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-zinc-900 relative group shrink-0 shadow-2xl bg-black">
                                    <img src={data.profileImage} className="w-full h-full object-cover opacity-80 group-hover:opacity-40 transition-all" />
                                    <button onClick={() => { const i = document.createElement('input'); i.type='file'; i.onchange=(e:any)=>{ const f=e.target.files[0]; uploadFileToStorage(f, `users/${data.uid}/p/avatar_${Date.now()}`).then(u=>updateField('profileImage', u)); }; i.click(); }} className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100"><Upload size={32}/></button>
                                </div>
                                <div className="flex-1 space-y-6 w-full">
                                    <Input label="Name" value={data.name} onChange={e => updateField('name', e.target.value)} className="text-xl font-bold py-3" />
                                    <Input label="Creative Role" value={data.role} onChange={e => updateField('role', e.target.value)} placeholder="e.g. Senior Motion Artist" />
                                </div>
                            </div>
                            <TextArea label="Bio" value={data.bio} onChange={e => updateField('bio', e.target.value)} rows={5} className="text-lg font-light leading-relaxed" />
                            <div className="grid grid-cols-2 gap-6">
                                <Input label="Location" value={data.location} onChange={e => updateField('location', e.target.value)} />
                                <Input label="Contact Email" value={data.contactEmail} onChange={e => updateField('contactEmail', e.target.value)} />
                            </div>
                        </div>
                    )}

                    {activeTab === 'content' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
                             <div className="bg-zinc-950 p-10 rounded-[2.5rem] border border-zinc-900 space-y-8">
                                <h3 className="text-xs font-black uppercase tracking-[0.4em] text-zinc-700">Featured Showreel</h3>
                                <Input placeholder="Link (YouTube/Vimeo/Drive)" value={data.showreelLink} onChange={e => updateField('showreelLink', e.target.value)} className="bg-black/60 border-zinc-800" />
                            </div>
                            <div className="space-y-8">
                                <div className="flex justify-between items-center px-4">
                                    <h3 className="text-xs font-black uppercase tracking-[0.4em] text-zinc-700">Project Gallery</h3>
                                    <Button size="sm" onClick={() => updateField('projects', [{ id: Date.now().toString(), title: "New Project", description: "", thumbnail: "", link: "", category: "Work", type: "video", aspectRatio: '16:9' }, ...data.projects])} className="bg-white text-black rounded-full px-6 font-black uppercase tracking-widest text-[10px]">Add Work</Button>
                                </div>
                                <LayoutGroup>
                                    <div className="space-y-6">
                                        {data.projects.map(p => (
                                            <ProjectCardEditor key={p.id} project={p} onChange={u => updateProject(p.id, u)} onDelete={() => updateField('projects', data.projects.filter(pr => pr.id !== p.id))} onUploadImage={f => handleProjectImage(p.id, f)} uploadStatus={uploadStatus?.id === p.id} />
                                        ))}
                                    </div>
                                </LayoutGroup>
                            </div>
                        </div>
                    )}

                    {activeTab === 'tools' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="space-y-10">
                                <div><label className="text-xs font-black text-zinc-700 uppercase tracking-[0.4em] mb-8 block px-4">Primary Workflow</label><ToolSelector type="editing" selectedTools={data.tools || []} primaryTool={data.primaryTool} onSelect={t => updateField('tools', t)} onSetPrimary={t => updateField('primaryTool', t)} /></div>
                                <div><label className="text-xs font-black text-zinc-700 uppercase tracking-[0.4em] mb-8 block px-4">AI Tools & Extensions</label><ToolSelector type="ai" selectedTools={data.aiTools || []} onSelect={t => updateField('aiTools', t)} /></div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="bg-zinc-950 border border-zinc-900 p-12 rounded-[3rem] space-y-10">
                                <div className="flex justify-between items-center"><h4 className="text-2xl font-display font-black uppercase tracking-tighter">Account</h4><Button variant="ghost" onClick={onLogout} className="text-zinc-500 hover:text-red-500 transition-colors"><LogOut size={20}/></Button></div>
                                <Input label="Public Slug" value={data.username} onChange={e => updateField('username', e.target.value.toLowerCase().replace(/\s/g, ''))} />
                                <div className="pt-10 border-t border-zinc-900">
                                    <h4 className="text-red-500 font-black uppercase text-[10px] tracking-[0.3em] mb-4">Danger Zone</h4>
                                    <Button className="bg-red-950/20 text-red-500 border border-red-900/30 hover:bg-red-600 hover:text-white transition-all w-full py-6 rounded-2xl" onClick={() => setShowDeleteModal(true)}>Delete Portfolio Forever</Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
        
        {showDeleteModal && createPortal(
             <div className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-8" onClick={() => setShowDeleteModal(false)}>
                <div className="bg-[#09090b] border border-red-900/40 rounded-[3rem] p-12 max-w-lg w-full shadow-2xl text-center" onClick={e => e.stopPropagation()}>
                    <div className="w-20 h-20 bg-red-950/30 rounded-full flex items-center justify-center mb-8 mx-auto text-red-500"><AlertTriangle size={36}/></div>
                    <h3 className="text-3xl font-display font-black uppercase tracking-tighter text-white mb-4">Are you sure?</h3>
                    <p className="text-zinc-500 text-lg font-light mb-10 leading-relaxed">This will permanently destroy your creative portfolio and all uploaded media. This action cannot be undone.</p>
                    <div className="flex gap-4">
                        <Button variant="ghost" className="flex-1 py-4 text-zinc-500" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
                        <Button className="flex-1 bg-red-600 hover:bg-red-500 text-white border-none py-4 rounded-2xl" onClick={onDeleteAccount}>Confirm Delete</Button>
                    </div>
                </div>
            </div>, document.body
        )}
    </div>
  );
};