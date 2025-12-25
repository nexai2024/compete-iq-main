'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/Tabs';
import { formatDateTime } from '@/lib/utils/formatting';
import type { FullAnalysisResponse } from '@/types/api';

interface AnalysisDashboardProps {
  analysisId: string;
}

export const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ analysisId }) => {
  const [data, setData] = useState<FullAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const response = await fetch(`/api/analyses/${analysisId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch analysis data');
        }

        const analysisData: FullAnalysisResponse = await response.json();
        setData(analysisData);
      } catch (err) {
        console.error('Error fetching analysis:', err);
        setError('Failed to load analysis data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalysis();
  }, [analysisId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Failed to load analysis'}</p>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { analysis, competitors, gapAnalysisItems, personas } = data;

  const deficitsCount = gapAnalysisItems.filter((g) => g.type === 'deficit').length;
  const standoutsCount = gapAnalysisItems.filter((g) => g.type === 'standout').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{analysis.appName}</h1>
            <p className="text-gray-600 mb-4">
              <span className="font-medium">Target Audience:</span> {analysis.targetAudience}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Analyzed: {formatDateTime(analysis.createdAt)}
            </p>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-3">
              <div className="bg-blue-50 px-3 py-1 rounded-full text-sm">
                <span className="font-medium">{competitors.length}</span> Competitors
              </div>
              <div className="bg-green-50 px-3 py-1 rounded-full text-sm">
                <span className="font-medium">{data.userFeatures.length}</span> Features
              </div>
              <div className="bg-orange-50 px-3 py-1 rounded-full text-sm">
                <span className="font-medium">{deficitsCount}</span> Deficits
              </div>
              <div className="bg-purple-50 px-3 py-1 rounded-full text-sm">
                <span className="font-medium">{standoutsCount}</span> Standouts
              </div>
              <div className="bg-pink-50 px-3 py-1 rounded-full text-sm">
                <span className="font-medium">{personas.length}</span> Personas
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <div className="bg-white rounded-lg shadow-md">
            <TabsList className="px-6">
              <TabsTrigger value="overview">Market Overview</TabsTrigger>
              <TabsTrigger value="gaps">Strategic Gaps</TabsTrigger>
              <TabsTrigger value="personas">Persona Feedback</TabsTrigger>
              <TabsTrigger value="export">Export Center</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Market Overview</h2>
              <p className="text-gray-600">
                Comprehensive view of your competitive landscape - coming soon!
              </p>
              <div className="mt-4 text-sm text-gray-500">
                <p>This tab will include:</p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>Competitor cards with detailed information</li>
                  <li>Feature comparison matrix</li>
                  <li>Positioning map (Value vs Complexity)</li>
                  <li>Simulated user reviews</li>
                </ul>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="gaps">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Strategic Gaps</h2>
              <p className="text-gray-600">
                MVP roadmap, deficits, standouts, and Blue Ocean opportunity - coming soon!
              </p>
              <div className="mt-4 text-sm text-gray-500">
                <p>This tab will include:</p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>Feature priorities (P0/P1/P2)</li>
                  <li>Competitive deficits you need to address</li>
                  <li>Your unique standouts</li>
                  <li>Blue Ocean opportunity analysis</li>
                </ul>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="personas">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Persona Feedback</h2>
              <p className="text-gray-600">
                Interactive chat with AI personas - coming soon!
              </p>
              <div className="mt-4 text-sm text-gray-500">
                <p>This tab will include:</p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>3 AI personas: Price-Sensitive, Power User, Corporate Buyer</li>
                  <li>Real-time chat interface</li>
                  <li>Persona profiles with pain points and priorities</li>
                  <li>Chat history persistence</li>
                </ul>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="export">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Export Center</h2>
              <p className="text-gray-600">
                Download your analysis as PDF or Markdown - coming soon!
              </p>
              <div className="mt-4 text-sm text-gray-500">
                <p>This tab will include:</p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>PDF export with charts and visualizations</li>
                  <li>Markdown export for easy editing</li>
                  <li>Shareable link option</li>
                  <li>Analysis metadata</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
