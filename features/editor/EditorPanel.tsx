import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { PortfolioData, Project } from '../../types';
import { Input, TextArea } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ToolSelector } from '../../components/ToolSelector';
import { Plus, Trash2, Video, Upload, ChevronDown, Loader2, CheckCircle2, AlertTriangle, Eye, Settings, LogOut, Wrench, LayoutDashboard, User, X, Link, Youtube, HardDrive, Database, Globe, ExternalLink } from 'lucide-react';
import { uploadFileToStorage, getVideoMetadata, getPortfolioStats, PROJECT_CONTENT_TYPES, EDITING_TOOLS_LIST } from '../../lib/utils';

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

const ProjectCardEditor: React.FC<{ project: Project; onChange: (p: Partial<Project>) => void; onDelete: () => void }> = ({ project, onChange, onDelete }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLink = async (val: string) => {
        onChange({ link: val });
        if (val.length > 10) {
            setLoading(true);
            const m = await getVideoMetadata(val);
            if (m.thumbnail) onChange({ thumbnail: m.thumbnail, aspectRatio: m.aspectRatio });
            setLoading(false);
        }
    };

    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-visible transition-colors hover:border-zinc-700">
             <div className="p-4 flex gap-4 items-start cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                 <div className="w-24 aspect-video bg-black rounded-lg border border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center relative">
                    {project.thumbnail ? <img src={project.thumbnail} className="w-full h-full object-cover"/> : <Video size={16} className="text-zinc-700"/>}
                    {loading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 size={12} className="animate-spin text-white"/></div>}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">{project.title || "Untitled Project"}</h4>
                    <p className="text-xs text-zinc-500 mt-1 truncate">{project.contentType || "Video"} • {project.link ? "Linked" : "No Link"}</p>
                </div>
                <button onClick={(e) => {e.stopPropagation(); onDelete();}} className="p-2 text-zinc-600 hover:text-red-500"><Trash2 size={14}/></button>
             </div>

             <AnimatePresence>
                 {isExpanded && (
                     <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="border-t border-zinc-800 bg-zinc-900/30 overflow-hidden">
                         <div className="p-5 space-y-4">
                             <Input label="Title" value={project.title} onChange={e => onChange({ title: e.target.value })} />
                             <Input label="Video Link" value={project.link} onChange={e => handleLink(e.target.value)} placeholder="YouTube, Vimeo, Drive..." />
                             <TextArea label="Description" value={project.description} onChange={e => onChange({ description: e.target.value })} rows={3} />
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold text-zinc-500">Content Type</label>
                                    <select value={project.contentType} onChange={e => onChange({ contentType: e.target.value })} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 outline-none focus:border-zinc-600">
                                        {PROJECT_CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase font-bold text-zinc-500">Aspect Ratio</label>
                                    <select value={project.aspectRatio} onChange={e => onChange({ aspectRatio: e.target.value as any })} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-300 outline-none focus:border-zinc-600">
                                        <option value="16:9">Landscape (16:9)</option>
                                        <option value="9:16">Vertical (9:16)</option>
                                        <option value="4:3">Classic (4:3)</option>
                                    </select>
                                </div>
                             </div>
                         </div>
                     </motion.div>
                 )}
             </AnimatePresence>
        </div>
    );
}

export const EditorPanel: React.FC<EditorPanelProps> = ({ data, onChange, onSave, onPublish, isSaving, hasUnsavedChanges, onLogout, onDeleteAccount, onPreview }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile' | 'content' | 'tools' | 'settings'>('dashboard');
  const [stats, setStats] = useState({ views: 0, clicks: 0 });
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => { if (data.uid && activeTab === 'dashboard') getPortfolioStats(data.uid).then(setStats); }, [activeTab, data.uid]);

  const updateField = (f: keyof PortfolioData, v: any) => onChange({ ...data, [f]: v });

  if (!data) return <div className="h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-zinc-500"/></div>;

  return (
    <div className="h-screen flex bg-[#050505] text-white font-sans overflow-hidden">
        {/* Sidebar */}
        <aside className="w-20 lg:w-64 border-r border-zinc-900 flex flex-col bg-zinc-950/50 shrink-0">
            <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-zinc-900">
                <div className="w-8 h-8 bg-white text-black rounded-lg flex items-center justify-center font-black">F</div>
                <span className="hidden lg:block ml-3 font-bold text-sm tracking-widest uppercase">Studio</span>
            </div>
            
            <nav className="flex-1 p-4 space-y-2">
                {[
                    { id: 'dashboard', icon: LayoutDashboard, label: 'Overview' },
                    { id: 'profile', icon: User, label: 'Profile' },
                    { id: 'content', icon: Video, label: 'Portfolio' },
                    { id: 'tools', icon: Wrench, label: 'Tools' },
                    { id: 'settings', icon: Settings, label: 'Settings' }
                ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`w-full flex items-center p-3 rounded-xl transition-all ${activeTab === tab.id ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'}`}>
                        <tab.icon size={20} />
                        <span className="hidden lg:block ml-3 text-sm font-medium">{tab.label}</span>
                    </button>
                ))}
            </nav>

            <div className="p-4 border-t border-zinc-900">
                <button onClick={onLogout} className="w-full flex items-center p-3 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
                    <LogOut size={20} />
                    <span className="hidden lg:block ml-3 text-sm font-medium">Log Out</span>
                </button>
            </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full min-w-0">
            {/* Header */}
            <header className="h-16 border-b border-zinc-900 flex items-center justify-between px-6 bg-[#050505]/80 backdrop-blur z-20 sticky top-0">
                <div className="flex items-center gap-2">
                    {hasUnsavedChanges && <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider bg-amber-500/10 px-2 py-1 rounded">Unsaved Changes</span>}
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={onSave} disabled={isSaving} className="text-zinc-400 hover:text-white">
                        {isSaving ? 'Saving...' : 'Save Draft'}
                    </Button>
                    <div className="w-px h-4 bg-zinc-800 mx-1" />
                    <Button variant="ghost" size="sm" onClick={onPreview} className="text-zinc-400 hover:text-white"><Eye size={18}/></Button>
                    <PublishButton onPublish={onPublish} />
                </div>
            </header>

            {/* Scroll Area */}
            <main className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-12">
                <div className="max-w-3xl mx-auto space-y-12 pb-24">
                    
                    {activeTab === 'dashboard' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div>
                                <h2 className="text-3xl font-display font-bold mb-2">Welcome, {data.name}</h2>
                                <p className="text-zinc-500">Here's how your portfolio is performing.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl">
                                    <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Total Views</span>
                                    <div className="text-4xl font-display font-bold mt-2">{stats.views}</div>
                                </div>
                                <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl">
                                    <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Link Clicks</span>
                                    <div className="text-4xl font-display font-bold mt-2">{stats.clicks}</div>
                                </div>
                            </div>
                            <div className="bg-zinc-900/30 border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
                                <code className="text-zinc-500 text-xs">{window.location.origin}/#{data.username}</code>
                                <Button size="sm" variant="outline" onClick={() => window.open(`/#${data.username}`, '_blank')} className="text-xs">Open Site <ExternalLink size={12} className="ml-2"/></Button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                             <div className="flex items-center gap-6">
                                <div className="w-24 h-24 rounded-full bg-zinc-900 border border-zinc-800 relative group overflow-hidden">
                                    <img src={data.profileImage} className="w-full h-full object-cover"/>
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => { const i = document.createElement('input'); i.type='file'; i.onchange=(e:any)=>uploadFileToStorage(e.target.files[0], `users/${data.uid}/avatar_${Date.now()}`).then(u=>updateField('profileImage', u)); i.click(); }}>
                                        <Upload size={20} className="text-white"/>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Profile Image</h3>
                                    <p className="text-zinc-500 text-xs">Recommended 400x400px</p>
                                </div>
                             </div>
                             <div className="space-y-4">
                                 <Input label="Display Name" value={data.name} onChange={e => updateField('name', e.target.value)} />
                                 <Input label="Role / Title" value={data.role} onChange={e => updateField('role', e.target.value)} />
                                 <TextArea label="Bio" value={data.bio} onChange={e => updateField('bio', e.target.value)} rows={4} />
                                 <Input label="Location" value={data.location} onChange={e => updateField('location', e.target.value)} />
                                 <Input label="Contact Email" value={data.contactEmail} onChange={e => updateField('contactEmail', e.target.value)} />
                             </div>
                        </div>
                    )}

                    {activeTab === 'content' && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-4">Showreel</h3>
                                <div className="p-6 bg-zinc-900/30 border border-zinc-800 rounded-2xl space-y-4">
                                    <Input label="Showreel Link" value={data.showreelLink} onChange={e => updateField('showreelLink', e.target.value)} placeholder="YouTube, Vimeo, Drive..." />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500">Projects</h3>
                                    <Button size="sm" onClick={() => updateField('projects', [{ id: Date.now().toString(), title: "New Project", description: "", thumbnail: "", link: "", category: "Work", type: "video", aspectRatio: '16:9' }, ...data.projects])} className="bg-white text-black text-xs font-bold rounded-full px-4"><Plus size={14} className="mr-1"/> Add Project</Button>
                                </div>
                                <div className="space-y-4">
                                    {(data.projects || []).map(p => (
                                        <ProjectCardEditor key={p.id} project={p} onChange={u => updateField('projects', data.projects.map(pr => pr.id === p.id ? { ...pr, ...u } : pr))} onDelete={() => updateField('projects', data.projects.filter(pr => pr.id !== p.id))} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'tools' && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                             <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-4">Primary Software</h3>
                                <ToolSelector type="editing" selectedTools={data.tools || []} primaryTool={data.primaryTool} onSelect={t => updateField('tools', t)} onSetPrimary={t => updateField('primaryTool', t)} />
                             </div>
                             <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-4">AI Tools</h3>
                                <ToolSelector type="ai" selectedTools={data.aiTools || []} onSelect={t => updateField('aiTools', t)} />
                             </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="p-8 bg-zinc-900/30 border border-zinc-800 rounded-2xl space-y-6">
                                <h3 className="text-lg font-bold">Account Settings</h3>
                                <Input label="Custom URL Slug" value={data.username} onChange={e => updateField('username', e.target.value.toLowerCase().replace(/\s/g, ''))} />
                                <div className="pt-6 border-t border-zinc-800">
                                    <Button variant="outline" className="text-red-500 border-red-900/50 hover:bg-red-950/20 w-full" onClick={() => setShowDeleteModal(true)}>Delete Portfolio & Account</Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>

        {showDeleteModal && createPortal(
            <div className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full text-center space-y-6">
                    <AlertTriangle size={48} className="text-red-500 mx-auto" />
                    <h3 className="text-xl font-bold text-white">Permanently Delete?</h3>
                    <p className="text-zinc-400 text-sm">This action cannot be undone. All your data will be wiped.</p>
                    <div className="flex gap-4">
                        <Button variant="ghost" className="flex-1" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
                        <Button className="flex-1 bg-red-600 text-white hover:bg-red-700" onClick={onDeleteAccount}>Delete</Button>
                    </div>
                </div>
            </div>, document.body
        )}
    </div>
  );
};