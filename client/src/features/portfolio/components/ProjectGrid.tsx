import React from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import type { Project } from '@/types';

interface ProjectGridProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
}

export const ProjectGrid: React.FC<ProjectGridProps> = ({ projects, onProjectClick }) => {
  if (!projects?.length) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
      {projects.map((project, index) => {
        // Determine grid span based on intentional hierarchy pattern
        let colSpan = "md:col-span-12"; // Default
        let aspectClass = "aspect-video"; // 16:9 default
        let isFeatured = false;

        if (index === 0) {
          colSpan = "md:col-span-12";
          isFeatured = true;
        } else if (index === 1 || index === 2) {
          colSpan = "md:col-span-6";
        } else if (index === 3) {
          colSpan = "md:col-span-12";
          isFeatured = true;
        } else {
          // 4+ goes into a 3 column grid if space allows, or 2 col
          colSpan = "md:col-span-6 lg:col-span-4";
        }

        // Apply native aspect ratio class if not featured (featured always 16:9 for consistency)
        if (!isFeatured) {
          if (project.aspectRatio === '9:16') aspectClass = "aspect-[9/16]";
          else if (project.aspectRatio === '4:3') aspectClass = "aspect-[4/3]";
          else if (project.aspectRatio === '1:1') aspectClass = "aspect-square";
        }

        return (
          <motion.div
            key={project._id || index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: (index % 3) * 0.1, ease: [0.16, 1, 0.3, 1] }}
            className={`${colSpan}`}
          >
            <div 
              className="group cursor-pointer block relative w-full h-full transform transition-all duration-400 ease-out hover:-translate-y-1 hover:shadow-2xl bg-bg-raised border border-border"
              onClick={() => onProjectClick(project)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if(e.key === 'Enter') onProjectClick(project); }}
            >
              {/* Media Container (NO border radius) */}
              <div className={`relative w-full overflow-hidden ${aspectClass} bg-bg-raised`}>
                
                {/* Thumbnail */}
                {project.thumbnailUrl ? (
                  <img 
                    src={project.thumbnailUrl} 
                    alt={project.title} 
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    loading={index < 2 ? "eager" : "lazy"}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-bg-floating text-text-muted">
                    No Media
                  </div>
                )}

                {/* Play Badge */}
                {project.videoUrl && (
                  <div className="absolute top-4 right-4 z-20 w-10 h-10 bg-black/40 backdrop-blur-md flex items-center justify-center text-white opacity-60 group-hover:opacity-100 transition-opacity">
                    <Play size={16} className="fill-current ml-0.5" />
                  </div>
                )}

                {/* Hover Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />

                {/* Info Container (Always visible on featured, hover only on smaller cards) */}
                <div className={`absolute bottom-0 left-0 w-full p-6 z-20 flex flex-col justify-end
                  ${isFeatured ? 'opacity-100' : 'opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0'} 
                  transition-all duration-300 ease-out
                `}>
                  {/* For featured cards that don't rely on hover, add a subtle gradient behind text */}
                  {isFeatured && (
                     <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent -z-10" />
                  )}
                  
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <h3 className={`font-display font-bold text-white tracking-tight ${isFeatured ? 'text-3xl sm:text-4xl' : 'text-xl sm:text-2xl'} mb-2`}>
                        {project.title || 'Untitled'}
                      </h3>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 items-center">
                        <span className="text-[11px] font-display uppercase tracking-[0.2em] text-accent">
                          {project.contentType || 'Project'}
                        </span>
                        {project.subjectMatter && (
                          <>
                            <span className="text-white/30">•</span>
                            <span className="text-[11px] font-display uppercase tracking-[0.2em] text-white/70">
                              {project.subjectMatter}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
