'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';

type ProjectItem = { id: string; name?: string; updatedAt: string };

// Props for the memoized list item
type ProjectListItemProps = {
  project: ProjectItem;
  onDelete: (project: ProjectItem) => void;
};

// Memoized ProjectListItem to prevent re-renders of the entire list
const ProjectListItem = React.memo<ProjectListItemProps>(({ project, onDelete }) => {
  // By memoizing the list item, we prevent it from re-rendering
  // when the parent's state changes (e.g., when the delete dialog opens).
  // The onClick handler calls the onDelete prop, which is a stable function
  // passed down from the parent.
  return (
    <li className="flex justify-between items-center group">
      <Link
        href={`/new-analysis?projectId=${project.id}`}
        className="text-blue-600 hover:underline flex-1"
      >
        {project.name || 'Untitled'}
      </Link>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">{new Date(project.updatedAt).toLocaleString()}</span>
        <button
          onClick={() => onDelete(project)}
          className="p-1 text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
          aria-label="Delete project"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </li>
  );
});
ProjectListItem.displayName = 'ProjectListItem';

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

  const handleDeleteClick = useCallback((project: ProjectItem) => {
    setDeleteDialog({ open: true, project });
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDeleteDialog({ open: false, project: null });
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
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
  }, [deleteDialog.project]);

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
          onClose={handleCloseDialog}
          onConfirm={handleDeleteConfirm}
          itemName={deleteDialog.project.name || 'Untitled'}
          itemType="project"
          isLoading={isDeleting}
        />
      )}
    </>
  );
};
