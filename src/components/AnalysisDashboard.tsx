'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Trash2, RefreshCw } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/Tabs';
import { Button } from './ui/Button';
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
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';
import { MarketIntelligenceComponent } from './MarketIntelligence';
import { PricingComparison } from './PricingComparison';
import type { FullAnalysisResponse } from '@/types/api';
import type { PositioningData } from '@/types/database';

interface AnalysisDashboardProps {
  analysisId: string;
}

export const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ analysisId }) => {
  const router = useRouter();
  const [data, setData] = useState<FullAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRerunning, setIsRerunning] = useState(false);
  const [showRerunDialog, setShowRerunDialog] = useState(false);

  // Memoize calculations here, before any conditional returns, to follow the Rules of Hooks.
  // We provide a default empty array for gapAnalysisItems to prevent errors when `data` is null.
  const gapAnalysisItems = useMemo(() => data?.gapAnalysisItems ?? [], [data]);

  const deficits = useMemo(() => {
    const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    return gapAnalysisItems
      .filter((item) => item.type === 'deficit')
      .sort((a, b) => (severityOrder[a.severity || 'low'] || 3) - (severityOrder[b.severity || 'low'] || 3));
  }, [gapAnalysisItems]);

  const standouts = useMemo(() => {
    return gapAnalysisItems
      .filter((item) => item.type === 'standout')
      .sort((a, b) => (b.opportunityScore || 0) - (a.opportunityScore || 0));
  }, [gapAnalysisItems]);

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

  const { analysis, competitors, personas } = data;
  const deficitsCount = deficits.length;
  const standoutsCount = standouts.length;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/analyses/${analysisId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete analysis');
      }

      // Redirect to dashboard after successful deletion
      router.push('/dashboard');
    } catch (error) {
      console.error('Error deleting analysis:', error);
      alert('Failed to delete analysis. Please try again.');
      setIsDeleting(false);
    }
  };

  const handleRerun = async () => {
    setIsRerunning(true);
    try {
      const response = await fetch(`/api/analyses/${analysisId}/rerun`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to rerun analysis');
      }

      // Close dialog and redirect to analysis page to show loading state
      setShowRerunDialog(false);
      router.push(`/analysis/${analysisId}`);
    } catch (error) {
      console.error('Error rerunning analysis:', error);
      alert(error instanceof Error ? error.message : 'Failed to rerun analysis. Please try again.');
      setIsRerunning(false);
    }
  };

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
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{analysis.appName}</h1>
                <p className="text-gray-600 mb-4">
                  <span className="font-medium">Target Audience:</span> {analysis.targetAudience}
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Analyzed: {formatDateTime(analysis.createdAt)}
                </p>
              </div>
              <div className="flex gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRerunDialog(true)}
                  disabled={isRerunning}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRerunning ? 'animate-spin' : ''}`} />
                  {isRerunning ? 'Rerunning...' : 'Rerun Analysis'}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>

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
              <TabsTrigger value="intelligence">Market Intelligence</TabsTrigger>
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
                        name={competitor.name ?? ""}
                        type={competitor.type ?? ""}
                        description={competitor.description ?? ""}
                        websiteUrl={competitor.websiteUrl ?? ""}
                        marketPosition={competitor.marketPosition ?? ""}
                        pricingModel={competitor.pricingModel ?? ""}
                        foundedYear={typeof competitor.foundedYear === "number" ? competitor.foundedYear : undefined}
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
                {data.comparisonParameters.length === 0 || data.featureMatrixScores.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Feature matrix is being generated. This may take a few minutes.</p>
                    <p className="text-sm mt-2">
                      Parameters: {data.comparisonParameters.length} | Scores: {data.featureMatrixScores.length}
                    </p>
                    {analysis.status === 'processing' && (
                      <p className="text-xs text-gray-400 mt-2">
                        Current stage: {analysis.aiProcessingStage || 'Initializing...'}
                      </p>
                    )}
                  </div>
                ) : (
                  <FeatureMatrix
                    userAppName={analysis.appName}
                    competitors={competitors}
                    parameters={data.comparisonParameters}
                    scores={data.featureMatrixScores}
                  />
                )}
              </div>

              {/* Section 3: Pricing Comparison */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4">Pricing Comparison</h2>
                <PricingComparison
                  userAppName={analysis.appName}
                  userPricing={null} // TODO: Add user pricing field to analysis
                  competitors={competitors.map((c) => ({
                    id: c.id,
                    name: c.name,
                    type: c.type,
                    pricingModel: c.pricingModel,
                  }))}
                />
              </div>

              {/* Section 4: Positioning Map */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4">Competitive Positioning</h2>
                <p className="text-gray-600 mb-4">Value vs Complexity analysis</p>
                {data.positioningData.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Positioning data is being generated. This may take a few minutes.</p>
                    <p className="text-sm mt-2">Data points: {data.positioningData.length}</p>
                    {analysis.status === 'processing' && (
                      <p className="text-xs text-gray-400 mt-2">
                        Current stage: {analysis.aiProcessingStage || 'Initializing...'}
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    {process.env.NODE_ENV === 'development' && (
                      <div className="mb-4 p-2 bg-gray-100 text-xs text-gray-600 rounded">
                        Debug: {data.positioningData.length} positioning data points found
                        {data.positioningData.length > 0 && (
                          <div className="mt-1">
                            User app: {data.positioningData.filter(p => p.entityType === 'user_app').length} | 
                            Competitors: {data.positioningData.filter(p => p.entityType === 'competitor').length}
                          </div>
                        )}
                      </div>
                    )}
                    <PositioningMap
                      userAppName={analysis.appName}
                      positioningData={data.positioningData
                        .map((p) => {
                          // Ensure all required fields are present
                          // Type assertion needed because we're adding competitorType which isn't in PositioningData type
                          const positionWithType = p as PositioningData & { competitorType?: 'direct' | 'indirect' };
                          const mapped = {
                            id: p.id,
                            entityType: p.entityType as 'user_app' | 'competitor',
                            entityName: p.entityName,
                            valueScore: p.valueScore,
                            complexityScore: p.complexityScore,
                            quadrant: p.quadrant || '',
                            competitorType: positionWithType.competitorType,
                          };
                          return mapped;
                        })
                        .filter((p) => {
                          // Only filter out if both scores are missing
                          return p.valueScore !== null && p.complexityScore !== null;
                        })}
                    />
                  </>
                )}
              </div>

              {/* Section 5: Simulated Reviews */}
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
                        reviewerName={review.reviewerName ?? ""}
                        reviewerProfile={review.reviewerProfile ?? ""}
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

          <TabsContent value="intelligence">
            {data.marketIntelligence ? (
              <MarketIntelligenceComponent data={data.marketIntelligence} />
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-gray-500">
                  Market intelligence is being generated. This comprehensive analysis will include industry
                  overview, market trends, competitive landscape, and strategic recommendations.
                </p>
              </div>
            )}
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
                  description={data.blueOceanInsight.description ?? ""}
                  supportingEvidence={data.blueOceanInsight.supportingEvidence as string[]}
                  targetSegment={data.blueOceanInsight.targetSegment ?? ""}
                  estimatedOpportunity={data.blueOceanInsight.estimatedOpportunity ?? ""}
                  implementationDifficulty={data.blueOceanInsight.implementationDifficulty ?? ""}
                  strategicRecommendation={data.blueOceanInsight.strategicRecommendation ?? ""}
                /> )}
                
              {/* Section 3: Competitive Deficits */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-2">
                  🔴 Competitive Deficits ({deficits.length})
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Areas where competitors have advantages you should address
                </p>
                {deficits.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {deficits.map((deficit) => (
                      <DeficitCard
                        key={deficit.id}
                        title={deficit.title}
                        description={deficit.description}
                        severity={deficit.severity ?? "low"}
                        affectedCompetitors={Array.isArray(deficit.affectedCompetitors) ? deficit.affectedCompetitors as string[] : []}
                        recommendation={deficit.recommendation ?? ""}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">
                    No competitive deficits identified - you&apos;re well positioned!
                  </p>
                )}
              </div>

              {/* Section 4: Unique Standouts */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-2">
                  🟢 Unique Standouts ({standouts.length})
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Your competitive advantages and differentiation opportunities
                </p>
                {standouts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {standouts.map((standout) => (
                      <StandoutCard
                        key={standout.id}
                        title={standout.title}
                        description={standout.description}
                        opportunityScore={standout.opportunityScore || 0}
                        recommendation={standout.recommendation || ""}
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
            <PersonaChat
              analysisId={analysisId}
              personas={
                data.personas.map((p) => ({
                  id: p.id,
                  personaType: p.personaType,
                  name: p.name,
                  title: p.title ?? "",
                  description: p.description,
                  painPoints: p.painPoints,
                  priorities: p.priorities,
                  behaviorProfile: p.behaviorProfile ?? "",
                }))
              }
            />
          </TabsContent>

          <TabsContent value="export">
            <div className="bg-white rounded-lg shadow-md p-6">
              <ExportCenter analysisId={analysisId} analysisName={analysis.appName} />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        itemName={analysis.appName}
        itemType="analysis"
        isLoading={isDeleting}
      />

      {/* Rerun Confirmation Dialog */}
      {showRerunDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowRerunDialog(false)} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 z-10 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Rerun Analysis</h2>
            <div className="space-y-4">
              <div>
                <p className="text-gray-700 mb-2">
                  Are you sure you want to rerun the analysis for <strong className="font-semibold">{analysis.appName}</strong>?
                </p>
                <p className="text-sm text-orange-600 font-medium mb-4">
                  ⚠️ This will delete all existing analysis data (competitors, scores, insights, etc.) and regenerate everything from scratch. This action cannot be undone.
                </p>
                <p className="text-sm text-gray-600">
                  The analysis will take 2-3 minutes to complete. You&apos;ll be redirected to the loading page.
                </p>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button variant="outline" onClick={() => setShowRerunDialog(false)} disabled={isRerunning}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleRerun}
                  disabled={isRerunning}
                  isLoading={isRerunning}
                >
                  {isRerunning ? 'Rerunning...' : 'Rerun Analysis'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
