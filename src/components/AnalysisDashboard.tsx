'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/Tabs';
import { formatDateTime } from '@/lib/utils/formatting';
import { CompetitorCard } from './CompetitorCard';
import { FeatureMatrix } from './FeatureMatrix';
import { PositioningMap } from './PositioningMap';
import { ReviewCard } from './ReviewCard';
import { MVPRoadmap } from './MVPRoadmap';
import { DeficitCard } from './DeficitCard';
import { StandoutCard } from './StandoutCard';
import { BlueOceanCard } from './BlueOceanCard';
import { PersonaChat } from './PersonaChat';
import { ExportCenter } from './ExportCenter';
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
            <div className="space-y-8">
              {/* Section 1: Competitors */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4">Competitors ({competitors.length})</h2>
                {competitors.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {competitors.map((competitor) => (
                      <CompetitorCard
                        key={competitor.id}
                        name={competitor.name}
                        type={competitor.type}
                        description={competitor.description}
                        websiteUrl={competitor.websiteUrl}
                        marketPosition={competitor.marketPosition}
                        pricingModel={competitor.pricingModel}
                        foundedYear={competitor.foundedYear}
                        featureCount={competitor.features.length}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No competitors found</p>
                )}
              </div>

              {/* Section 2: Feature Matrix */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4">Feature Comparison Matrix</h2>
                <FeatureMatrix
                  userAppName={analysis.appName}
                  competitors={competitors}
                  parameters={data.comparisonParameters}
                  scores={data.featureMatrixScores}
                />
              </div>

              {/* Section 3: Positioning Map */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4">Competitive Positioning</h2>
                <p className="text-gray-600 mb-4">Value vs Complexity analysis</p>
                <PositioningMap
                  userAppName={analysis.appName}
                  positioningData={data.positioningData}
                />
              </div>

              {/* Section 4: Simulated Reviews */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4">
                  Simulated User Reviews ({data.simulatedReviews.length})
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  AI-generated reviews based on persona analysis
                </p>
                {data.simulatedReviews.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.simulatedReviews.map((review) => (
                      <ReviewCard
                        key={review.id}
                        reviewerName={review.reviewerName}
                        reviewerProfile={review.reviewerProfile}
                        rating={review.rating}
                        reviewText={review.reviewText}
                        sentiment={review.sentiment}
                        highlightedFeatures={review.highlightedFeatures as string[]}
                        painPointsAddressed={review.painPointsAddressed as string[]}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No reviews generated</p>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="gaps">
            <div className="space-y-8">
              {/* Section 1: MVP Roadmap */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-2">MVP Feature Roadmap</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Features prioritized based on competitive analysis and market opportunity
                </p>
                <MVPRoadmap features={data.userFeatures} />
              </div>

              {/* Section 2: Blue Ocean Opportunity */}
              {data.blueOceanInsight && (
                <BlueOceanCard
                  marketVacuumTitle={data.blueOceanInsight.marketVacuumTitle}
                  description={data.blueOceanInsight.description}
                  supportingEvidence={data.blueOceanInsight.supportingEvidence as string[]}
                  targetSegment={data.blueOceanInsight.targetSegment}
                  estimatedOpportunity={data.blueOceanInsight.estimatedOpportunity}
                  implementationDifficulty={data.blueOceanInsight.implementationDifficulty}
                  strategicRecommendation={data.blueOceanInsight.strategicRecommendation}
                />
              )}

              {/* Section 3: Competitive Deficits */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-2">
                  🔴 Competitive Deficits (
                  {gapAnalysisItems.filter((g) => g.type === 'deficit').length})
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Areas where competitors have advantages you should address
                </p>
                {gapAnalysisItems.filter((g) => g.type === 'deficit').length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {gapAnalysisItems
                      .filter((item) => item.type === 'deficit')
                      .sort((a, b) => {
                        const severityOrder: Record<string, number> = {
                          critical: 0,
                          high: 1,
                          medium: 2,
                          low: 3,
                        };
                        return (
                          (severityOrder[a.severity || 'low'] || 3) -
                          (severityOrder[b.severity || 'low'] || 3)
                        );
                      })
                      .map((deficit) => (
                        <DeficitCard
                          key={deficit.id}
                          title={deficit.title}
                          description={deficit.description}
                          severity={deficit.severity || 'low'}
                          affectedCompetitors={deficit.affectedCompetitors as string[]}
                          recommendation={deficit.recommendation}
                        />
                      ))}
                  </div>
                ) : (
                  <p className="text-gray-500">
                    No competitive deficits identified - you're well positioned!
                  </p>
                )}
              </div>

              {/* Section 4: Unique Standouts */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-2">
                  🟢 Unique Standouts (
                  {gapAnalysisItems.filter((g) => g.type === 'standout').length})
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Your competitive advantages and differentiation opportunities
                </p>
                {gapAnalysisItems.filter((g) => g.type === 'standout').length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {gapAnalysisItems
                      .filter((item) => item.type === 'standout')
                      .sort((a, b) => (b.opportunityScore || 0) - (a.opportunityScore || 0))
                      .map((standout) => (
                        <StandoutCard
                          key={standout.id}
                          title={standout.title}
                          description={standout.description}
                          opportunityScore={standout.opportunityScore || 0}
                          recommendation={standout.recommendation}
                        />
                      ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No unique standouts identified</p>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="personas">
            <PersonaChat analysisId={analysisId} personas={data.personas} />
          </TabsContent>

          <TabsContent value="export">
            <div className="bg-white rounded-lg shadow-md p-6">
              <ExportCenter analysisId={analysisId} analysisName={analysis.appName} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
