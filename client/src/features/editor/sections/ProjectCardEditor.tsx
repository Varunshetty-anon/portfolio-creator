// ========================
// FRAMES ProjectCardEditor
// ========================
// Individual project editor with collapsible state and auto-metadata extraction.

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GripVertical, ChevronDown, ChevronUp, Trash2, Link as LinkIcon, Image as ImageIcon, Loader2 } from 'lucide-react';
import type { Project } from '@/types';
import { Input, TextArea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { PROJECT_CONTENT_TYPES, PROJECT_SUBJECT_MATTERS, EDITING_TOOLS_LIST, AI_TOOLS_LIST } from '@/lib/constants';
import { getVideoMetadata, detectVideoSource } from '@/lib/media-utils';

interface ProjectCardEditorProps {
  project: Project;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onChange: (project: Project) => void;
  onDelete: () => void;
  onAutoSave: () => void;
}

export default function ProjectCardEditor({
  project,
  index,
  isExpanded,
  onToggleExpand,
  onChange,
  onDelete,
  onAutoSave
}: ProjectCardEditorProps) {
  const [isValidatingLink, setIsValidatingLink] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  // Auto-extract metadata when videoUrl changes
  useEffect(() => {
    const fetchMetadata = async () => {
      if (!project.videoUrl) return;
      
      const source = detectVideoSource(project.videoUrl) as string;
      if (source !== 'unknown' && (!project.thumbnailUrl || project.videoSource !== source)) {
        setIsValidatingLink(true);
        setLinkError(null);
        
        try {
          const meta = await getVideoMetadata(project.videoUrl);
          
          if (meta) {
            onChange({
              ...project,
              videoSource: source as any,
              thumbnailUrl: meta.thumbnail || project.thumbnailUrl,
              aspectRatio: meta.aspectRatio || project.aspectRatio,
            });
          } else {
            setLinkError("Could not extract video details. Check link.");
          }
        } catch (err) {
          setLinkError("Failed to validate link.");
        } finally {
          setIsValidatingLink(false);
        }
      }
    };

    // Debounce metadata fetch
    const timeoutId = setTimeout(fetchMetadata, 1000);
    return () => clearTimeout(timeoutId);
  }, [project.videoUrl]); // Intentionally only run on URL change

  const handleFieldChange = (field: keyof Project, value: any) => {
    onChange({ ...project, [field]: value });
  };

  const handleMultiSelect = (field: 'softwareUsed' | 'aiToolsUsed', value: string) => {
    const current = project[field] || [];
    if (current.includes(value)) {
      handleFieldChange(field, current.filter(t => t !== value));
    } else {
      handleFieldChange(field, [...current, value]);
    }
  };

  return (
    <motion.div 
      layout
      className="bg-frames-surface border border-frames-border rounded-xl overflow-hidden"
    >
      {/* ── Collapsed Header ── */}
      <div 
        className="flex items-center p-4 cursor-pointer hover:bg-zinc-900/50 transition-colors"
        onClick={onToggleExpand}
      >
        <div 
          className="p-2 mr-2 text-zinc-600 hover:text-white cursor-grab active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()} // Prevent expand when dragging
        >
          <GripVertical size={16} />
        </div>
        
        <span className="text-xs font-medium text-zinc-500 w-8">{String(index + 1).padStart(2, '0')}</span>
        
        <div className="w-12 h-12 bg-zinc-900 rounded overflow-hidden mr-4 shrink-0 flex items-center justify-center border border-zinc-800">
          {project.thumbnailUrl ? (
            <img src={project.thumbnailUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon size={16} className="text-zinc-700" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-white truncate">
            {project.title || 'Untitled Project'}
          </h4>
          <p className="text-xs text-zinc-500 truncate mt-0.5">
            {project.contentType || 'No type'} • {project.videoUrl || 'No link'}
          </p>
        </div>
        
        <div className="p-2 text-zinc-500">
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {/* ── Expanded Form ── */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="border-t border-frames-border bg-zinc-900/30"
          >
            <div className="p-6 space-y-6">
              
              {/* URL & Thumbnail Row */}
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/3 aspect-video bg-black rounded-lg border border-zinc-800 overflow-hidden relative flex flex-col items-center justify-center group">
                  {project.thumbnailUrl ? (
                    <>
                      <img src={project.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="secondary" className="text-xs">
                          Change Thumbnail
                        </Button>
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur text-[10px] px-2 py-1 rounded text-zinc-400 font-medium tracking-wider">
                        {project.aspectRatio || '16:9'}
                      </div>
                    </>
                  ) : (
                    <div className="text-zinc-600 flex flex-col items-center">
                      <ImageIcon size={24} className="mb-2 opacity-50" />
                      <span className="text-xs font-medium">No thumbnail</span>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 space-y-4">
                  <div className="relative">
                    <Input
                      label="Video Link"
                      placeholder="YouTube, Vimeo, or Cloudinary URL"
                      value={project.videoUrl || ''}
                      onChange={(e) => handleFieldChange('videoUrl', e.target.value)}
                    />
                    <div className="absolute right-3 top-[38px] text-zinc-500">
                      {isValidatingLink ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : <LinkIcon size={16} />}
                    </div>
                  </div>
                  {linkError && <p className="text-xs text-red-500 mt-1">{linkError}</p>}
                  
                  <Input
                    label="Project Title"
                    placeholder="e.g. Nike - Just Do It (Director's Cut)"
                    value={project.title}
                    onChange={(e) => handleFieldChange('title', e.target.value)}
                    className="font-display font-medium"
                  />
                </div>
              </div>

              {/* Categorization */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400">Content Type</label>
                  <select
                    value={project.contentType || ''}
                    onChange={(e) => handleFieldChange('contentType', e.target.value)}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600 appearance-none"
                  >
                    <option value="" disabled>Select type...</option>
                    {PROJECT_CONTENT_TYPES.map(type => (
                      <option key={type.id} value={type.id}>{type.label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400">Subject Matter</label>
                  <select
                    value={project.subjectMatter || ''}
                    onChange={(e) => handleFieldChange('subjectMatter', e.target.value)}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600 appearance-none"
                  >
                    <option value="" disabled>Select subject...</option>
                    {PROJECT_SUBJECT_MATTERS.map(subject => (
                      <option key={subject.id} value={subject.id}>{subject.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <TextArea
                label="Description & Role"
                placeholder="Briefly describe the project and your specific role in it..."
                value={project.description || ''}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                rows={3}
              />

              {/* Tools Used (Tag selection) */}
              <div className="space-y-4 pt-4 border-t border-zinc-800">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 block mb-3">
                    Software Used
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {EDITING_TOOLS_LIST.map(tool => {
                      const isSelected = project.softwareUsed?.includes(tool.name);
                      return (
                        <button
                          key={tool.id}
                          onClick={() => handleMultiSelect('softwareUsed', tool.name)}
                          className={`
                            px-3 py-1.5 rounded-md text-xs font-medium transition-all
                            ${isSelected 
                              ? 'bg-zinc-800 text-white border border-zinc-700' 
                              : 'bg-zinc-900/50 text-zinc-500 border border-zinc-800/50 hover:text-zinc-300 hover:bg-zinc-900'}
                          `}
                        >
                          {tool.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent-gold/70 block mb-3">
                    AI Tools Used
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AI_TOOLS_LIST.map(tool => {
                      const isSelected = project.aiToolsUsed?.includes(tool.name);
                      return (
                        <button
                          key={tool.id}
                          onClick={() => handleMultiSelect('aiToolsUsed', tool.name)}
                          className={`
                            px-3 py-1.5 rounded-md text-xs font-medium transition-all
                            ${isSelected 
                              ? 'bg-accent-gold/20 text-accent-gold border border-accent-gold/30' 
                              : 'bg-zinc-900/50 text-zinc-500 border border-zinc-800/50 hover:text-zinc-300 hover:bg-zinc-900'}
                          `}
                        >
                          {tool.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="pt-6 mt-6 border-t border-red-900/20 flex justify-end">
                <Button 
                  variant="danger" 
                  size="sm"
                  onClick={onDelete}
                  className="bg-transparent border border-red-900/50 text-red-500 hover:bg-red-950"
                >
                  <Trash2 size={14} className="mr-2" />
                  Remove Project
                </Button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
