// ========================
// FRAMES ProjectGrid Component
// ========================
// Masonry layout grid for portfolio projects with hover states.

import React from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import type { Project } from '@/types';
import { PROJECT_CONTENT_TYPES } from '@/lib/constants';

interface ProjectGridProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
}

export const ProjectGrid: React.FC<ProjectGridProps> = ({ projects, onProjectClick }) => {
  if (!projects || projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="w-16 h-16 rounded-full bg-bg-raised flex items-center justify-center mb-4">
          <Play size={24} className="text-text-muted" />
        </div>
        <h3 className="text-xl font-display font-medium text-text-primary mb-2">No projects yet</h3>
        <p className="text-text-muted text-sm max-w-md">
          This portfolio is currently empty.
        </p>
      </div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.3 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8"
    >
      {projects.map((project) => {
        // Determine aspect ratio class
        const aspectClass = 
          project.aspectRatio === '9:16' ? 'aspect-[9/16]' :
          project.aspectRatio === '4:3' ? 'aspect-[4/3]' :
          project.aspectRatio === '1:1' ? 'aspect-square' :
          'aspect-video'; // Default 16:9

        const typeLabel = PROJECT_CONTENT_TYPES.find(t => t.id === project.contentType)?.label || project.contentType;

        return (
          <motion.div
            key={project._id || project.id}
            variants={item}
            className={`group relative rounded-2xl overflow-hidden bg-bg-base border border-border shadow-cinematic cursor-pointer ${
              project.aspectRatio === '9:16' ? 'md:row-span-2' : ''
            }`}
            onClick={() => onProjectClick(project)}
            whileHover={{ y: -8, scale: 1.02 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Thumbnail */}
            <div className={`w-full ${aspectClass} overflow-hidden`}>
              {project.thumbnailUrl ? (
                <img
                  src={project.thumbnailUrl}
                  alt={project.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-bg-raised">
                  <Play size={32} className="text-text-muted" />
                </div>
              )}
            </div>

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
              
              <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/10 px-2 py-1 rounded backdrop-blur-md">
                    {typeLabel}
                  </span>
                  {project.videoUrl && (
                    <span className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                      <Play size={10} className="text-white ml-0.5" />
                    </span>
                  )}
                </div>
                
                <h3 className="text-2xl font-display font-bold text-white mb-2 line-clamp-2 tracking-tight">
                  {project.title}
                </h3>
                
                {project.softwareUsed && project.softwareUsed.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {project.softwareUsed.slice(0, 3).map(tool => (
                      <span key={tool} className="text-[10px] text-text-secondary font-medium bg-white/10 px-2 py-1 rounded backdrop-blur-md">
                        {tool}
                      </span>
                    ))}
                    {project.softwareUsed.length > 3 && (
                      <span className="text-[10px] text-text-muted font-medium bg-white/5 px-2 py-1 rounded backdrop-blur-md">
                        +{project.softwareUsed.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};
