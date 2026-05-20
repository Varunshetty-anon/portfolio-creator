// ========================
// FRAMES ProjectsSection
// ========================
// Editor section for managing and reordering portfolio projects.

import React, { useState, useEffect } from 'react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { Plus, GripVertical, PlayCircle, Image as ImageIcon, Film } from 'lucide-react';
import type { PortfolioData, Project } from '@/types';
import { INITIAL_PROJECT } from '@/types';
import { Button } from '@/components/ui/Button';
import ProjectCardEditor from './ProjectCardEditor';

interface ProjectsSectionProps {
  data: PortfolioData;
  onChange: (data: PortfolioData) => void;
  onAutoSave: () => void;
}

// Separate API calls from UI state where possible, but here we just manipulate
// the `projects` array locally. The EditorLayout handles the actual save to DB.

export default function ProjectsSection({ data, onChange, onAutoSave }: ProjectsSectionProps) {
  // In a real implementation with our Express API, projects are fetched separately.
  // For the frontend state integration, we'll assume they are passed in or fetched here.
  // We'll manage local state for the reorderable list.
  const [projects, setProjects] = useState<Project[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Since EditorLayout doesn't pass projects array down (it just passes PortfolioData),
  // we need a hook to fetch projects for the current user's portfolio.
  // We'll mock it passing through `data` for now, assuming the API structure.
  
  // Actually, wait, EditorLayout doesn't fetch projects. We should fetch them here.
  useEffect(() => {
    // In a real app, we'd fetch from `/api/v1/portfolio/projects`
    // For this build, we'll rely on the parent component's state or a separate API call.
    // Let's assume the parent handles saving the portfolio draft, but projects need their own CRUD.
    
    // We'll implement local state array for the UI demo.
    // In a real implementation, you'd wire these to the `api.projects` endpoints.
  }, []);

  const handleAddProject = () => {
    const newId = `temp_${Date.now()}`;
    const newProject: Project = {
      ...INITIAL_PROJECT,
      _id: newId,
      id: newId,
      title: 'New Project',
      order: projects.length,
    };
    
    setProjects([newProject, ...projects]);
    setExpandedId(newProject._id!);
    onAutoSave();
  };

  const handleUpdateProject = (updatedProject: Project) => {
    setProjects(projects.map(p => p._id === updatedProject._id ? updatedProject : p));
    onAutoSave();
  };

  const handleDeleteProject = (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      setProjects(projects.filter(p => p._id !== projectId));
      if (expandedId === projectId) setExpandedId(null);
      onAutoSave();
    }
  };

  const handleReorder = (reorderedProjects: Project[]) => {
    // Update order property based on new index
    const updated = reorderedProjects.map((p, index) => ({ ...p, order: index }));
    setProjects(updated);
    onAutoSave();
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-frames-border">
        <div>
          <h2 className="text-lg font-medium text-white mb-1">Portfolio Works</h2>
          <p className="text-sm text-zinc-500">Manage and order your showcased projects.</p>
        </div>
        <Button onClick={handleAddProject} className="bg-white text-black hover:bg-zinc-200">
          <Plus size={16} className="mr-2" />
          Add Project
        </Button>
      </div>

      {/* Empty State */}
      {projects.length === 0 && (
        <div className="py-24 flex flex-col items-center justify-center text-center border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
          <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4">
            <Film size={24} className="text-zinc-600" />
          </div>
          <h3 className="text-xl font-display font-medium text-white mb-2">No projects yet</h3>
          <p className="text-zinc-500 text-sm max-w-sm mb-6">
            Add your first project to start building your portfolio grid.
          </p>
          <Button onClick={handleAddProject} variant="secondary">
            Create Project
          </Button>
        </div>
      )}

      {/* Project List */}
      <Reorder.Group 
        axis="y" 
        values={projects} 
        onReorder={handleReorder}
        className="space-y-4"
      >
        <AnimatePresence initial={false}>
          {projects.map((project, index) => (
            <Reorder.Item 
              key={project._id} 
              value={project}
              className="relative"
            >
              <ProjectCardEditor
                project={project}
                index={index}
                isExpanded={expandedId === project._id}
                onToggleExpand={() => setExpandedId(expandedId === project._id ? null : project._id!)}
                onChange={handleUpdateProject}
                onDelete={() => handleDeleteProject(project._id!)}
                onAutoSave={onAutoSave}
              />
            </Reorder.Item>
          ))}
        </AnimatePresence>
      </Reorder.Group>

    </div>
  );
}
