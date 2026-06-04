// ========================
// FRAMES ProjectModal Component
// ========================
// Full-screen overlay to view a project's video and details.

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PlayCircle } from 'lucide-react';
import { MediaPlayer } from '@/components/shared/MediaPlayer';
import type { Project } from '@/types';
import { PROJECT_CONTENT_TYPES, PROJECT_SUBJECT_MATTERS } from '@/lib/constants';

interface ProjectModalProps {
  project: Project | null;
  onClose: () => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ project, onClose }) => {
  // Lock body scroll when open
  useEffect(() => {
    if (project) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [project]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!project) return null;

  const typeLabel = PROJECT_CONTENT_TYPES.find(t => t.id === project.contentType)?.label || project.contentType;
  const subjectLabel = PROJECT_SUBJECT_MATTERS.find(s => s.id === project.subjectMatter)?.label || project.subjectMatter;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-6 lg:p-12">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 bg-black/90 backdrop-blur-xl"
          onClick={onClose}
        />

        {/* Modal Container */}
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full h-full md:h-auto max-h-full max-w-7xl bg-bg-base md:rounded-2xl border-border md:border shadow-2xl overflow-hidden flex flex-col md:flex-row"
        >
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-white hover:bg-black/80 transition-colors"
          >
            <X size={20} />
          </button>

          {/* Player Area (Left/Top) */}
          <div className="w-full md:w-2/3 lg:w-3/4 bg-black flex items-center justify-center min-h-[40vh] md:min-h-[600px] relative">
            {project.videoUrl ? (
              <div className="w-full h-full p-0 md:p-8 flex items-center justify-center">
                <div className={`w-full max-h-full shadow-2xl ${
                  project.aspectRatio === '9:16' ? 'max-w-[400px]' : 'max-w-full'
                }`}>
                  <MediaPlayer 
                    url={project.videoUrl} 
                    thumbnailUrl={project.thumbnailUrl}
                    aspectRatio={project.aspectRatio}
                    autoPlay={true}
                  />
                </div>
              </div>
            ) : project.thumbnailUrl ? (
              <img src={project.thumbnailUrl} alt={project.title} className="w-full h-full object-contain" />
            ) : (
              <div className="text-text-muted flex flex-col items-center">
                <PlayCircle size={48} className="mb-4 opacity-50" />
                <p>No media available</p>
              </div>
            )}
          </div>

          {/* Details Area (Right/Bottom) */}
          <div className="w-full md:w-1/3 lg:w-1/4 bg-bg-base p-6 md:p-8 overflow-y-auto border-t md:border-t-0 md:border-l border-border">
            
            <div className="flex flex-wrap gap-2 mb-6">
              {typeLabel && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/10 px-2 py-1 rounded">
                  {typeLabel}
                </span>
              )}
              {subjectLabel && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted bg-bg-raised px-2 py-1 rounded">
                  {subjectLabel}
                </span>
              )}
            </div>

            <h2 className="text-2xl md:text-3xl font-display font-bold text-text-primary mb-6 leading-tight">
              {project.title}
            </h2>

            {project.description && (
              <div className="mb-8">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">About</h4>
                <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">
                  {project.description}
                </p>
              </div>
            )}

            {project.softwareUsed && project.softwareUsed.length > 0 && (
              <div className="mb-8">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">Software Used</h4>
                <div className="flex flex-wrap gap-2">
                  {project.softwareUsed.map(tool => (
                    <span key={tool} className="text-xs text-text-secondary font-medium bg-bg-raised/50 border border-border-strong/50 px-3 py-1.5 rounded-md">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {project.aiToolsUsed && project.aiToolsUsed.length > 0 && (
              <div className="mb-8">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-accent mb-3">AI Tools</h4>
                <div className="flex flex-wrap gap-2">
                  {project.aiToolsUsed.map(tool => (
                    <span key={tool} className="text-xs text-accent font-medium bg-accent/10 border border-accent/20 px-3 py-1.5 rounded-md">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
