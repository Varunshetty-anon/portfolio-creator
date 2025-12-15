import React, { useState } from 'react';
import { PortfolioData, Project, Testimonial } from '../types';
import { Input, TextArea } from './ui/Input';
import { Button } from './ui/Button';
import { Plus, Trash2, Video, Wand2, Image, Link, ChevronDown, ChevronUp, Upload, X, MessageSquare, User, AtSign } from 'lucide-react';

interface EditorPanelProps {
  data: PortfolioData;
  onChange: (newData: PortfolioData) => void;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({ data, onChange }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'content' | 'testimonials' | 'tools'>('profile');
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  const updateField = (field: keyof PortfolioData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const updateSocials = (field: keyof typeof data.socials, value: string) => {
    onChange({ ...data, socials: { ...data.socials, [field]: value } });
  };

  // --- Project Helpers ---
  const addProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      title: "New Project",
      description: "Brief description of the project...",
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

  const updateProject = (id: string, field: keyof Project, value: string) => {
    const newProjects = data.projects.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    );
    updateField('projects', newProjects);
  };

  // --- Testimonial Helpers ---
  const addTestimonial = () => {
    const newTestimonial: Testimonial = {
      id: Date.now().toString(),
      name: "Client Name",
      role: "Client Role",
      quote: "They did an amazing job..."
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

  // --- File Upload Helper ---
  const handleFileUpload = (accept: string, callback: (result: string) => void) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Limit file size to 1MB (1024 * 1024 bytes) to prevent LocalStorage QuotaExceededError
        const limit = 1 * 1024 * 1024;
        if (file.size > limit) {
          alert(`File too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size for direct upload is 1MB. Please use an external URL for larger files.`);
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            callback(event.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  return (
    <div className="h-full flex flex-col bg-zinc-900 border-r border-zinc-800">
      
      {/* Header */}
      <div className="p-6 border-b border-zinc-800 bg-zinc-950">
        <h2 className="text-xl font-display font-bold text-white mb-1">Editor</h2>
        <p className="text-xs text-zinc-500">Customize your portfolio details.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800 overflow-x-auto no-scrollbar">
        {['profile', 'content', 'testimonials', 'tools'].map((tab) => (
           <button 
           key={tab}
           onClick={() => setActiveTab(tab as any)}
           className={`flex-1 py-3 px-4 text-sm font-medium transition-colors capitalize whitespace-nowrap ${activeTab === tab ? 'bg-zinc-800 text-white border-b-2 border-white' : 'text-zinc-500 hover:text-zinc-300'}`}
         >
           {tab}
         </button>
        ))}
      </div>

      {/* Scrollable Form Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        
        {activeTab === 'profile' && (
          <div className="space-y-5 animate-fadeIn">
            {/* Profile Image Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2"><Image size={14}/> Profile Image</h3>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-zinc-800 overflow-hidden border border-zinc-700">
                  <img src={data.profileImage} alt="Profile" className="w-full h-full object-cover" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => handleFileUpload('image/*', (res) => updateField('profileImage', res))} icon={<Upload size={14}/>}>
                    Upload
                  </Button>
                </div>
              </div>
              <Input 
                label="Or Image URL" 
                value={data.profileImage} 
                onChange={(e) => updateField('profileImage', e.target.value)} 
              />
            </div>
            
            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <h3 className="text-sm font-bold text-white">Basic Info</h3>
              <Input label="Display Name" value={data.name} onChange={(e) => updateField('name', e.target.value)} />
              <Input label="Role / Title" value={data.role} onChange={(e) => updateField('role', e.target.value)} />
              <TextArea label="Short Bio" value={data.bio} onChange={(e) => updateField('bio', e.target.value)} rows={4} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Location" value={data.location} onChange={(e) => updateField('location', e.target.value)} />
                <Input label="Languages" value={data.languages} onChange={(e) => updateField('languages', e.target.value)} />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <h3 className="text-sm font-bold text-white">Contact & Socials</h3>
              <Input label="Contact Form Email" value={data.contactEmail} onChange={(e) => updateField('contactEmail', e.target.value)} placeholder="Where you receive inquiries" />
              <Input label="Public Email (displayed)" value={data.socials.email} onChange={(e) => updateSocials('email', e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                 <Input label="Instagram" value={data.socials.instagram || ''} onChange={(e) => updateSocials('instagram', e.target.value)} prefix="@" />
                 <Input label="Twitter / X" value={data.socials.twitter || ''} onChange={(e) => updateSocials('twitter', e.target.value)} />
                 <Input label="YouTube" value={data.socials.youtube || ''} onChange={(e) => updateSocials('youtube', e.target.value)} />
                 <Input label="LinkedIn" value={data.socials.linkedin || ''} onChange={(e) => updateSocials('linkedin', e.target.value)} />
                 <Input label="Discord" value={data.socials.discord || ''} onChange={(e) => updateSocials('discord', e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Showreel */}
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2"><Video size={14} className="text-purple-400"/> Main Showreel</h3>
              <Input label="Video Link (YouTube/Vimeo)" value={data.showreelLink} onChange={(e) => updateField('showreelLink', e.target.value)} />
              
              <div className="space-y-2">
                 <label className="text-xs font-medium text-zinc-500 uppercase">Thumbnail</label>
                 <div className="flex items-center gap-3">
                    <div className="w-20 h-12 bg-zinc-900 rounded border border-zinc-800 overflow-hidden">
                       <img src={data.showreelThumbnail} className="w-full h-full object-cover" />
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => handleFileUpload('image/*', (val) => updateField('showreelThumbnail', val))}>Change</Button>
                 </div>
              </div>
            </div>

            {/* Projects */}
            <div className="space-y-3">
               <div className="flex justify-between items-center">
                 <h3 className="text-sm font-bold text-white">Project Gallery</h3>
                 <Button size="sm" variant="secondary" onClick={addProject} icon={<Plus size={14}/>}>Add</Button>
               </div>
               
               <div className="space-y-3">
                 {data.projects.map((project, idx) => (
                   <div key={project.id} className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden">
                     <div 
                        className="flex items-center justify-between p-3 cursor-pointer hover:bg-zinc-900 transition-colors"
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
                       <div className="p-4 border-t border-zinc-800 space-y-4 bg-zinc-900/50">
                         <Input label="Title" value={project.title} onChange={(e) => updateProject(project.id, 'title', e.target.value)} />
                         <Input label="Category" value={project.category} onChange={(e) => updateProject(project.id, 'category', e.target.value)} />
                         <TextArea label="Description" value={project.description || ''} onChange={(e) => updateProject(project.id, 'description', e.target.value)} rows={2} />
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                               <label className="text-xs font-medium text-zinc-500 uppercase">Thumbnail</label>
                               <div className="flex flex-col gap-2">
                                  {project.thumbnail && (
                                     <img src={project.thumbnail} className="w-full aspect-video object-cover rounded border border-zinc-800 bg-black" />
                                  )}
                                  <div className="flex gap-2">
                                     <Button size="sm" className="flex-1" variant="secondary" onClick={() => handleFileUpload('image/*', (val) => updateProject(project.id, 'thumbnail', val))}>
                                        <Upload size={14} className="mr-2"/> Upload
                                     </Button>
                                     <Button size="sm" variant="outline" onClick={() => updateProject(project.id, 'thumbnail', '')}><X size={14}/></Button>
                                  </div>
                               </div>
                            </div>

                            <div className="space-y-2">
                               <label className="text-xs font-medium text-zinc-500 uppercase">Video Source</label>
                               <Input 
                                  placeholder="https://..." 
                                  value={project.link} 
                                  onChange={(e) => updateProject(project.id, 'link', e.target.value)} 
                               />
                               <div className="flex items-center gap-2">
                                 <div className="h-px bg-zinc-800 flex-1"></div>
                                 <span className="text-[10px] text-zinc-600 uppercase">OR</span>
                                 <div className="h-px bg-zinc-800 flex-1"></div>
                               </div>
                               <Button size="sm" className="w-full" variant="secondary" onClick={() => handleFileUpload('video/*', (val) => updateProject(project.id, 'link', val))}>
                                  <Upload size={14} className="mr-2"/> Upload Video
                               </Button>
                               <p className="text-[10px] text-zinc-500">Video uploads increase save file size significantly.</p>
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

        {activeTab === 'testimonials' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-sm font-bold text-white">Client Testimonials</h3>
               <Button size="sm" variant="secondary" onClick={addTestimonial} icon={<Plus size={14}/>}>Add</Button>
            </div>
            
            <div className="space-y-4">
              {data.testimonials.map((t) => (
                <div key={t.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl space-y-3 relative group">
                  <button onClick={() => removeTestimonial(t.id)} className="absolute top-4 right-4 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={14} />
                  </button>
                  <div className="grid grid-cols-2 gap-3 pr-6">
                    <Input label="Client Name" value={t.name} onChange={(e) => updateTestimonial(t.id, 'name', e.target.value)} />
                    <Input label="Role/Company" value={t.role} onChange={(e) => updateTestimonial(t.id, 'role', e.target.value)} />
                  </div>
                  <TextArea label="Quote" value={t.quote} onChange={(e) => updateTestimonial(t.id, 'quote', e.target.value)} rows={2} />
                </div>
              ))}
              {data.testimonials.length === 0 && (
                <div className="text-center py-8 text-zinc-600 border border-dashed border-zinc-800 rounded-xl">
                  No testimonials added yet.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'tools' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-white">Editing Software</h3>
              <p className="text-xs text-zinc-500 mb-2">Separate with commas</p>
              <TextArea 
                value={data.tools.join(', ')} 
                onChange={(e) => handleArrayInput('tools', e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2"><Wand2 size={14} className="text-indigo-400"/> AI Tools</h3>
              <p className="text-xs text-zinc-500 mb-2">Separate with commas</p>
              <TextArea 
                value={data.aiTools.join(', ')} 
                onChange={(e) => handleArrayInput('aiTools', e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-bold text-white">General Skills</h3>
              <p className="text-xs text-zinc-500 mb-2">Separate with commas</p>
              <TextArea 
                value={data.skills.join(', ')} 
                onChange={(e) => handleArrayInput('skills', e.target.value)}
                rows={3}
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};