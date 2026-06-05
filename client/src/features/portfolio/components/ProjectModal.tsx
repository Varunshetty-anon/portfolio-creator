import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info } from 'lucide-react';
import type { Project } from '@/types';
import { FramesPlayer } from '@/components/shared/FramesPlayer';

interface ProjectModalProps {
  project: Project | null;
  onClose: () => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ project, onClose }) => {
  const [showInfo, setShowInfo] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (project) {
      document.body.style.overflow = 'hidden';
      setShowInfo(false); // reset info state
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[100] bg-black text-white flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Edge-to-Edge Background Player Layer */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <FramesPlayer
              url={project.videoUrl}
              thumbnail={project.thumbnailUrl}
              aspectRatio="16:9"
              controls={false}
              autoplay={true}
              muted={false}
              loop={true}
            />
          </div>

          {/* Gradient Overlays for Readability */}
          <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-10" />
          <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none z-10" />

          {/* Top Navigation */}
          <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-6 md:p-12 pointer-events-auto">
            <span className="font-mono text-xs tracking-widest uppercase text-white/60">
              FRM-{project._id?.slice(-4).toUpperCase() || 'NEW'}
            </span>

            <div className="flex items-center gap-6">
              <button
                onClick={() => setShowInfo(!showInfo)}
                className="group flex items-center gap-3 text-white/60 hover:text-white transition-colors"
              >
                <span className="font-mono text-[10px] tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity hidden md:inline-block">
                  {showInfo ? 'Hide Details' : 'Show Details'}
                </span>
                <Info size={24} strokeWidth={1.5} />
              </button>

              <button
                onClick={onClose}
                className="group flex items-center gap-3 text-white/60 hover:text-white transition-colors"
              >
                <span className="font-mono text-[10px] tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity hidden md:inline-block">
                  Close
                </span>
                <X size={28} strokeWidth={1} />
              </button>
            </div>
          </div>

          {/* Bottom Title Bar */}
          <div className="absolute bottom-0 inset-x-0 z-20 p-6 md:p-12 pointer-events-none flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="flex-1">
              <h2 className="font-display font-bold uppercase tracking-tight text-4xl md:text-7xl text-white leading-none">
                {project.title || 'Untitled'}
              </h2>
              <p className="font-mono text-xs tracking-widest uppercase text-white/60 mt-4">
                {project.contentType || 'Project'}
              </p>
            </div>
          </div>

          {/* Expanded Metadata Overlay */}
          <AnimatePresence>
            {showInfo && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 z-30 bg-black/80 backdrop-blur-xl flex flex-col justify-end p-6 md:p-12 pointer-events-auto"
                onClick={() => setShowInfo(false)}
              >
                <div 
                  className="w-full max-w-4xl cursor-default"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="font-display font-bold uppercase tracking-tight text-3xl md:text-5xl text-white mb-8">
                    {project.title}
                  </h3>
                  
                  {project.description && (
                    <p className="text-lg md:text-xl text-white/80 font-light leading-relaxed mb-12 max-w-2xl">
                      {project.description}
                    </p>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-white/20 pt-8">
                    {project.subjectMatter && (
                      <div>
                        <h4 className="font-mono text-[10px] tracking-widest uppercase text-white/40 mb-3">Subject</h4>
                        <p className="text-sm text-white/90">{project.subjectMatter}</p>
                      </div>
                    )}
                    
                    {project.aspectRatio && (
                      <div>
                        <h4 className="font-mono text-[10px] tracking-widest uppercase text-white/40 mb-3">Format</h4>
                        <p className="text-sm text-white/90">{project.aspectRatio}</p>
                      </div>
                    )}

                    {project.softwareUsed && project.softwareUsed.length > 0 && (
                      <div>
                        <h4 className="font-mono text-[10px] tracking-widest uppercase text-white/40 mb-3">Tools</h4>
                        <div className="flex flex-col gap-2">
                          {project.softwareUsed.map(tool => (
                            <span key={tool} className="text-sm text-white/90">{tool}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {project.aiToolsUsed && project.aiToolsUsed.length > 0 && (
                      <div>
                        <h4 className="font-mono text-[10px] tracking-widest uppercase text-white/40 mb-3">AI</h4>
                        <div className="flex flex-col gap-2">
                          {project.aiToolsUsed.map(tool => (
                            <span key={tool} className="text-sm text-white/90">{tool}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      )}
    </AnimatePresence>
  );
};
