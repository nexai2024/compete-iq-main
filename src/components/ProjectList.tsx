'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';
import { ProjectListItem } from './ProjectListItem';

// Moved type definition outside the component to prevent re-declaration on each render.
type ProjectItem = { id: string; name?: string; updatedAt: string };

export const ProjectList: React.FC = () => {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; project: ProjectItem | null }>({
    open: false,
    project: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      if (!res.ok) return;
      const json = await res.json();
      setProjects(json.projects || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  /**
   * Performance Insight:
   * By wrapping this handler in `useCallback`, we create a stable function reference
   * that won't change on re-renders. This allows the memoized `ProjectListItem`
   * components to correctly skip re-rendering, as their `onDelete` prop is now stable.
   */
  const handleDeleteClick = useCallback((project: ProjectItem) => {
    setDeleteDialog({ open: true, project });
  }, []);

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.project) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/projects/${deleteDialog.project.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      // Remove from local state
      setProjects((prev) => prev.filter((p) => p.id !== deleteDialog.project!.id));
      setDeleteDialog({ open: false, project: null });
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!projects.length) return null;

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-3">Saved Projects</h3>
        <ul className="space-y-2">
          {projects.map((p) => (
            <ProjectListItem key={p.id} project={p} onDelete={handleDeleteClick} />
          ))}
        </ul>
      </div>

      {deleteDialog.project && (
        <DeleteConfirmationDialog
          open={deleteDialog.open}
          onClose={() => setDeleteDialog({ open: false, project: null })}
          onConfirm={handleDeleteConfirm}
          itemName={deleteDialog.project.name || 'Untitled'}
          itemType="project"
          isLoading={isDeleting}
        />
      )}
    </>
  );
};
