import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus, Film } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
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
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
    if (deletingId === projectId) {
      onChangeProjects(projects.filter(p => p._id !== projectId));
      if (expandedId === projectId) setExpandedId(null);
      setDeletingId(null);
      onAutoSave();
    } else {
      setDeletingId(projectId);
      setTimeout(() => {
        setDeletingId(null);
      }, 3000);
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = projects.findIndex((p) => (p._id || p.id) === active.id);
      const newIndex = projects.findIndex((p) => (p._id || p.id) === over.id);

      const reordered = arrayMove(projects, oldIndex, newIndex);
      const updated = reordered.map((p, index) => ({ ...p, order: index }));
      onChangeProjects(updated);
      onAutoSave();
    }
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
          <div className="py-12 flex flex-col items-center justify-center text-center rounded-xl bg-bg-base/50 border border-border/50 shadow-inner">
            <div className="w-12 h-12 rounded-full bg-bg-floating border border-border-strong flex items-center justify-center mb-4 shadow-sm">
              <Film size={18} className="text-text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-text-primary mb-1">Your Portfolio Canvas</h3>
            <p className="text-xs text-text-muted max-w-[220px] mb-6 leading-relaxed">
              Curate your best work. Upload video files or link directly from YouTube and Vimeo.
            </p>
            <Button size="sm" onClick={handleAddProject} variant="primary" className="rounded-full px-6 shadow-md shadow-accent/20">
              <Plus size={14} className="mr-1.5" /> New Project
            </Button>
          </div>
        ) : (
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={projects.map(p => p._id || p.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {projects.map((project, index) => (
                    <ProjectCardEditor
                      key={project._id || project.id}
                      project={project}
                      index={index}
                      isExpanded={expandedId === (project._id || project.id)}
                      isDeleting={deletingId === (project._id || project.id)}
                      onToggleExpand={() => setExpandedId(expandedId === (project._id || project.id) ? null : project._id!)}
                      onChange={handleUpdateProject}
                      onDelete={() => handleDeleteProject(project._id || project.id)}
                      onAutoSave={onAutoSave}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </SortableContext>
          </DndContext>
        )}
      </PanelSection>
    </Panel>
  );
}
