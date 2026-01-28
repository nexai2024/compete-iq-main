'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { AnalysisCard } from '@/components/AnalysisCard';
import type { AnalysisListItem, AnalysisListResponse } from '@/types/api';

// Dynamically import ProjectList to lazy-load it, improving initial page load performance.
// The component and its data fetching are deferred until the main content is rendered.
const ProjectListLoader = () => (
  <div className="mt-8">
    <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  </div>
);

const ProjectList = dynamic(
  () => import('@/components/ProjectList').then((mod) => mod.ProjectList),
  {
    loading: () => <ProjectListLoader />,
    ssr: false, // This component is client-side only
  }
);

export default function DashboardPage() {
  const [analyses, setAnalyses] = useState<AnalysisListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  // Fetch analyses
  useEffect(() => {
    const fetchAnalyses = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const queryParams = new URLSearchParams();
        if (statusFilter !== 'all') {
          queryParams.append('status', statusFilter);
        }
        queryParams.append('sortBy', sortBy);

        const response = await fetch(`/api/analyses?${queryParams.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch analyses');
        }

        const data: AnalysisListResponse = await response.json();
        setAnalyses(data.analyses);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analyses');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalyses();
  }, [statusFilter, sortBy]);

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Analyses</h1>
            <p className="text-gray-600 mt-2">Manage and review your market analyses</p>
          </div>
          <Link
            href="/new-analysis"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Analysis
          </Link>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-600">Loading your analyses...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="max-w-md mx-auto">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={handleRetry}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                Try Again
              </button>
              <div className="mt-4">
                <Link
                  href="/new-analysis"
                  className="text-blue-600 hover:text-blue-700"
                >
                  Or create a new analysis
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && analyses.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="text-6xl mb-4">📊</div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                No analyses yet
              </h2>
              <p className="text-gray-600 mb-6">
                Create your first market analysis to get AI-powered insights about your app idea
              </p>
              <Link
                href="/new-analysis"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Analysis
              </Link>
            </div>
          </div>
        )}

        {/* Analysis List with Filters */}
        {!isLoading && !error && analyses.length > 0 && (
          <>
            {/* Filter/Sort Controls */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Status Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Filter:</span>
                  <div className="flex gap-2">
                    {['all', 'completed', 'processing', 'failed'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                          statusFilter === status
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Analysis Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {analyses.map((analysis) => (
                <AnalysisCard
                  key={analysis.id}
                  {...analysis}
                  onDelete={() => {
                    // Remove from local state and refetch
                    setAnalyses((prev) => prev.filter((a) => a.id !== analysis.id));
                  }}
                />
              ))}
            </div>
          </>
        )}

        {/* Info Cards - Only show when no analyses */}
        {!isLoading && analyses.length === 0 && (
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Quick Analysis</h3>
              <p className="text-sm text-gray-600">
                Get comprehensive market insights in 2-3 minutes
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">AI-Powered</h3>
              <p className="text-sm text-gray-600">
                Uses GPT-4 and Perplexity for accurate competitor research
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Export Ready</h3>
              <p className="text-sm text-gray-600">
                Download reports as PDF or Markdown for your team
              </p>
            </div>
          </div>
        )}

        {/* Saved Projects */}
        <div className="mt-8">
          <ProjectList />
        </div>
      </div>
    </div>
  );
}
