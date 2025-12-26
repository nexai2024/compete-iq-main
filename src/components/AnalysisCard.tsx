'use client';

import Link from 'next/link';
import { formatDateTime } from '@/lib/utils/formatting';

interface AnalysisCardProps {
  id: string;
  appName: string;
  targetAudience: string;
  status: 'completed' | 'processing' | 'failed';
  createdAt: string;
  competitorCount: number;
  errorMessage?: string | null;
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

export function AnalysisCard({
  id,
  appName,
  targetAudience,
  status,
  createdAt,
  competitorCount,
  errorMessage,
}: AnalysisCardProps) {
  const statusStyle = statusStyles[status];

  return (
    <Link href={`/analysis/${id}`}>
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.01]">
        {/* Top row: App name + Status badge */}
        <div className="flex items-start justify-between mb-3">
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
      </div>
    </Link>
  );
}
