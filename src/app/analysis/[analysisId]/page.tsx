'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AnalysisLoadingState } from '@/components/AnalysisLoadingState';
import { AnalysisDashboard } from '@/components/AnalysisDashboard';
import type { AnalysisStatusResponse } from '@/types/api';

export default function AnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const analysisId = params.analysisId as string;

  const [status, setStatus] = useState<AnalysisStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(true);

  useEffect(() => {
    let pollInterval: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/analyses/${analysisId}/status`);

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/sign-in');
            return;
          }
          throw new Error('Failed to fetch analysis status');
        }

        const data: AnalysisStatusResponse = await response.json();
        setStatus(data);

        // Stop polling if completed or failed
        if (data.status === 'completed' || data.status === 'failed') {
          setIsPolling(false);
        }
      } catch (err) {
        console.error('Error fetching status:', err);
        setError('Failed to load analysis status');
        setIsPolling(false);
      }
    };

    // Initial check
    checkStatus();

    // Set up polling if still processing
    if (isPolling) {
      pollInterval = setInterval(checkStatus, 2000); // Poll every 2 seconds
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [analysisId, isPolling, router]);

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Show failed state
  if (status?.status === 'failed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-600 text-5xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Analysis Failed</h2>
          <p className="text-gray-600 mb-2">
            We encountered an error while processing your analysis.
          </p>
          {status.errorMessage && (
            <p className="text-sm text-gray-500 mb-6 bg-gray-50 p-3 rounded">
              {status.errorMessage}
            </p>
          )}
          <div className="space-x-3">
            <button
              onClick={() => router.push('/new-analysis')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while processing
  if (!status || status.status === 'processing') {
    return <AnalysisLoadingState stage={status?.aiProcessingStage} />;
  }

  // Show completed dashboard
  if (status.status === 'completed') {
    return <AnalysisDashboard analysisId={analysisId} />;
  }

  // Fallback loading
  return <AnalysisLoadingState stage={null} />;
}
