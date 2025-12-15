import React, { useState } from 'react';
import { PortfolioData, Project, Testimonial } from '../types';
import { Input, TextArea } from './ui/Input';
import { Button } from './ui/Button';
import { Plus, Trash2, Video, Wand2, Image, Link, ChevronDown, ChevronUp, Upload, X, LayoutDashboard, Copy, ExternalLink, FileVideo, User, MessageSquare } from 'lucide-react';

interface EditorPanelProps {
  data: PortfolioData;
  onChange: (newData: PortfolioData) => void;
  onPublish: () => void;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({ data, onChange, onPublish, isSaving, hasUnsavedChanges }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile' | 'content' | 'testimonials' | 'tools'>('dashboard');
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const updateField = (field: keyof PortfolioData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const updateSocials = (field: keyof typeof data.socials, value: string) => {
    onChange({ ...data, socials: { ...data.socials, [field]: value } });
  };

  // --- Link Generator ---
  const getPublicLink = () => {
    return `${window.location.origin}${window.location.pathname}#u/portfolio`;
  };

  const copyLink = () => {
    navigator.clipboard.writeText(getPublicLink());
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // --- Project Helpers ---
  const addProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      title: "New Project",
      description: "Brief description...",
      thumbnail: `https://picsum.photos/600/800?random=${Date.now()}`,
      link: "",
      category: "Edit"
    };
    updateField('projects', [...data.projects, newProject]);
    setExpandedProject(newProject.id);
  };

  const removeProject = (id: string) => {
    updateField('projects', data.projects.filter(p => p.id !== id));
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    const newProjects = data.projects.map(p => 
      p.id === id ? { ...p, ...updates } : p
    );
    updateField('projects', newProjects);
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

  const handleArrayInput = (field: 'skills' | 'tools' | 'aiTools', value: string) => {
    const arr = value.split(',').map(s => s.trim()).filter(s => s.length > 0);
    updateField(field, arr);
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
    const url = URL.createObjectURL(file);
    onChange({ ...data, profileImage: url, profileImageBlob: file });
  };

  const handleShowreelThumbUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    onChange({ ...data, showreelThumbnail: url, showreelThumbnailBlob: file });
  };

  const handleProjectThumbUpload = (id: string, file: File) => {
    const url = URL.createObjectURL(file);
    updateProject(id, { thumbnail: url, thumbnailBlob: file });
  };

  const handleProjectVideoUpload = (id: string, file: File) => {
    const url = URL.createObjectURL(file);
    updateProject(id, { link: url, customVideoBlob: file });
  };

  return (
    <div className="h-full flex flex-col bg-zinc-950 border-r border-zinc-800">
      
      {/* Header */}
      <div className="p-6 border-b border-zinc-800 bg-zinc-950 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-display font-bold text-white mb-1">CineFolio Studio</h2>
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
           { id: 'tools', icon: Wand2 }
        ].map((tab) => (
           <button 
           key={tab.id}
           onClick={() => setActiveTab(tab.id as any)}
           className={`flex-1 py-4 px-3 text-xs font-medium transition-all flex flex-col items-center gap-1 ${activeTab === tab.id ? 'bg-zinc-800 text-white border-b-2 border-indigo-500' : 'text-zinc-500 hover:text-zinc-300'}`}
         >
           <tab.icon size={16} />
           <span className="capitalize">{tab.id}</span>
         </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-zinc-950">
        
        {/* === DASHBOARD TAB === */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn">
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

             <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-white font-bold text-sm uppercase tracking-wider">Public Link</h3>
                <p className="text-xs text-zinc-500">
                   Share this link with clients. Note: If you uploaded large videos locally, ensure you are showcasing on this device or use external links (YouTube) for universal access.
                </p>
                
                <div className="flex items-center gap-2 bg-black rounded-lg p-2 border border-zinc-800">
                   <div className="flex-1 truncate text-xs font-mono text-zinc-400 px-2">
                      {getPublicLink()}
                   </div>
                   <button onClick={copyLink} className="p-2 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors">
                      {copySuccess ? <span className="text-green-500 text-xs font-bold">COPIED</span> : <Copy size={16}/>}
                   </button>
                   <a href={getPublicLink()} target="_blank" rel="noreferrer" className="p-2 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors">
                      <ExternalLink size={16} />
                   </a>
                </div>
             </div>
          </div>
        )}

        {/* === PROFILE TAB === */}
        {activeTab === 'profile' && (
          <div className="space-y-5 animate-fadeIn">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2"><Image size={14}/> Avatar</h3>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-zinc-800 overflow-hidden border border-zinc-700">
                  <img src={data.profileImage} alt="Profile" className="w-full h-full object-cover" />
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
              <TextArea label="Bio / Intro" value={data.bio} onChange={(e) => updateField('bio', e.target.value)} rows={4} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Base Location" value={data.location} onChange={(e) => updateField('location', e.target.value)} />
                <Input label="Languages" value={data.languages} onChange={(e) => updateField('languages', e.target.value)} />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <h3 className="text-sm font-bold text-white">Socials</h3>
              <Input label="Email" value={data.socials.email} onChange={(e) => updateSocials('email', e.target.value)} />
              <Input label="Instagram Handle" value={data.socials.instagram || ''} onChange={(e) => updateSocials('instagram', e.target.value)} prefix="@" />
              <Input label="Twitter" value={data.socials.twitter || ''} onChange={(e) => updateSocials('twitter', e.target.value)} />
              <Input label="YouTube" value={data.socials.youtube || ''} onChange={(e) => updateSocials('youtube', e.target.value)} />
              <Input label="LinkedIn" value={data.socials.linkedin || ''} onChange={(e) => updateSocials('linkedin', e.target.value)} />
            </div>
          </div>
        )}

        {/* === CONTENT TAB === */}
        {activeTab === 'content' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Showreel */}
            <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2"><Video size={14} className="text-purple-400"/> Featured Showreel</h3>
              <Input label="Video Link" value={data.showreelLink} onChange={(e) => updateField('showreelLink', e.target.value)} />
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
                 {data.projects.map((project, idx) => (
                   <div key={project.id} className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                     <div 
                        className="flex items-center justify-between p-3 cursor-pointer hover:bg-zinc-800 transition-colors"
                        onClick={() => setExpandedProject(expandedProject === project.id ? null : project.id)}
                      >
                       <div className="flex items-center gap-3 overflow-hidden">
                         <div className="w-10 h-10 rounded bg-zinc-800 flex-shrink-0 bg-cover bg-center" style={{backgroundImage: `url(${project.thumbnail})`}}></div>
                         <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-medium truncate text-white">{project.title}</span>
                            <span className="text-xs text-zinc-500 truncate">{project.category}</span>
                         </div>
                       </div>
                       <div className="flex items-center gap-2">
                         <button onClick={(e) => { e.stopPropagation(); removeProject(project.id); }} className="p-1 hover:text-red-400 text-zinc-600"><Trash2 size={14}/></button>
                         {expandedProject === project.id ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                       </div>
                     </div>
                     
                     {expandedProject === project.id && (
                       <div className="p-4 border-t border-zinc-800 space-y-4 bg-zinc-950">
                         <Input label="Title" value={project.title} onChange={(e) => updateProject(project.id, { title: e.target.value })} />
                         <Input label="Category" value={project.category} onChange={(e) => updateProject(project.id, { category: e.target.value })} />
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
                               {project.link ? (
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
                               ) : (
                                   <Button size="sm" className="w-full h-24 border-2 border-dashed border-zinc-700 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-500 flex flex-col gap-2" variant="ghost" onClick={() => handleFileUpload('video/*', (file) => handleProjectVideoUpload(project.id, file))}>
                                      <Upload size={24} className="text-zinc-400"/>
                                      <span className="text-xs">Upload or Add Link</span>
                                   </Button>
                               )}
                               {!project.link && (
                                  <Input placeholder="Or paste YouTube link..." value={project.link} onChange={(e) => updateProject(project.id, { link: e.target.value })} className="mt-2" />
                               )}
                            </div>
                         </div>
                       </div>
                     )}
                   </div>
                 ))}
               </div>
            </div>
          </div>
        )}

        {/* === TESTIMONIALS & TOOLS === */}
        {(activeTab === 'testimonials' || activeTab === 'tools') && (
           <div className="space-y-6 animate-fadeIn">
              {activeTab === 'testimonials' && (
                 <>
                    <div className="flex justify-between">
                       <h3 className="text-sm font-bold text-white">Testimonials</h3>
                       <Button size="sm" variant="secondary" onClick={addTestimonial} icon={<Plus size={14}/>}>Add</Button>
                    </div>
                    {data.testimonials.map((t) => (
                      <div key={t.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-3 relative">
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
                    <TextArea label="Software (Comma separated)" value={data.tools.join(', ')} onChange={(e) => handleArrayInput('tools', e.target.value)} rows={3} />
                    <TextArea label="AI Tools (Comma separated)" value={data.aiTools.join(', ')} onChange={(e) => handleArrayInput('aiTools', e.target.value)} rows={3} />
                    <TextArea label="General Skills (Comma separated)" value={data.skills.join(', ')} onChange={(e) => handleArrayInput('skills', e.target.value)} rows={3} />
                 </>
              )}
           </div>
        )}

      </div>
    </div>
  );
};