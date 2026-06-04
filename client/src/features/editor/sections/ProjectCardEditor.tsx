// ========================
// FRAMES ProjectCardEditor
// ========================
// Individual project editor with collapsible state and auto-metadata extraction.

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GripVertical, ChevronDown, ChevronUp, Trash2, Link as LinkIcon, Image as ImageIcon, Loader2 } from 'lucide-react';
import type { Project } from '@/types';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { MediaManager } from '@/components/shared/MediaManager';
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
              <div className="flex flex-col gap-6">
                <div>
                  <label className="text-xs font-medium text-text-muted mb-2 block">Project Media (Video/Image)</label>
                  <MediaManager
                    type="project"
                    currentUrl={project.videoUrl}
                    allowUrlInput={true}
                    onUrlSave={(url) => handleFieldChange('videoUrl', url)}
                    onUploadComplete={(url, thumb) => {
                      onChange({ ...project, videoUrl: url, thumbnailUrl: thumb || project.thumbnailUrl });
                    }}
                    onRemove={() => handleFieldChange('videoUrl', '')}
                  />
                  {linkError && <p className="text-xs text-danger mt-1">{linkError}</p>}
                  {project.videoSource === 'gdrive' && (
                    <div className="mt-2 p-3 bg-info/10 border border-info/30 rounded-md">
                      <p className="text-xs text-info">
                        <strong>Google Drive Link Detected.</strong> Make sure this file is shared with "Anyone with the link can view".
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-medium text-text-muted mb-2 block">Custom Thumbnail</label>
                  <MediaManager
                    type="thumbnail"
                    currentUrl={project.thumbnailUrl}
                    onUploadComplete={(url) => handleFieldChange('thumbnailUrl', url)}
                    onRemove={() => handleFieldChange('thumbnailUrl', '')}
                  />
                </div>

                <div className="space-y-4">
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
              <Textarea
              label="Description (Optional)"
              placeholder="Brief description of the project..."
              value={project.description || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange({ ...project, description: e.target.value })}
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
