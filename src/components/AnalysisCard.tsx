'use client';

import { memo, useState } from 'react';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { formatDateTime } from '@/lib/utils/formatting';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';

interface AnalysisCardProps {
  id: string;
  appName: string;
  targetAudience: string;
  status: 'completed' | 'processing' | 'failed';
  createdAt: string;
  competitorCount: number;
  errorMessage?: string | null;
  onDelete?: (id: string) => void;
}

const statusStyles = {
  completed: {
    bg: 'bg-[#10b981]',
    text: 'text-white',
    label: 'Completed',
  },
  processing: {
    bg: 'bg-[#3b82f6]',
    text: 'text-white',
    label: 'Processing...',
  },
  failed: {
    bg: 'bg-[#ef4444]',
    text: 'text-white',
    label: 'Failed',
  },
};

export const AnalysisCard = memo(function AnalysisCard({
  id,
  appName,
  targetAudience,
  status,
  createdAt,
  competitorCount,
  errorMessage,
  onDelete,
}: AnalysisCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const statusStyle = statusStyles[status];

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/analyses/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete analysis');
      }

      // Call the onDelete callback to update the parent component
      if (onDelete) {
        onDelete(id);
      }
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Error deleting analysis:', error);
      alert('Failed to delete analysis. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 transition-all duration-200 hover:shadow-lg hover:scale-[1.01] relative">
        {/* Delete button */}
        <button
          onClick={handleDeleteClick}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-600 transition-colors"
          aria-label="Delete analysis"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <Link href={`/analysis/${id}`} className="block">
          {/* Top row: App name + Status badge */}
          <div className="flex items-start justify-between mb-3 pr-8">
            <h3 className="text-lg font-bold text-gray-900 flex-1 mr-3">{appName}</h3>
            <span
              className={`${statusStyle.bg} ${statusStyle.text} px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap`}
            >
              {statusStyle.label}
            </span>
          </div>

          {/* Second row: Target audience */}
          <p className="text-sm text-gray-600 mb-3">{targetAudience}</p>

          {/* Third row: Created date + Competitor count */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{formatDateTime(createdAt)}</span>
            <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium">
              {competitorCount} {competitorCount === 1 ? 'competitor' : 'competitors'}
            </span>
          </div>

          {/* Error message if failed */}
          {status === 'failed' && errorMessage && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-sm text-red-600">{errorMessage}</p>
            </div>
          )}
        </Link>
      </div>

      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        itemName={appName}
        itemType="analysis"
        isLoading={isDeleting}
      />
    </>
  );
});
