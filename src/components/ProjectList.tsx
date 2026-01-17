'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';
import { ProjectListEmptyState } from './ProjectListEmptyState';

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

  const handleDeleteClick = (project: ProjectItem) => {
    setDeleteDialog({ open: true, project });
  };

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

  if (!projects.length) {
    return <ProjectListEmptyState />;
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-3">Saved Projects</h3>
        <ul className="space-y-2">
          {projects.map((p) => (
            <li key={p.id} className="flex justify-between items-center group">
              <Link
                href={`/new-analysis?projectId=${p.id}`}
                className="text-blue-600 hover:underline flex-1"
              >
                {p.name || 'Untitled'}
              </Link>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">{new Date(p.updatedAt).toLocaleString()}</span>
                <button
                  onClick={() => handleDeleteClick(p)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                  aria-label="Delete project"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </li>
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
