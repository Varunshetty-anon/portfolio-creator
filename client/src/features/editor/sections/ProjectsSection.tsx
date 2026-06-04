import React, { useState } from 'react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { Plus, GripVertical, Film } from 'lucide-react';
import type { PortfolioData, Project } from '@/types';
import { INITIAL_PROJECT } from '@/types';
import { Button } from '@/components/ui/Button';
import { Panel, PanelSection } from '@/components/ui/EditorPanels';
import ProjectCardEditor from './ProjectCardEditor';

interface ProjectsSectionProps {
  data: PortfolioData;
  onChange: (data: PortfolioData) => void;
  onAutoSave: () => void;
  projects: Project[];
  onChangeProjects: (projects: Project[]) => void;
}

export default function ProjectsSection({ data, onChange, onAutoSave, projects, onChangeProjects }: ProjectsSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleAddProject = () => {
    const newId = `temp_${Date.now()}`;
    const newProject: Project = {
      ...INITIAL_PROJECT,
      _id: newId,
      id: newId,
      title: 'New Project',
      order: projects.length,
    };
    
    onChangeProjects([newProject, ...projects]);
    setExpandedId(newProject._id!);
    onAutoSave();
  };

  const handleUpdateProject = (updatedProject: Project) => {
    onChangeProjects(projects.map(p => p._id === updatedProject._id ? updatedProject : p));
    onAutoSave();
  };

  const handleDeleteProject = (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      onChangeProjects(projects.filter(p => p._id !== projectId));
      if (expandedId === projectId) setExpandedId(null);
      onAutoSave();
    }
  };

  const handleReorder = (reorderedProjects: Project[]) => {
    const updated = reorderedProjects.map((p, index) => ({ ...p, order: index }));
    onChangeProjects(updated);
    onAutoSave();
  };

  return (
    <Panel>
      <PanelSection 
        title="Portfolio Works" 
        description="Manage and order your showcased projects."
        headerAction={
          <Button size="sm" onClick={handleAddProject} variant="secondary">
            <Plus size={14} className="mr-1.5" />
            Add
          </Button>
        }
      >
        {projects.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center border border-dashed border-border-strong rounded-xl bg-bg-raised">
            <div className="w-12 h-12 rounded-full bg-bg-base flex items-center justify-center mb-3">
              <Film size={20} className="text-text-muted" />
            </div>
            <h3 className="text-sm font-medium text-text-primary mb-1">No projects yet</h3>
            <p className="text-xs text-text-muted max-w-[200px] mb-4">
              Add your first project to start building your portfolio grid.
            </p>
            <Button size="sm" onClick={handleAddProject} variant="primary">
              Create Project
            </Button>
          </div>
        ) : (
          <Reorder.Group 
            axis="y" 
            values={projects} 
            onReorder={handleReorder}
            className="space-y-3"
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
        )}
      </PanelSection>
    </Panel>
  );
}
