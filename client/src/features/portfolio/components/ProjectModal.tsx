import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { Project } from '@/types';
import { FramesPlayer } from '@/components/shared/FramesPlayer';

interface ProjectModalProps {
  project: Project | null;
  onClose: () => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ project, onClose }) => {
  // Lock body scroll when modal is open
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

  return (
    <AnimatePresence>
      {project && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl"
            onClick={onClose}
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[100] pointer-events-none flex flex-col items-center justify-center p-0 sm:p-6 lg:p-12 overflow-y-auto custom-scrollbar">
            
            {/* Close Button - Fixed Top Right */}
            <motion.button
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              onClick={onClose}
              className="fixed top-6 right-6 z-[110] p-4 text-white/50 hover:text-white pointer-events-auto transition-colors"
              aria-label="Close modal"
            >
              <div className="flex items-center gap-3 group">
                <span className="font-display text-[10px] tracking-[0.2em] uppercase opacity-0 group-hover:opacity-100 transition-opacity -translate-x-4 group-hover:translate-x-0 duration-300">Close</span>
                <X size={24} strokeWidth={1} />
              </div>
            </motion.button>

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-7xl bg-bg-base border border-border/50 pointer-events-auto flex flex-col my-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Banner (Film Strip Meta) */}
              <div className="w-full bg-bg-raised border-b border-border flex items-center justify-between px-6 py-3">
                <span className="font-display text-[10px] tracking-[0.2em] text-text-subtle uppercase">
                  {project.contentType || 'Project'}
                </span>
                <span className="font-mono text-[10px] tracking-widest text-text-subtle">
                  FRM-{project._id?.slice(-4).toUpperCase() || 'NEW'}
                </span>
              </div>

              {/* Player Area */}
              <div className="w-full bg-black">
                <div className="w-full aspect-video">
                  <FramesPlayer
                    url={project.videoUrl}
                    thumbnail={project.thumbnailUrl}
                    aspectRatio="16:9" // Modals force 16:9 player box for consistency, letterboxing internal video if needed
                  />
                </div>
              </div>

              {/* Project Meta Info */}
              <div className="p-8 md:p-12 lg:p-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
                  
                  {/* Left Column: Title & Description */}
                  <div className="lg:col-span-8">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold tracking-tight text-text-primary mb-6">
                      {project.title || 'Untitled'}
                    </h2>
                    {project.description && (
                      <p className="text-base sm:text-lg text-text-muted leading-relaxed whitespace-pre-wrap max-w-3xl">
                        {project.description}
                      </p>
                    )}
                  </div>

                  {/* Right Column: Metadata List */}
                  <div className="lg:col-span-4 flex flex-col gap-8 lg:pl-8 lg:border-l lg:border-border">
                    {/* Subject Matter */}
                    {project.subjectMatter && (
                      <div>
                        <h4 className="text-[10px] font-display font-bold tracking-[0.2em] text-text-subtle uppercase mb-2">Subject</h4>
                        <p className="text-text-primary">{project.subjectMatter}</p>
                      </div>
                    )}

                    {/* Software Used */}
                    {project.softwareUsed && project.softwareUsed.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-display font-bold tracking-[0.2em] text-text-subtle uppercase mb-2">Tools</h4>
                        <div className="flex flex-wrap gap-2">
                          {project.softwareUsed.map(tool => (
                            <span key={tool} className="text-sm text-text-primary">{tool}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI Tools Used */}
                    {project.aiToolsUsed && project.aiToolsUsed.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-display font-bold tracking-[0.2em] text-text-subtle uppercase mb-2">AI Implementation</h4>
                        <div className="flex flex-wrap gap-2">
                          {project.aiToolsUsed.map(tool => (
                            <span key={tool} className="text-sm text-text-primary">{tool}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </div>

            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
