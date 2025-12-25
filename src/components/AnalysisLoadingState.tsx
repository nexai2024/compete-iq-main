'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface AnalysisLoadingStateProps {
  stage?: string | null;
}

const stageLabels: Record<string, string> = {
  competitors: 'Identifying competitors...',
  competitors_complete: 'Competitors identified',
  features: 'Analyzing features...',
  matrix_complete: 'Feature matrix complete',
  gaps: 'Analyzing competitive gaps...',
  gaps_complete: 'Gap analysis complete',
  mvp: 'Prioritizing features for MVP...',
  mvp_complete: 'MVP roadmap ready',
  personas: 'Generating user personas...',
  personas_complete: 'Personas created',
  positioning: 'Creating positioning map...',
  positioning_complete: 'Positioning complete',
  finalizing: 'Finalizing report...',
  complete: 'Analysis complete!',
};

export const AnalysisLoadingState: React.FC<AnalysisLoadingStateProps> = ({ stage }) => {
  const getStageLabel = (stage: string | null | undefined): string => {
    if (!stage) return 'Starting analysis...';

    // Handle progress stages like "matrix_progress_30/70"
    if (stage.startsWith('matrix_progress_')) {
      const match = stage.match(/(\d+)\/(\d+)/);
      if (match) {
        return `Scoring features: ${match[1]} of ${match[2]} complete...`;
      }
    }

    return stageLabels[stage] || 'Processing...';
  };

  const getProgress = (stage: string | null | undefined): number => {
    if (!stage) return 0;

    const stageProgress: Record<string, number> = {
      competitors: 10,
      competitors_complete: 20,
      features: 25,
      matrix_complete: 45,
      gaps: 50,
      gaps_complete: 60,
      mvp: 65,
      mvp_complete: 70,
      personas: 75,
      personas_complete: 85,
      positioning: 88,
      positioning_complete: 95,
      finalizing: 98,
      complete: 100,
    };

    // Handle matrix progress
    if (stage.startsWith('matrix_progress_')) {
      const match = stage.match(/(\d+)\/(\d+)/);
      if (match) {
        const current = parseInt(match[1]);
        const total = parseInt(match[2]);
        return 25 + (current / total) * 20; // 25-45%
      }
    }

    return stageProgress[stage] || 5;
  };

  const progress = getProgress(stage);
  const stageLabel = getStageLabel(stage);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Analyzing Your App
          </h2>

          <p className="text-gray-600 mb-6">
            {stageLabel}
          </p>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="text-sm text-gray-500 mb-8">
            {progress}% complete
          </p>

          {/* Info */}
          <div className="text-left bg-blue-50 rounded-lg p-4 text-sm text-gray-700">
            <p className="font-medium mb-2">What's happening:</p>
            <ul className="space-y-1 text-gray-600">
              <li>🔍 Searching for competitors using AI</li>
              <li>📊 Analyzing features and generating comparison matrix</li>
              <li>💡 Identifying gaps and opportunities</li>
              <li>👥 Creating user personas for testing</li>
              <li>🗺️ Mapping competitive positioning</li>
            </ul>
          </div>

          <p className="mt-6 text-xs text-gray-500">
            This usually takes 2-3 minutes. Please don't close this page.
          </p>
        </div>
      </div>
    </div>
  );
};
