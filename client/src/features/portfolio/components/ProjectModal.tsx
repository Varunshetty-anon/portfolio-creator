import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Project } from '@/types';
import { FramesPlayer } from '@/components/shared/FramesPlayer';

interface ProjectModalProps {
  project: Project | null;
  allProjects?: Project[];
  onClose: () => void;
  onSelectProject?: (id: string) => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ project, allProjects = [], onClose, onSelectProject }) => {
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

  const currentIndex = project && allProjects.length > 0 
    ? allProjects.findIndex(p => (p._id || p.id) === (project._id || project.id))
    : -1;

  const handlePrev = () => {
    if (currentIndex > 0 && onSelectProject && allProjects[currentIndex - 1]) {
      const prevId = allProjects[currentIndex - 1]._id || allProjects[currentIndex - 1].id;
      if (prevId) onSelectProject(prevId as string);
    } else if (currentIndex === 0 && onSelectProject && allProjects.length > 0) {
      const lastId = allProjects[allProjects.length - 1]._id || allProjects[allProjects.length - 1].id;
      if (lastId) onSelectProject(lastId as string);
    }
  };

  const handleNext = () => {
    if (currentIndex >= 0 && currentIndex < allProjects.length - 1 && onSelectProject && allProjects[currentIndex + 1]) {
      const nextId = allProjects[currentIndex + 1]._id || allProjects[currentIndex + 1].id;
      if (nextId) onSelectProject(nextId as string);
    } else if (currentIndex === allProjects.length - 1 && onSelectProject && allProjects.length > 0) {
      const firstId = allProjects[0]._id || allProjects[0].id;
      if (firstId) onSelectProject(firstId as string);
    }
  };

  // Handle escape key and left/right arrows
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.18, ease: [0.7, 0, 0.84, 0] } }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.18, ease: [0.7, 0, 0.84, 0] } }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full md:w-[95vw] h-full md:h-[95vh] bg-[#0a0a0a] md:rounded-xl overflow-hidden flex flex-col md:flex-row shadow-2xl border border-white/5"
          >
            {/* Close Button (Top Right) */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white/60 hover:text-white transition-colors backdrop-blur-md"
            >
              <X size={20} strokeWidth={1.5} />
            </button>

            {/* Left: Media Player (65%) */}
            <div className="w-full md:w-[65%] h-[35vh] md:h-full bg-black relative shrink-0">
              <div className="absolute inset-0">
                <FramesPlayer
                  key={project.videoUrl}
                  url={project.videoUrl}
                  thumbnail={project.thumbnailUrl}
                  aspectRatio="16:9"
                  controls={true}
                  autoplay={true}
                  muted={false}
                  loop={true}
                />
              </div>
            </div>

            {/* Right: Info Panel (35%) */}
            <div className="flex-1 h-full flex flex-col bg-[#050505] relative overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 md:p-10 scrollbar-hide">
                <span className="font-mono text-[10px] tracking-widest uppercase text-accent mb-4 block">
                  {project.contentType || 'Project'}
                </span>
                
                <h2 className="font-display font-bold uppercase tracking-tight text-3xl md:text-5xl text-white leading-none mb-8">
                  {project.title || 'Untitled'}
                </h2>
                
                {project.description && (
                  <p className="text-base text-white/70 font-light leading-relaxed mb-10">
                    {project.description}
                  </p>
                )}

                <div className="space-y-6 border-t border-white/10 pt-8 pb-20 md:pb-0">
                  {project.subjectMatter && (
                    <div>
                      <h4 className="font-mono text-[10px] tracking-widest uppercase text-white/40 mb-2">Subject</h4>
                      <p className="text-sm text-white/90">{project.subjectMatter}</p>
                    </div>
                  )}
                  
                  {project.aspectRatio && (
                    <div>
                      <h4 className="font-mono text-[10px] tracking-widest uppercase text-white/40 mb-2">Format</h4>
                      <p className="text-sm text-white/90">{project.aspectRatio}</p>
                    </div>
                  )}

                  {project.softwareUsed && project.softwareUsed.length > 0 && (
                    <div>
                      <h4 className="font-mono text-[10px] tracking-widest uppercase text-white/40 mb-2">Tools</h4>
                      <div className="flex flex-wrap gap-2">
                        {project.softwareUsed.map((tool: string) => (
                          <span key={tool} className="text-xs text-white/80 bg-white/5 px-2 py-1 rounded border border-white/10">{tool}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {project.aiToolsUsed && project.aiToolsUsed.length > 0 && (
                    <div>
                      <h4 className="font-mono text-[10px] tracking-widest uppercase text-white/40 mb-2">AI</h4>
                      <div className="flex flex-wrap gap-2">
                        {project.aiToolsUsed.map((tool: string) => (
                          <span key={tool} className="text-xs text-white/80 bg-white/5 px-2 py-1 rounded border border-white/10">{tool}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation Arrows */}
              {allProjects.length > 1 && (
                <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-[#050505] via-[#050505]/90 to-transparent flex items-end justify-between px-6 pb-6 pt-10 pointer-events-none">
                  <div className="pointer-events-auto flex items-center gap-2">
                    <button
                      onClick={handlePrev}
                      className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white/80 hover:text-white transition-colors"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={handleNext}
                      className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white/80 hover:text-white transition-colors"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                  <div className="font-mono text-[10px] tracking-widest text-white/40 pointer-events-auto">
                    {(currentIndex + 1).toString().padStart(2, '0')} / {allProjects.length.toString().padStart(2, '0')}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
