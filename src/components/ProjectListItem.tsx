'use client';

import React from 'react';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';

// Using a type alias for the project object for clarity and reusability.
type Project = {
  id: string;
  name?: string;
  updatedAt: string;
};

// Defining the props interface for the component for strong typing.
interface ProjectListItemProps {
  project: Project;
  onDelete: (project: Project) => void;
}

/**
 * A memoized list item component for displaying a project.
 * React.memo is a performance optimization that prevents a component from
 * re-rendering if its props have not changed. This is particularly useful
 * in lists where a parent component's re-render might otherwise cause
 * every item in the list to re-render, even those that haven't changed.
 */
export const ProjectListItem: React.FC<ProjectListItemProps> = React.memo(({ project, onDelete }) => {
  /**
   * Performance Insight:
   * By passing a stable function reference (created with useCallback in the parent)
   * to this component, we ensure that this onClick handler doesn't cause a re-render.
   * If an inline function like `() => onDelete(project)` were used here, a new
   * function would be created on every render, breaking the memoization.
   */
  const handleDelete = () => {
    onDelete(project);
  };

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
          onClick={handleDelete}
          className="p-1 text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
          aria-label="Delete project"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </li>
  );
});

// Setting a display name for the component is a good practice for debugging.
ProjectListItem.displayName = 'ProjectListItem';
