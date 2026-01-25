'use client';

import React, { useEffect, useState, useCallback } from 'react';
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
import type { Analysis } from '@/types/database';
import type {
  OverviewDataResponse,
  GapsDataResponse,
  PersonasDataResponse,
  MarketIntelligenceDataResponse,
} from '@/types/api';

type Tab = 'overview' | 'intelligence' | 'gaps' | 'personas' | 'export';

interface AnalysisDashboardProps {
  analysisId: string;
}

// Helper component for tab loading state
const TabLoadingState = () => (
  <div className="flex justify-center items-center p-8 bg-white rounded-lg shadow-md min-h-[200px]">
    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
  </div>
);

// Helper component for tab error state
const TabErrorState = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className="text-center p-8 bg-white rounded-lg shadow-md min-h-[200px]">
    <p className="text-red-600 mb-4">{message}</p>
    <Button onClick={onRetry}>Try Again</Button>
  </div>
);

export const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ analysisId }) => {
  const router = useRouter();

  // Core analysis state
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for each tab's data, loading, and error status
  const [overviewData, setOverviewData] = useState<OverviewDataResponse | null>(null);
  const [gapsData, setGapsData] = useState<GapsDataResponse | null>(null);
  const [personasData, setPersonasData] = useState<PersonasDataResponse | null>(null);
  const [intelligenceData, setIntelligenceData] = useState<MarketIntelligenceDataResponse | null>(null);

  const [tabState, setTabState] = useState({
    overview: { isLoading: true, error: null as string | null },
    gaps: { isLoading: false, error: null as string | null },
    personas: { isLoading: false, error: null as string | null },
    intelligence: { isLoading: false, error: null as string | null },
  });

  // Dialog states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRerunning, setIsRerunning] = useState(false);
  const [showRerunDialog, setShowRerunDialog] = useState(false);

  // Fetch core analysis data on initial load
  useEffect(() => {
    const fetchCoreAnalysis = async () => {
      try {
        const response = await fetch(`/api/analyses/${analysisId}`);
        if (!response.ok) throw new Error('Failed to fetch core analysis data');
        const coreData: Analysis = await response.json();
        setAnalysis(coreData);
      } catch (err) {
        console.error('Error fetching core analysis:', err);
        setError('Failed to load analysis data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCoreAnalysis();
  }, [analysisId]);

  // Function to fetch data for a specific tab
  const fetchTabData = useCallback(async (tab: Tab) => {
    if (tab === 'export') return; // No data to fetch for export tab

    // Don't refetch if data already exists or is loading
    if (
      (tab === 'overview' && overviewData) ||
      (tab === 'gaps' && gapsData) ||
      (tab === 'personas' && personasData) ||
      (tab === 'intelligence' && intelligenceData) ||
      tabState[tab].isLoading
    ) {
      return;
    }

    setTabState((prev) => ({ ...prev, [tab]: { isLoading: true, error: null } }));

    try {
      const response = await fetch(`/api/analyses/${analysisId}/${tab}`);
      if (!response.ok) throw new Error(`Failed to fetch data for ${tab}`);
      const data = await response.json();

      switch (tab) {
        case 'overview':
          setOverviewData(data);
          break;
        case 'gaps':
          setGapsData(data);
          break;
        case 'personas':
          setPersonasData(data);
          break;
        case 'intelligence':
          setIntelligenceData(data);
          break;
      }
      setTabState((prev) => ({ ...prev, [tab]: { isLoading: false, error: null } }));
    } catch (err) {
      console.error(`Error fetching ${tab} data:`, err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setTabState((prev) => ({ ...prev, [tab]: { isLoading: false, error: errorMessage } }));
    }
  }, [analysisId, overviewData, gapsData, personasData, intelligenceData, tabState]);

  // Fetch data for the default tab ('overview') after core analysis is loaded
  useEffect(() => {
    if (analysis) {
      fetchTabData('overview');
    }
  }, [analysis, fetchTabData]);

  // Main loading state for the initial shell
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  // Main error state if core analysis fails
  if (error || !analysis) {
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

            {/* Quick Stats - Now derived from tab data to avoid layout shift */}
            <div className="flex flex-wrap gap-3 h-8 items-center">
              {overviewData && (
                <div className="bg-blue-50 px-3 py-1 rounded-full text-sm">
                  <span className="font-medium">{overviewData.competitors.length}</span> Competitors
                </div>
              )}
              {gapsData && (
                 <div className="bg-green-50 px-3 py-1 rounded-full text-sm">
                  <span className="font-medium">{gapsData.userFeatures.length}</span> Features
                </div>
              )}
              {gapsData && (
                <>
                  <div className="bg-orange-50 px-3 py-1 rounded-full text-sm">
                    <span className="font-medium">{gapsData.gapAnalysisItems.filter(g => g.type === 'deficit').length}</span> Deficits
                  </div>
                  <div className="bg-purple-50 px-3 py-1 rounded-full text-sm">
                    <span className="font-medium">{gapsData.gapAnalysisItems.filter(g => g.type === 'standout').length}</span> Standouts
                  </div>
                </>
              )}
               {personasData && (
                <div className="bg-pink-50 px-3 py-1 rounded-full text-sm">
                  <span className="font-medium">{personasData.personas.length}</span> Personas
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" onValueChange={(value) => fetchTabData(value as Tab)} className="space-y-6">
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
            {tabState.overview.isLoading ? (
              <TabLoadingState />
            ) : tabState.overview.error ? (
              <TabErrorState message={tabState.overview.error} onRetry={() => fetchTabData('overview')} />
            ) : overviewData ? (
              <div className="space-y-8">
                {/* Section 1: Competitors */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold mb-4">Competitors ({overviewData.competitors.length})</h2>
                  {overviewData.competitors.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {overviewData.competitors.map((competitor) => (
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
                  <FeatureMatrix
                    userAppName={analysis.appName}
                    competitors={overviewData.competitors}
                    parameters={overviewData.comparisonParameters}
                    scores={overviewData.featureMatrixScores}
                  />
                </div>

                {/* Section 3: Pricing Comparison */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold mb-4">Pricing Comparison</h2>
                  <PricingComparison
                    userAppName={analysis.appName}
                    userPricing={null}
                    competitors={overviewData.competitors.map((c) => ({
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
                  <PositioningMap
                    userAppName={analysis.appName}
                    positioningData={overviewData.positioningData.map((p) => ({
                      ...p,
                      entityType: p.entityType as 'user_app' | 'competitor',
                      quadrant: p.quadrant || '',
                    }))}
                  />
                </div>

                {/* Section 5: Simulated Reviews */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold mb-4">Simulated User Reviews ({overviewData.simulatedReviews.length})</h2>
                  <p className="text-sm text-gray-500 mb-4">AI-generated reviews based on persona analysis</p>
                  {overviewData.simulatedReviews.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {overviewData.simulatedReviews.map((review) => (
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
            ) : null}
          </TabsContent>

          <TabsContent value="intelligence">
            {tabState.intelligence.isLoading ? (
              <TabLoadingState />
            ) : tabState.intelligence.error ? (
              <TabErrorState message={tabState.intelligence.error} onRetry={() => fetchTabData('intelligence')} />
            ) : intelligenceData ? (
              intelligenceData.marketIntelligence ? (
                <MarketIntelligenceComponent data={intelligenceData.marketIntelligence} />
              ) : (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <p className="text-gray-500">Market intelligence is being generated.</p>
                </div>
              )
            ) : null}
          </TabsContent>

          <TabsContent value="gaps">
             {tabState.gaps.isLoading ? (
              <TabLoadingState />
            ) : tabState.gaps.error ? (
              <TabErrorState message={tabState.gaps.error} onRetry={() => fetchTabData('gaps')} />
            ) : gapsData ? (
              <div className="space-y-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold mb-2">MVP Feature Roadmap</h2>
                  <p className="text-sm text-gray-600 mb-4">Features prioritized based on competitive analysis</p>
                  <MVPRoadmap features={gapsData.userFeatures} />
                </div>

                {gapsData.blueOceanInsight && (
                  <BlueOceanCard
                    marketVacuumTitle={gapsData.blueOceanInsight.marketVacuumTitle}
                    description={gapsData.blueOceanInsight.description ?? ""}
                    supportingEvidence={gapsData.blueOceanInsight.supportingEvidence as string[]}
                    targetSegment={gapsData.blueOceanInsight.targetSegment ?? ""}
                    estimatedOpportunity={gapsData.blueOceanInsight.estimatedOpportunity ?? ""}
                    implementationDifficulty={gapsData.blueOceanInsight.implementationDifficulty ?? ""}
                    strategicRecommendation={gapsData.blueOceanInsight.strategicRecommendation ?? ""}
                  />
                )}

                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold mb-2">🔴 Competitive Deficits ({gapsData.gapAnalysisItems.filter(g => g.type === 'deficit').length})</h2>
                  <p className="text-sm text-gray-600 mb-4">Areas where competitors have advantages</p>
                  {gapsData.gapAnalysisItems.filter(item => item.type === 'deficit').length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {gapsData.gapAnalysisItems
                        .filter(item => item.type === 'deficit')
                        .sort((a, b) => {
                          const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
                          return (severityOrder[a.severity || 'low'] ?? 3) - (severityOrder[b.severity || 'low'] ?? 3);
                        })
                        .map(deficit => (
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
                    <p className="text-gray-500">No competitive deficits identified.</p>
                  )}
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold mb-2">🟢 Unique Standouts ({gapsData.gapAnalysisItems.filter(g => g.type === 'standout').length})</h2>
                  <p className="text-sm text-gray-600 mb-4">Your competitive advantages</p>
                   {gapsData.gapAnalysisItems.filter(item => item.type === 'standout').length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {gapsData.gapAnalysisItems
                        .filter(item => item.type === 'standout')
                        .sort((a, b) => (b.opportunityScore || 0) - (a.opportunityScore || 0))
                        .map(standout => (
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
                    <p className="text-gray-500">No unique standouts identified.</p>
                  )}
                </div>
              </div>
            ) : null}
          </TabsContent>

          <TabsContent value="personas">
             {tabState.personas.isLoading ? (
              <TabLoadingState />
            ) : tabState.personas.error ? (
              <TabErrorState message={tabState.personas.error} onRetry={() => fetchTabData('personas')} />
            ) : personasData ? (
              <PersonaChat
                analysisId={analysisId}
                personas={personasData.personas.map(p => ({
                  id: p.id,
                  personaType: p.personaType,
                  name: p.name,
                  title: p.title ?? "",
                  description: p.description,
                  painPoints: p.painPoints,
                  priorities: p.priorities,
                  behaviorProfile: p.behaviorProfile ?? "",
                }))}
              />
            ) : null}
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
