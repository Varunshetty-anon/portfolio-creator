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
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { uploadApi } from '@/lib/api';

interface ProjectCardEditorProps {
  project: Project;
  index: number;
  isExpanded: boolean;
  isHero?: boolean;
  onSetHero?: () => void;
  onToggleExpand: () => void;
  onChange: (project: Project) => void;
  onDelete: () => void;
  onAutoSave: () => void;
  isDeleting?: boolean;
}

export default function ProjectCardEditor({
  project,
  index,
  isExpanded,
  isHero = false,
  onSetHero,
  onToggleExpand,
  onChange,
  onDelete,
  onAutoSave,
  isDeleting = false
}: ProjectCardEditorProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project._id || project.id });

  const [isValidatingLink, setIsValidatingLink] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [isDrivePrivate, setIsDrivePrivate] = useState<boolean>(false);

  const latestProjectRef = React.useRef(project);
  useEffect(() => {
    latestProjectRef.current = project;
  }, [project]);

  // Auto-extract metadata when videoUrl changes
  useEffect(() => {
    const fetchMetadata = async () => {
      const currentProject = latestProjectRef.current;
      if (!currentProject.videoUrl) return;
      
      const source = detectVideoSource(currentProject.videoUrl) as string;
      setIsDrivePrivate(false);
      
      if (source !== 'unknown' && (!currentProject.thumbnailUrl || currentProject.videoSource !== source)) {
        setIsValidatingLink(true);
        setLinkError(null);
        
        try {
          let extractedThumbnail = '';

          if (source === 'gdrive') {
            const driveMeta = await uploadApi.validateDrive(currentProject.videoUrl);
            if (driveMeta.isPrivate) {
              setIsDrivePrivate(true);
            }
            const match = currentProject.videoUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || currentProject.videoUrl.match(/id=([a-zA-Z0-9_-]+)/);
            if (match && match[1]) {
              extractedThumbnail = `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1280`;
            }
          } else if (source === 'youtube') {
            const match = currentProject.videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
            if (match && match[1]) {
              const videoId = match[1];
              extractedThumbnail = await new Promise((resolve) => {
                const url = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
                const img = new Image();
                img.onload = () => {
                  if (img.width === 120) {
                    resolve(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);
                  } else {
                    resolve(url);
                  }
                };
                img.onerror = () => resolve(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);
                img.src = url;
              });
            }
          } else if (source === 'vimeo') {
            const res = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(currentProject.videoUrl)}`);
            if (res.ok) {
              const data = await res.json();
              if (data.thumbnail_url) {
                extractedThumbnail = data.thumbnail_url;
              }
            }
          } else if (source === 'cloudinary') {
            extractedThumbnail = currentProject.videoUrl.replace(/\.[^/.]+$/, '.jpg').replace('/upload/', '/upload/so_0/');
          }

          const latest = latestProjectRef.current;
          
          if (extractedThumbnail && !latest.thumbnailUrl) {
            onChange({
              ...latest,
              videoSource: source as any,
              thumbnailUrl: extractedThumbnail
            });
            if (typeof window !== 'undefined') {
              import('react-hot-toast').then(({ default: toast }) => {
                toast.success('Thumbnail auto-detected');
              }).catch(() => {});
            }
          } else {
            onChange({
              ...latest,
              videoSource: source as any
            });
          }
        } catch (err) {
          setLinkError("Failed to validate link.");
        } finally {
          setIsValidatingLink(false);
        }
      } else if (source === 'gdrive') {
        // Just check privacy if metadata is already populated
        try {
          const driveMeta = await uploadApi.validateDrive(currentProject.videoUrl);
          if (driveMeta.isPrivate) setIsDrivePrivate(true);
        } catch {}
      }
    };

    // Debounce metadata fetch
    const timeoutId = setTimeout(fetchMetadata, 1000);
    return () => clearTimeout(timeoutId);
  }, [project.videoUrl]); // Intentionally only run on URL change

  const handleFieldChange = (field: keyof Project, value: any) => {
    onChange({ ...latestProjectRef.current, [field]: value });
  };

  const handleMediaUrlSave = (url: string) => {
    const isImg = url.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null;
    const latest = latestProjectRef.current;

    onChange({
      ...latest,
      videoUrl: isImg ? '' : url,
      imageUrl: isImg ? url : '',
    });
  };

  const handleMultiSelect = (field: 'softwareUsed' | 'aiToolsUsed', value: string) => {
    const current = project[field] || [];
    if (current.includes(value)) {
      handleFieldChange(field, current.filter(t => t !== value));
    } else {
      handleFieldChange(field, [...current, value]);
    }
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    position: isDragging ? 'relative' as const : undefined,
  };

  return (
    <motion.div 
      layout
      ref={setNodeRef}
      style={style}
      className={`bg-[#111111] border border-white/[0.06] hover:border-white/10 rounded-xl overflow-hidden transition-colors ${isDragging ? 'shadow-2xl scale-[1.02] border-[#C0A36E]/50' : ''}`}
    >
      {/* ── Collapsed Header ── */}
      <div 
        className="flex items-center p-4 cursor-pointer hover:bg-bg-floating transition-colors"
        onClick={onToggleExpand}
      >
        <div 
          {...attributes}
          {...listeners}
          className="p-2 mr-2 text-text-muted hover:text-text-primary cursor-grab active:cursor-grabbing transition-colors"
          onClick={(e) => e.stopPropagation()} // Prevent expand when dragging
        >
          <GripVertical size={16} />
        </div>
        
        <span className="text-xs font-semibold text-text-muted w-8 font-mono">{String(index + 1).padStart(2, '0')}</span>
        
        <div className="w-12 h-12 bg-bg-base rounded overflow-hidden mr-4 shrink-0 flex items-center justify-center border border-border-strong shadow-inner">
          {project.thumbnailUrl ? (
            <img src={project.thumbnailUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon size={16} className="text-text-muted/50" />
          )}
        </div>
        
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <div>
            <h4 className="text-sm font-semibold text-text-primary truncate">
              {project.title || 'Untitled Project'}
            </h4>
            <p className="text-xs text-text-muted truncate mt-0.5 font-medium">
              {project.contentType || 'No type'} • {project.videoUrl || 'No link'}
            </p>
          </div>
          {isHero && (
            <span className="ml-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-accent/10 text-accent border border-accent/20 rounded-sm">
              Hero
            </span>
          )}
        </div>
        
        <div className="p-2 text-text-muted">
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
            className="border-t border-white/[0.06] bg-[#111111]"
          >
            <div className="p-6 space-y-8">
              
              {/* URL & Thumbnail Row */}
              <div className="flex flex-col gap-6">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2 block">Project Media (Video or Image)</label>
                  <MediaManager
                    type="project"
                    currentUrl={project.videoUrl || project.imageUrl}
                    allowUrlInput={true}
                    onUrlSave={handleMediaUrlSave}
                    onUploadComplete={(url, thumb) => {
                      const isImg = url.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null;
                      onChange({ 
                        ...project, 
                        videoUrl: isImg ? '' : url,
                        imageUrl: isImg ? url : '',
                        thumbnailUrl: thumb || project.thumbnailUrl 
                      });
                    }}
                    onRemove={() => {
                      onChange({ ...project, videoUrl: '', imageUrl: '' });
                    }}
                  />
                  {linkError && <p className="text-xs text-danger mt-2 font-medium">{linkError}</p>}
                  {project.videoSource === 'gdrive' && (
                    <div className={`mt-3 p-3 border rounded-lg ${isDrivePrivate ? 'bg-danger/10 border-danger/30' : 'bg-info/10 border-info/30'}`}>
                      <p className={`text-xs font-medium ${isDrivePrivate ? 'text-danger' : 'text-info'}`}>
                        {isDrivePrivate 
                          ? <strong>Private Google Drive Link Detected. This video will not play for visitors. Please change the sharing settings to "Anyone with the link".</strong>
                          : <><strong>Google Drive Link Detected.</strong> Make sure this file is shared with "Anyone with the link can view".</>
                        }
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2 block">Custom Thumbnail</label>
                  <MediaManager
                    type="thumbnail"
                    currentUrl={project.thumbnailUrl}
                    onUploadComplete={(url) => handleFieldChange('thumbnailUrl', url)}
                    onRemove={() => handleFieldChange('thumbnailUrl', '')}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2 block">ASPECT RATIO</label>
                  <div className="flex bg-[#050505] border border-white/10 rounded-lg p-1">
                    {['16:9', '9:16', '4:3', '1:1', '2.35:1'].map(ratio => {
                      const isActive = (project.aspectRatio || '16:9') === ratio;
                      return (
                        <button
                          key={ratio}
                          onClick={() => handleFieldChange('aspectRatio', ratio)}
                          className={`flex-1 py-1.5 text-xs font-mono transition-colors rounded-md border ${
                            isActive 
                              ? 'border-[#C0A36E] text-[#C0A36E] bg-[#C0A36E]/10' 
                              : 'border-transparent text-white/40 hover:text-white/60 hover:bg-white/5'
                          }`}
                        >
                          {ratio}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <Input
                    label="Project Title"
                    placeholder="e.g. Nike - Just Do It (Director's Cut)"
                    value={project.title}
                    onChange={(e) => handleFieldChange('title', e.target.value)}
                    className="font-display font-medium text-lg"
                  />
                  
                  <div className="flex items-center justify-between p-3 bg-bg-raised border border-border-strong rounded-lg">
                    <div>
                      <h5 className="text-sm font-semibold text-text-primary">Hero Project</h5>
                      <p className="text-xs text-text-muted mt-0.5">Use this project as the main portfolio hero.</p>
                    </div>
                    <Button 
                      variant={isHero ? 'primary' : 'secondary'} 
                      size="sm" 
                      onClick={onSetHero}
                      disabled={isHero}
                      className={isHero ? 'bg-accent hover:bg-accent text-bg-base pointer-events-none' : ''}
                    >
                      {isHero ? 'Active Hero' : 'Set as Hero'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Categorization */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-muted block">Content Type</label>
                  <select
                    value={project.contentType || ''}
                    onChange={(e) => handleFieldChange('contentType', e.target.value)}
                    className="w-full bg-bg-raised border border-border-strong rounded-lg px-3 py-2.5 text-sm font-medium text-text-primary focus:outline-none focus:border-accent appearance-none shadow-sm transition-colors"
                  >
                    <option value="" disabled>Select type...</option>
                    {PROJECT_CONTENT_TYPES.map(type => (
                      <option key={type.id} value={type.id}>{type.label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-muted block">Subject Matter</label>
                  <select
                    value={project.subjectMatter || ''}
                    onChange={(e) => handleFieldChange('subjectMatter', e.target.value)}
                    className="w-full bg-bg-raised border border-border-strong rounded-lg px-3 py-2.5 text-sm font-medium text-text-primary focus:outline-none focus:border-accent appearance-none shadow-sm transition-colors"
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
              <div className="space-y-5 pt-6 border-t border-border-strong/50">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-text-muted block mb-3">
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
                            px-3 py-1.5 rounded-full text-xs font-medium transition-all shadow-sm
                            ${isSelected 
                              ? 'bg-text-primary text-bg-base border border-text-primary' 
                              : 'bg-bg-raised text-text-muted border border-border hover:text-text-primary hover:border-border-strong hover:bg-bg-floating'}
                          `}
                        >
                          {tool.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-accent block mb-3">
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
                            px-3 py-1.5 rounded-full text-xs font-medium transition-all shadow-sm
                            ${isSelected 
                              ? 'bg-accent/10 text-accent border border-accent/30' 
                              : 'bg-bg-raised text-text-muted border border-border hover:text-accent hover:border-accent/30 hover:bg-accent/5'}
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
              <div className="pt-6 mt-8 border-t border-danger/10 flex justify-end">
                <Button 
                  variant="danger" 
                  size="sm"
                  onClick={onDelete}
                  className={isDeleting 
                    ? "bg-danger border border-danger text-white transition-colors" 
                    : "bg-danger/5 border border-danger/20 text-danger hover:bg-danger hover:text-white transition-colors"}
                >
                  <Trash2 size={14} className="mr-2" />
                  {isDeleting ? "Confirm Delete?" : "Remove Project"}
                </Button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
