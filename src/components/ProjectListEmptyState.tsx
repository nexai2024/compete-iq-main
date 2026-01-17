'use client';

import Link from 'next/link';
import { FolderPlus, FileText } from 'lucide-react';
import { Button } from './ui/Button';

export const ProjectListEmptyState = () => (
  <div className="text-center bg-gray-50 rounded-lg p-8">
    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-200">
      <FileText className="h-6 w-6 text-gray-600" />
    </div>
    <h3 className="mt-4 text-lg font-semibold text-gray-900">No Projects Found</h3>
    <p className="mt-2 text-sm text-gray-500">
      It looks like you haven&apos;t created any projects yet.
    </p>
    <div className="mt-6">
      <Button asChild>
        <Link href="/new-analysis">
          <FolderPlus className="mr-2 h-4 w-4" />
          Start New Analysis
        </Link>
      </Button>
    </div>
  </div>
);
