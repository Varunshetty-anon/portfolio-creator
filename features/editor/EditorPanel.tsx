import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { PortfolioData, Project } from '../../types';
import { Input, TextArea } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ToolSelector } from '../../components/ToolSelector';
import { Plus, Trash2, Video, Upload, ChevronDown, Loader2, CheckCircle2, Database, AlertTriangle, Eye, Settings, LogOut, Wrench, LayoutDashboard, User, X, RotateCcw, AlertCircle, Youtube, HardDrive, Link, Download, Globe, ExternalLink, QrCode, BarChart3, MousePointerClick } from 'lucide-react';
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
            className={`transition-all duration-300 border-none ${status === 'success' ? 'bg-green-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-500'} font-bold min-w-[100px] md:min-w-[120px] rounded-full`}
        >
            <AnimatePresence mode="wait">
                {status === 'loading' ? <motion.div key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }}><Loader2 className="animate-spin" size={14}/></motion.div> :
                 status === 'success' ? <motion.div key="s" initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="flex items-center gap-2 text-[10px] md:text-sm"><CheckCircle2 size={14} /> Live</motion.div> :
                 <motion.div key="i" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] md:text-sm">Go Live</motion.div>}
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
    return { icon: Link, color: 'text-zinc-500', label: 'Invalid Link', border: 'border-red-900' };
};

const ProjectCardEditor: React.FC<{ project: Project; onChange: (p: Partial<Project>) => void; onDelete: () => void }> = ({ 
    project, onChange, onDelete
}) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const linkStatus = getLinkIndicator(project.link);
    const [isValidating, setIsValidating] = useState(false);

    const handleLinkChange = (val: string) => {
        onChange({ link: val });
        const lower = val.toLowerCase();
        const isValid = lower.includes('youtube.com') || lower.includes('youtu.be') || lower.includes('drive.google.com') || lower.includes('vimeo.com') || lower.includes('dropbox.com');
        
        if (isValid && val.length > 10) {
            setIsValidating(true);
            setTimeout(async () => {
                const metadata = await getVideoMetadata(val);
                if (metadata.thumbnail) onChange({ thumbnail: metadata.thumbnail, aspectRatio: metadata.aspectRatio });
                setIsValidating(false);
            }, 1000);
        }
    };

    // Calculate dynamic aspect ratio style
    const ratioStyle = { 
        aspectRatio: project.aspectRatio ? project.aspectRatio.replace(':', '/') : '16/9' 
    };

    return (
        <motion.div layout className={`bg-zinc-900/40 border ${isExpanded ? 'border-zinc-700 ring-1 ring-zinc-800' : 'border-zinc-800'} rounded-2xl overflow-hidden transition-all duration-300 relative z-0`}>
             <div className="p-4 md:p-5 flex flex-col md:flex-row gap-4 md:gap-5 items-start">
                 {/* Thumbnail Container with Dynamic Aspect Ratio */}
                 <div 
                    className="w-full md:w-40 bg-black rounded-xl overflow-hidden shrink-0 border border-zinc-800 relative group flex items-center justify-center transition-all duration-300"
                    style={ratioStyle}
                 >
                    {project.thumbnail ? (
                        <img src={project.thumbnail} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900/50 border-2 border-dashed border-zinc-800 text-zinc-600 gap-2 p-2 transition-colors group-hover:border-zinc-700 group-hover:bg-zinc-900">
                            <Video size={20} className="opacity-50" />
                            <span className="text-[9px] uppercase font-bold tracking-widest text-center leading-tight">Paste Link to Fetch</span>
                        </div>
                    )}
                </div>

                <div className="flex-1 space-y-3 md:space-y-4 w-full">
                    <div className="flex justify-between items-start">
                        <input className="bg-transparent border-none p-0 text-white font-bold text-base md:text-lg w-full focus:ring-0 placeholder:text-zinc-700" value={project.title} onChange={e => onChange({ title: e.target.value })} placeholder="Project Title" />
                        <div className="flex gap-1 md:gap-2">
                            <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 text-zinc-500 hover:text-white transition-colors"><ChevronDown className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} size={16} /></button>
                            <button onClick={onDelete} className="p-2 text-zinc-700 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                        </div>
                    </div>
                    <div className="relative">
                        <Input value={project.link} onChange={e => handleLinkChange(e.target.value)} placeholder="Enter YT / Drive / Vimeo / Dropbox link" className={`h-9 md:h-10 pr-10 bg-black/40 border-zinc-800 text-xs md:text-sm ${linkStatus?.border || ''}`} />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {isValidating ? <Loader2 className="animate-spin text-zinc-500" size={12}/> : linkStatus && <div className={linkStatus.color}><linkStatus.icon size={14}/></div>}
                        </div>
                    </div>
                    {project.link && !linkStatus?.color?.includes('zinc') && <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest px-1">Verified Link Type</p>}
                </div>
             </div>

             <AnimatePresence>
                 {isExpanded && (
                     <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="border-t border-zinc-800 bg-black/20 overflow-hidden">
                         <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                             <div className="space-y-4">
                                 <TextArea label="Project Description" value={project.description} onChange={e => onChange({ description: e.target.value })} placeholder="Describe the project goal..." rows={3} className="bg-black/40 text-xs" />
                                 <div className="grid grid-cols-2 gap-3">
                                     <div className="space-y-1">
                                        <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest px-1">Content Type</label>
                                        {/* Z-Index ensured by parent relative positioning and standard select behavior */}
                                        <select value={project.contentType || ''} onChange={e => onChange({ contentType: e.target.value })} className="w-full bg-black/40 border border-zinc-800 rounded-xl px-2 md:px-3 py-2 text-zinc-300 text-[10px] md:text-xs focus:ring-1 focus:ring-zinc-700 outline-none appearance-none cursor-pointer hover:border-zinc-600 transition-colors">{PROJECT_CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select>
                                     </div>
                                     <div className="space-y-1">
                                        <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest px-1">Aspect Ratio</label>
                                        <select value={project.aspectRatio || '16:9'} onChange={e => onChange({ aspectRatio: e.target.value as any })} className="w-full bg-black/40 border border-zinc-800 rounded-xl px-2 md:px-3 py-2 text-zinc-300 text-[10px] md:text-xs focus:ring-1 focus:ring-zinc-700 outline-none appearance-none cursor-pointer hover:border-zinc-600 transition-colors"><option value="16:9">16:9 (Landscape)</option><option value="9:16">9:16 (Vertical)</option><option value="4:3">4:3 (Classic)</option><option value="1:1">1:1 (Square)</option></select>
                                     </div>
                                 </div>
                             </div>
                             <div className="space-y-1">
                                <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest px-1">Software Used</label>
                                <div className="grid grid-cols-2 gap-1.5 h-[150px] overflow-y-auto custom-scrollbar p-1">
                                    {EDITING_TOOLS_LIST.map(tool => (
                                        <button key={tool.name} onClick={() => { const cur = project.softwareUsed || []; onChange({ softwareUsed: cur.includes(tool.name) ? cur.filter(t => t !== tool.name) : [...cur, tool.name] }); }} className={`px-2 md:px-3 py-1.5 md:py-2 rounded-xl border text-[9px] md:text-[10px] font-bold text-left transition-all ${project.softwareUsed?.includes(tool.name) ? 'bg-white text-black border-white' : 'bg-black/40 text-zinc-500 border-zinc-800 hover:border-zinc-700'}`}>{tool.name}</button>
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [stats, setStats] = useState({ views: 0, clicks: 0 });
  const [isMobileNav, setIsMobileNav] = useState(window.innerWidth < 768);

  useEffect(() => {
      const checkNav = () => setIsMobileNav(window.innerWidth < 768);
      window.addEventListener('resize', checkNav);
      return () => window.removeEventListener('resize', checkNav);
  }, []);
  
  // Safe stats loading
  useEffect(() => { if (activeTab === 'dashboard' && data?.uid) getPortfolioStats(data.uid).then(setStats); }, [activeTab, data?.uid]);

  const updateField = (f: keyof PortfolioData, v: any) => onChange({ ...data, [f]: v });
  const updateProject = (id: string, updates: Partial<Project>) => onChange({ ...data, projects: data.projects.map(p => p.id === id ? { ...p, ...updates } : p) });

  if (!data) return <div className="h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-zinc-500"/></div>;

  return (
    <div className="h-screen flex flex-col bg-black text-white font-sans overflow-hidden">
        <header className="px-4 md:px-8 py-4 md:py-5 border-b border-zinc-900 bg-[#050505] flex justify-between items-center z-50 shrink-0 shadow-xl">
            <div className="flex items-center gap-3 md:gap-4">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-600 rounded-xl md:rounded-2xl flex items-center justify-center text-white font-black text-xs md:text-sm">F</div>
                <div className="hidden sm:block">
                    <h2 className="text-xs md:text-sm font-black tracking-widest text-white uppercase">Frames Studio</h2>
                    <p className="text-[9px] md:text-[10px] text-zinc-600 font-bold uppercase tracking-widest">@{data.username}</p>
                </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
                {hasUnsavedChanges && <div className="hidden lg:flex items-center gap-2 text-[9px] text-indigo-500 font-black uppercase tracking-widest mr-2"><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"/> Draft</div>}
                <Button size="sm" variant="ghost" onClick={onSave} disabled={isSaving} className="text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 px-4 md:px-6 rounded-full text-[10px] md:text-xs">Save Draft</Button>
                <PublishButton onPublish={onPublish} />
                <div className="h-6 w-px bg-zinc-900 mx-1 md:mx-2" />
                <Button variant="ghost" size="sm" onClick={onPreview} className="text-zinc-400 hover:text-white bg-zinc-900/50 rounded-full px-3 md:px-5"><Eye size={16}/></Button>
            </div>
        </header>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            <nav className={`shrink-0 z-40 bg-[#050505] border-zinc-950 flex ${isMobileNav ? 'w-full h-16 border-t flex-row justify-around py-0 px-4' : 'w-20 border-r flex-col gap-6 py-10 items-center'}`}>
                {[
                    { id: 'dashboard', icon: LayoutDashboard }, { id: 'profile', icon: User },
                    { id: 'content', icon: Video }, { id: 'tools', icon: Wrench }, { id: 'settings', icon: Settings }
                ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`p-3 md:p-4 rounded-xl md:rounded-2xl transition-all relative group ${activeTab === tab.id ? 'bg-white text-black shadow-2xl' : 'text-zinc-600 hover:text-white hover:bg-zinc-900'}`}>
                        <tab.icon size={isMobileNav ? 20 : 22} strokeWidth={2.5} />
                    </button>
                ))}
            </nav>

            <main className="flex-1 overflow-y-auto p-6 md:p-12 lg:p-16 custom-scrollbar bg-[#050505]">
                <div className="max-w-4xl mx-auto space-y-12 md:space-y-16 pb-24 md:pb-32">
                    {activeTab === 'dashboard' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
                            <div className="bg-gradient-to-br from-indigo-950/40 to-zinc-950 border border-indigo-500/10 p-8 md:p-12 rounded-[2.5rem] space-y-8 relative overflow-hidden">
                                <div><h3 className="text-3xl md:text-4xl font-display font-black text-white tracking-tighter uppercase leading-none mb-2">Live Studio</h3><p className="text-zinc-500 text-sm">Your creative hub is active.</p></div>
                                <div className="flex items-center gap-4 bg-black/60 p-4 rounded-2xl border border-zinc-800">
                                    <Globe size={16} className="text-zinc-600 shrink-0" /><code className="text-xs text-zinc-300 flex-1 truncate font-mono">{window.location.origin}/#{data.username}</code>
                                    <Button size="sm" variant="secondary" className="bg-white text-black text-[10px] shrink-0" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/#${data.username}`)}>Copy</Button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                     <Button variant="outline" className="py-8 rounded-3xl text-[10px] font-bold uppercase tracking-widest" onClick={() => window.open(`${window.location.origin}/#${data.username}`, '_blank')}>View Site</Button>
                                     <Button variant="outline" className="py-8 rounded-3xl text-[10px] font-bold uppercase tracking-widest">Analytics</Button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="bg-zinc-950 border border-zinc-900 p-10 rounded-[2.5rem]"><div className="text-zinc-700 mb-6 uppercase text-[10px] font-black tracking-widest">Total Views</div><span className="text-5xl md:text-7xl font-display font-black text-white tracking-tighter">{stats.views}</span></div>
                                <div className="bg-zinc-950 border border-zinc-900 p-10 rounded-[2.5rem]"><div className="text-zinc-700 mb-6 uppercase text-[10px] font-black tracking-widest">Total Clicks</div><span className="text-5xl md:text-7xl font-display font-black text-white tracking-tighter">{stats.clicks}</span></div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="flex flex-col md:flex-row items-center gap-10 bg-zinc-950 p-10 rounded-[3rem] border border-zinc-900">
                                <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-zinc-900 relative group shrink-0 shadow-2xl bg-black">
                                    <img src={data.profileImage} className="w-full h-full object-cover opacity-80 group-hover:opacity-40 transition-all" />
                                    <button onClick={() => { const i = document.createElement('input'); i.type='file'; i.onchange=(e:any)=>{ const f=e.target.files[0]; uploadFileToStorage(f, `users/${data.uid}/p/avatar_${Date.now()}`).then(u=>updateField('profileImage', u)); }; i.click(); }} className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100"><Upload size={28}/></button>
                                </div>
                                <div className="flex-1 space-y-6 w-full">
                                    <Input label="Public Name" value={data.name} onChange={e => updateField('name', e.target.value)} className="text-xl font-bold py-3" />
                                    <Input label="Professional Role" value={data.role} onChange={e => updateField('role', e.target.value)} placeholder="e.g. Senior Video Editor" />
                                </div>
                            </div>
                            <TextArea label="Bio" value={data.bio} onChange={e => updateField('bio', e.target.value)} rows={4} className="text-lg font-light leading-relaxed" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input label="Location" value={data.location} onChange={e => updateField('location', e.target.value)} />
                                <Input label="Contact Email" value={data.contactEmail} onChange={e => updateField('contactEmail', e.target.value)} />
                            </div>
                        </div>
                    )}

                    {activeTab === 'content' && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                             <div className="bg-zinc-950 p-10 rounded-[2.5rem] border border-zinc-900 space-y-8">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-700">Main Showreel</h3>
                                <div className="space-y-4">
                                    <Input placeholder="Direct Video Link (YT/Vimeo/Drive/Dropbox)" value={data.showreelLink} onChange={e => updateField('showreelLink', e.target.value)} className="bg-black/60 border-zinc-800 text-xs" />
                                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest px-2">Support: YouTube, Vimeo, Google Drive, Dropbox</p>
                                </div>
                            </div>
                            <div className="space-y-8">
                                <div className="flex justify-between items-center px-4">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-700">Selected Works</h3>
                                    <Button size="sm" onClick={() => updateField('projects', [{ id: Date.now().toString(), title: "New Project", description: "", thumbnail: "", link: "", category: "Work", type: "video", aspectRatio: '16:9' }, ...data.projects])} className="bg-white text-black rounded-full px-6 font-black uppercase tracking-widest text-[10px]">Add Project</Button>
                                </div>
                                <LayoutGroup>
                                    <div className="space-y-6">
                                        {(data.projects || []).map(p => (
                                            <ProjectCardEditor key={p.id} project={p} onChange={u => updateProject(p.id, u)} onDelete={() => updateField('projects', data.projects.filter(pr => pr.id !== p.id))} />
                                        ))}
                                    </div>
                                </LayoutGroup>
                            </div>
                        </div>
                    )}

                    {activeTab === 'tools' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div><label className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.4em] mb-8 block px-4">Core Workflow & Mastery</label><ToolSelector type="editing" selectedTools={data.tools || []} primaryTool={data.primaryTool} onSelect={t => updateField('tools', t)} onSetPrimary={t => updateField('primaryTool', t)} /></div>
                            <div><label className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.4em] mb-8 block px-4">AI Tools Integration</label><ToolSelector type="ai" selectedTools={data.aiTools || []} onSelect={t => updateField('aiTools', t)} /></div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="bg-zinc-950 border border-zinc-900 p-12 rounded-[3rem] space-y-10">
                                <div className="flex justify-between items-center"><h4 className="text-2xl font-display font-black uppercase tracking-tighter">System Settings</h4><Button variant="ghost" onClick={onLogout} className="text-zinc-500 hover:text-red-500 transition-colors"><LogOut size={20}/></Button></div>
                                <Input label="Custom Portfolio URL Slug" value={data.username} onChange={e => updateField('username', e.target.value.toLowerCase().replace(/\s/g, ''))} />
                                <div className="pt-10 border-t border-zinc-900">
                                    <h4 className="text-red-500 font-black uppercase text-[10px] tracking-[0.3em] mb-4">Danger Zone</h4>
                                    <Button className="bg-red-950/20 text-red-500 border border-red-900/30 hover:bg-red-600 hover:text-white transition-all w-full py-6 rounded-2xl text-sm" onClick={() => setShowDeleteModal(true)}>Delete Portfolio Forever</Button>
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
                    <div className="w-20 h-20 bg-red-950/30 rounded-full flex items-center justify-center mb-8 mx-auto text-red-500"><AlertTriangle size={32}/></div>
                    <h3 className="text-3xl font-display font-black uppercase tracking-tighter text-white mb-4">Permanent Action</h3>
                    <p className="text-zinc-500 text-lg font-light mb-10 leading-relaxed">This will erase your entire portfolio and associated metadata from our servers. This cannot be undone.</p>
                    <div className="flex gap-4">
                        <Button variant="ghost" className="flex-1 py-4 text-zinc-500 text-sm" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
                        <Button className="flex-1 bg-red-600 hover:bg-red-500 text-white border-none py-4 rounded-2xl text-sm" onClick={onDeleteAccount}>Confirm Delete</Button>
                    </div>
                </div>
            </div>, document.body
        )}
    </div>
  );
};