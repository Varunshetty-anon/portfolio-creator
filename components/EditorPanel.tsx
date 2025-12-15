import React, { useState } from 'react';
import { PortfolioData, Project } from '../types';
import { Input, TextArea } from './ui/Input';
import { Button } from './ui/Button';
import { Plus, Trash2, Video, Wand2, Image, Link, ChevronDown, ChevronUp } from 'lucide-react';

interface EditorPanelProps {
  data: PortfolioData;
  onChange: (newData: PortfolioData) => void;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({ data, onChange }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'content' | 'tools'>('profile');
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  const updateField = (field: keyof PortfolioData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const updateSocials = (field: keyof typeof data.socials, value: string) => {
    onChange({ ...data, socials: { ...data.socials, [field]: value } });
  };

  const addProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      title: "New Project",
      thumbnail: `https://picsum.photos/600/800?random=${Date.now()}`,
      link: "#",
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

  const handleArrayInput = (field: 'skills' | 'tools' | 'aiTools', value: string) => {
    // Split by comma and clean up
    const arr = value.split(',').map(s => s.trim()).filter(s => s.length > 0);
    updateField(field, arr);
  };

  return (
    <div className="h-full flex flex-col bg-zinc-900 border-r border-zinc-800">
      
      {/* Header */}
      <div className="p-6 border-b border-zinc-800 bg-zinc-950">
        <h2 className="text-xl font-display font-bold text-white mb-1">Editor</h2>
        <p className="text-xs text-zinc-500">Customize your portfolio details.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800">
        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'profile' ? 'bg-zinc-800 text-white border-b-2 border-white' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Profile
        </button>
        <button 
          onClick={() => setActiveTab('content')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'content' ? 'bg-zinc-800 text-white border-b-2 border-white' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Work
        </button>
        <button 
          onClick={() => setActiveTab('tools')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'tools' ? 'bg-zinc-800 text-white border-b-2 border-white' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Skills
        </button>
      </div>

      {/* Scrollable Form Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        
        {activeTab === 'profile' && (
          <div className="space-y-5 animate-fadeIn">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2"><Image size={14}/> Profile Image</h3>
              <Input 
                label="Image URL" 
                value={data.profileImage} 
                onChange={(e) => updateField('profileImage', e.target.value)} 
                placeholder="https://..."
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
              <h3 className="text-sm font-bold text-white">Social Media</h3>
              <Input label="Email" value={data.socials.email} onChange={(e) => updateSocials('email', e.target.value)} />
              <Input label="Instagram Handle" value={data.socials.instagram} onChange={(e) => updateSocials('instagram', e.target.value)} prefix="@" />
              <Input label="Discord ID" value={data.socials.discord} onChange={(e) => updateSocials('discord', e.target.value)} />
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Showreel */}
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2"><Video size={14} className="text-purple-400"/> Main Showreel</h3>
              <Input label="Thumbnail URL" value={data.showreelThumbnail} onChange={(e) => updateField('showreelThumbnail', e.target.value)} />
              <Input label="Video Link" value={data.showreelLink} onChange={(e) => updateField('showreelLink', e.target.value)} />
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
                         <div className="w-8 h-8 rounded bg-zinc-800 flex-shrink-0 bg-cover bg-center" style={{backgroundImage: `url(${project.thumbnail})`}}></div>
                         <span className="text-sm font-medium truncate">{project.title}</span>
                       </div>
                       <div className="flex items-center gap-2">
                         <button onClick={(e) => { e.stopPropagation(); removeProject(project.id); }} className="p-1 hover:text-red-400 text-zinc-600"><Trash2 size={14}/></button>
                         {expandedProject === project.id ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                       </div>
                     </div>
                     
                     {expandedProject === project.id && (
                       <div className="p-3 border-t border-zinc-800 space-y-3 bg-zinc-900/50">
                         <Input label="Title" value={project.title} onChange={(e) => updateProject(project.id, 'title', e.target.value)} />
                         <Input label="Category (e.g., Reels)" value={project.category} onChange={(e) => updateProject(project.id, 'category', e.target.value)} />
                         <Input label="Thumbnail URL" value={project.thumbnail} onChange={(e) => updateProject(project.id, 'thumbnail', e.target.value)} />
                         <Input label="Video URL" value={project.link} onChange={(e) => updateProject(project.id, 'link', e.target.value)} />
                       </div>
                     )}
                   </div>
                 ))}
               </div>
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