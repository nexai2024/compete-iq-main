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
import { OverviewData, IntelligenceData, GapsData, PersonasData } from '@/types/api';

interface AnalysisDashboardProps {
  analysisId: string;
}

const TabContentLoader = () => (
  <div className="flex items-center justify-center p-12">
    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
  </div>
);

export const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ analysisId }) => {
  const router = useRouter();

  // State for each tab's data
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [intelligenceData, setIntelligenceData] = useState<IntelligenceData | null>(null);
  const [gapsData, setGapsData] = useState<GapsData | null>(null);
  const [personasData, setPersonasData] = useState<PersonasData | null>(null);

  // Loading and error states
  const [isOverviewLoading, setIsOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [isTabLoading, setIsTabLoading] = useState(false);
  const [tabError, setTabError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Dialog and action states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRerunning, setIsRerunning] = useState(false);
  const [showRerunDialog, setShowRerunDialog] = useState(false);

  // Initial data fetch for overview tab
  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const response = await fetch(`/api/analyses/${analysisId}/overview`);
        if (!response.ok) throw new Error('Failed to fetch overview data');
        const data: OverviewData = await response.json();
        setOverviewData(data);
      } catch (err) {
        console.error('Error fetching overview:', err);
        setOverviewError(err instanceof Error ? err.message : 'Failed to load analysis');
      } finally {
        setIsOverviewLoading(false);
      }
    };
    fetchOverview();
  }, [analysisId]);

  // Function to fetch data for other tabs on demand
  const fetchTabData = useCallback(async (tab: string) => {
    if (tab === 'overview') return;

    let alreadyLoaded = false;
    if (tab === 'intelligence' && intelligenceData) alreadyLoaded = true;
    if (tab === 'gaps' && gapsData) alreadyLoaded = true;
    if (tab === 'personas' && personasData) alreadyLoaded = true;

    if (alreadyLoaded) return;

    setIsTabLoading(true);
    setTabError(null);
    try {
      const response = await fetch(`/api/analyses/${analysisId}/${tab}`);
      if (!response.ok) throw new Error(`Failed to fetch data for ${tab}`);
      const data = await response.json();

      if (tab === 'intelligence') setIntelligenceData(data);
      if (tab === 'gaps') setGapsData(data);
      if (tab === 'personas') setPersonasData(data);

    } catch (err) {
      console.error(`Error fetching ${tab} data:`, err);
      setTabError(err instanceof Error ? err.message : `Failed to load ${tab} data`);
    } finally {
      setIsTabLoading(false);
    }
  }, [analysisId, intelligenceData, gapsData, personasData]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    fetchTabData(value);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/analyses/${analysisId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete analysis');
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
      const response = await fetch(`/api/analyses/${analysisId}/rerun`, { method: 'POST' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to rerun analysis');
      }
      setShowRerunDialog(false);
      router.push(`/analysis/${analysisId}`);
    } catch (error) {
      console.error('Error rerunning analysis:', error);
      alert(error instanceof Error ? error.message : 'Failed to rerun analysis. Please try again.');
      setIsRerunning(false);
    }
  };

  if (isOverviewLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>;
  }

  if (overviewError || !overviewData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{overviewError || 'An unknown error occurred'}</p>
          <Link href="/dashboard" className="text-blue-600 hover:underline">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const { analysis, competitors, simulatedReviews } = overviewData;
  const deficitsCount = gapsData?.gapAnalysisItems.filter(g => g.type === 'deficit').length ?? 0;
  const standoutsCount = gapsData?.gapAnalysisItems.filter(g => g.type === 'standout').length ?? 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4">
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
                <Button variant="outline" size="sm" onClick={() => setShowRerunDialog(true)} disabled={isRerunning}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRerunning ? 'animate-spin' : ''}`} />
                  {isRerunning ? 'Rerunning...' : 'Rerun Analysis'}
                </Button>
                <Button variant="danger" size="sm" onClick={() => setShowDeleteDialog(true)}>
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
                <span className="font-medium">{gapsData?.userFeatures.length ?? '...'}</span> Features
              </div>
              <div className="bg-orange-50 px-3 py-1 rounded-full text-sm">
                <span className="font-medium">{gapsData ? deficitsCount : '...'}</span> Deficits
              </div>
              <div className="bg-purple-50 px-3 py-1 rounded-full text-sm">
                <span className="font-medium">{gapsData ? standoutsCount : '...'}</span> Standouts
              </div>
              <div className="bg-pink-50 px-3 py-1 rounded-full text-sm">
                <span className="font-medium">{personasData?.personas.length ?? '...'}</span> Personas
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" onValueChange={handleTabChange} className="space-y-6">
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
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4">Competitors ({competitors.length})</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {competitors.map(c => <CompetitorCard key={c.id} {...c} name={c.name ?? ''} type={c.type ?? ''} description={c.description??''} websiteUrl={c.websiteUrl??''} marketPosition={c.marketPosition??''} pricingModel={c.pricingModel??''} foundedYear={c.foundedYear ?? undefined} featureCount={c.features.length} />)}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                 <h2 className="text-xl font-bold mb-4">Feature Comparison Matrix</h2>
                <FeatureMatrix userAppName={analysis.appName} {...overviewData} />
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4">Pricing Comparison</h2>
                <PricingComparison userAppName={analysis.appName} userPricing={null} competitors={competitors.map(c => ({ id: c.id, name: c.name, type: c.type, pricingModel: c.pricingModel }))} />
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4">Competitive Positioning</h2>
                <p className="text-gray-600 mb-4">Value vs Complexity analysis</p>
                <PositioningMap userAppName={analysis.appName} positioningData={overviewData.positioningData.map(p => ({...p, entityType: p.entityType as 'user_app' | 'competitor', quadrant: p.quadrant ?? ''}))} />
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold mb-4">Simulated User Reviews ({simulatedReviews.length})</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {simulatedReviews.map(r => <ReviewCard key={r.id} {...r} reviewerName={r.reviewerName??''} reviewerProfile={r.reviewerProfile??''} highlightedFeatures={r.highlightedFeatures as string[]} painPointsAddressed={r.painPointsAddressed as string[]} />)}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="intelligence">
            {isTabLoading && activeTab === 'intelligence' ? <TabContentLoader /> : tabError && activeTab === 'intelligence' ? <p className="text-red-500">{tabError}</p> :
              intelligenceData?.marketIntelligence ? <MarketIntelligenceComponent data={intelligenceData.marketIntelligence} /> : <p>No intelligence data.</p>}
          </TabsContent>

          <TabsContent value="gaps">
             {isTabLoading && activeTab === 'gaps' ? <TabContentLoader /> : tabError && activeTab === 'gaps' ? <p className="text-red-500">{tabError}</p> :
              gapsData ? (
                <div className="space-y-8">
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold mb-2">MVP Feature Roadmap</h2>
                    <p className="text-sm text-gray-600 mb-4">Features prioritized based on analysis</p>
                    <MVPRoadmap features={gapsData.userFeatures} />
                  </div>
                  {gapsData.blueOceanInsight && <BlueOceanCard {...gapsData.blueOceanInsight} description={gapsData.blueOceanInsight.description??''} supportingEvidence={gapsData.blueOceanInsight.supportingEvidence as string[]} targetSegment={gapsData.blueOceanInsight.targetSegment??''} estimatedOpportunity={gapsData.blueOceanInsight.estimatedOpportunity??''} implementationDifficulty={gapsData.blueOceanInsight.implementationDifficulty??''} strategicRecommendation={gapsData.blueOceanInsight.strategicRecommendation??''} />}
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold mb-2">🔴 Competitive Deficits ({deficitsCount})</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {gapsData.gapAnalysisItems.filter(i => i.type === 'deficit').map(i => <DeficitCard key={i.id} {...i} severity={i.severity as 'critical' | 'high' | 'medium' | 'low'} affectedCompetitors={i.affectedCompetitors as string[]} recommendation={i.recommendation??''} />)}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold mb-2">🟢 Unique Standouts ({standoutsCount})</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {gapsData.gapAnalysisItems.filter(i => i.type === 'standout').map(i => <StandoutCard key={i.id} {...i} opportunityScore={i.opportunityScore??0} recommendation={i.recommendation??''} />)}
                    </div>
                  </div>
                </div>
              ) : <p>No strategic gaps data.</p>}
          </TabsContent>

          <TabsContent value="personas">
            {isTabLoading && activeTab === 'personas' ? <TabContentLoader /> : tabError && activeTab === 'personas' ? <p className="text-red-500">{tabError}</p> :
              personasData ? <PersonaChat analysisId={analysisId} personas={personasData.personas.map(p => ({...p, title: p.title??'', behaviorProfile: p.behaviorProfile??''}))} /> : <p>No persona data.</p>}
          </TabsContent>

          <TabsContent value="export">
            <div className="bg-white rounded-lg shadow-md p-6">
              <ExportCenter analysisId={analysisId} analysisName={analysis.appName} />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <DeleteConfirmationDialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} onConfirm={handleDelete} itemName={analysis.appName} itemType="analysis" isLoading={isDeleting} />

      {showRerunDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowRerunDialog(false)} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 z-10 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Rerun Analysis</h2>
            <div className="space-y-4">
              <p className="text-gray-700">Are you sure you want to rerun for <strong className="font-semibold">{analysis.appName}</strong>?</p>
              <p className="text-sm text-orange-600 font-medium">⚠️ This will delete all existing data and regenerate it. This cannot be undone.</p>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowRerunDialog(false)} disabled={isRerunning}>Cancel</Button>
                <Button variant="primary" onClick={handleRerun} disabled={isRerunning} isLoading={isRerunning}>
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
