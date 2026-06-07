import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Project } from '@/types';
import { FramesPlayer } from '@/components/shared/FramesPlayer';

interface ProjectModalProps {
  project: Project | null;
  allProjects?: Project[];
  onClose: () => void;
  onSelectProject?: (id: string) => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ project, allProjects = [], onClose, onSelectProject }) => {
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

  const currentIndex = project && allProjects.length > 0 
    ? allProjects.findIndex(p => (p._id || p.id) === (project._id || project.id))
    : -1;

  const handlePrev = () => {
    if (currentIndex > 0 && onSelectProject && allProjects[currentIndex - 1]) {
      const prevId = allProjects[currentIndex - 1]._id || allProjects[currentIndex - 1].id;
      if (prevId) onSelectProject(prevId as string);
    }
  };

  const handleNext = () => {
    if (currentIndex >= 0 && currentIndex < allProjects.length - 1 && onSelectProject && allProjects[currentIndex + 1]) {
      const nextId = allProjects[currentIndex + 1]._id || allProjects[currentIndex + 1].id;
      if (nextId) onSelectProject(nextId as string);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <AnimatePresence>
      {project && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/85 backdrop-blur-[20px] backdrop-saturate-[180%]"
          />

          {/* Modal Container */}
          <motion.div
            layoutId={`card-${project._id || project.id}`}
            className="relative z-10 w-[100vw] h-[100dvh] md:w-[95vw] md:h-[92vh] flex flex-col md:flex-row overflow-hidden"
            style={{
              background: 'rgba(12, 12, 14, 0.92)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(40px)',
              borderRadius: '0px'
            }}
          >
            {/* Close Button Mobile (Top Right) */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-50 p-2 text-white/60 hover:text-white transition-colors backdrop-blur-md md:hidden"
            >
              ✕
            </button>

            {/* Left: Media Player (60%) */}
            <div className="w-full md:w-[60%] h-auto aspect-video md:h-full bg-black relative shrink-0">
              <div className="absolute inset-0">
                {project.videoUrl ? (
                  <FramesPlayer
                    url={project.videoUrl}
                    thumbnail={project.thumbnailUrl}
                    aspectRatio={project.aspectRatio as any || "16:9"}
                    controls={true}
                    autoplay={true}
                    muted={false}
                    loop={true}
                  />
                ) : project.imageUrl ? (
                  <img 
                    src={project.imageUrl || project.thumbnailUrl} 
                    alt={project.title} 
                    className="w-full h-full object-contain"
                  />
                ) : project.thumbnailUrl ? (
                  <img 
                    src={project.thumbnailUrl} 
                    alt={project.title} 
                    className="w-full h-full object-contain"
                  />
                ) : null}
              </div>
            </div>

            {/* Right: Info Panel (40%) */}
            <div className="flex-1 h-full flex flex-col relative overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                
                <span className="font-mono text-[9px] tracking-[0.2em] uppercase border border-white/10 px-2 py-1 text-white/50 inline-block mb-3">
                  {project.contentType || 'Project'}
                </span>
                
                <h2 className="font-display font-bold uppercase tracking-tight text-3xl md:text-4xl text-white leading-tight mt-3">
                  {project.title || 'Untitled'}
                </h2>
                
                {project.description && (
                  <p className="font-light text-sm text-white/60 mt-4 leading-[1.7]">
                    {project.description}
                  </p>
                )}

                <div className="border-t border-white/[0.06] my-5" />

                <div className="grid grid-cols-2 gap-4">
                  {project.subjectMatter && (
                    <div>
                      <h4 className="font-mono text-[9px] tracking-[0.15em] uppercase text-white/30">Client/Brand</h4>
                      <p className="font-mono text-xs text-white/80 mt-0.5">{project.subjectMatter}</p>
                    </div>
                  )}
                  {/* Since Year isn't directly in schema, using role if we can, wait we don't have project.role, the prompt said `project.role`. The schema does not have role for project, I'll ignore year/role if they don't exist, or just use what we have. */}
                </div>

                {project.softwareUsed && project.softwareUsed.length > 0 && (
                  <div className="mt-5">
                    <h4 className="font-mono text-[9px] tracking-[0.15em] uppercase text-white/30 mb-2">TOOLS</h4>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {project.softwareUsed.map((tool: string) => (
                        <span key={tool} className="font-mono text-[9px] px-2 py-0.5 text-white/50 border border-white/10 rounded-full">
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between items-center mt-auto pt-8">
                  {currentIndex > 0 ? (
                    <button
                      onClick={handlePrev}
                      className="font-mono text-xs text-white/40 hover:text-white transition-colors"
                    >
                      ← Previous
                    </button>
                  ) : <div />}

                  <button
                    onClick={onClose}
                    className="font-mono text-xs text-white/60 hover:text-white transition-colors hidden md:block"
                  >
                    ✕ CLOSE
                  </button>

                  {currentIndex >= 0 && currentIndex < allProjects.length - 1 ? (
                    <button
                      onClick={handleNext}
                      className="font-mono text-xs text-white/40 hover:text-white transition-colors"
                    >
                      Next →
                    </button>
                  ) : <div />}
                </div>

              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
