'use client';

import React from 'react';
import type { MarketIntelligence } from '@/types/database';
import { Card } from './ui/Card';
import { TrendingUp, TrendingDown, AlertTriangle, Target, Shield, Lightbulb } from 'lucide-react';

interface MarketIntelligenceProps {
  data: MarketIntelligence;
}

export const MarketIntelligenceComponent: React.FC<MarketIntelligenceProps> = ({ data }) => {
  const marketTrends = (data.marketTrends as string[]) || [];
  const marketDynamics = data.marketDynamics as {
    drivers?: string[];
    restraints?: string[];
    opportunities?: string[];
  } | null;
  const barriersToEntry = data.barriersToEntry as {
    level?: string;
    factors?: string[];
  } | null;
  const opportunities = (data.opportunities as Array<{
    title: string;
    description: string;
    potential_impact: string;
  }>) || [];
  const threats = (data.threats as Array<{
    title: string;
    description: string;
    severity: string;
    mitigation: string;
  }>) || [];
  const keySuccessFactors = (data.keySuccessFactors as string[]) || [];

  const getImpactColor = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'very_high':
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getBarrierLevelColor = (level?: string) => {
    switch (level?.toLowerCase()) {
      case 'very_high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Industry Overview */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Industry Overview</h2>
        <div className="prose max-w-none">
          <p className="text-gray-700 whitespace-pre-line leading-relaxed">{data.industryOverview}</p>
        </div>
      </Card>

      {/* Market Size & Growth */}
      {(data.marketSize || data.marketGrowth) && (
        <div className="grid md:grid-cols-2 gap-6">
          {data.marketSize && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Market Size</h3>
              </div>
              <p className="text-gray-700">{data.marketSize}</p>
            </Card>
          )}
          {data.marketGrowth && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Market Growth</h3>
              </div>
              <p className="text-gray-700">{data.marketGrowth}</p>
            </Card>
          )}
        </div>
      )}

      {/* Market Trends */}
      {marketTrends.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Market Trends</h2>
          </div>
          <ul className="space-y-2">
            {marketTrends.map((trend, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="text-blue-600 font-semibold mt-1">•</span>
                <span className="text-gray-700 flex-1">{trend}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Competitive Landscape */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Competitive Landscape</h2>
        <div className="prose max-w-none">
          <p className="text-gray-700 whitespace-pre-line leading-relaxed">{data.competitiveLandscape}</p>
        </div>
      </Card>

      {/* Market Dynamics */}
      {marketDynamics && (
        <div className="grid md:grid-cols-3 gap-6">
          {marketDynamics.drivers && marketDynamics.drivers.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Market Drivers</h3>
              </div>
              <ul className="space-y-2">
                {marketDynamics.drivers.map((driver, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-600 font-semibold mt-1">+</span>
                    <span className="text-gray-700 text-sm">{driver}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {marketDynamics.restraints && marketDynamics.restraints.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-semibold text-gray-900">Market Restraints</h3>
              </div>
              <ul className="space-y-2">
                {marketDynamics.restraints.map((restraint, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-red-600 font-semibold mt-1">−</span>
                    <span className="text-gray-700 text-sm">{restraint}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          {marketDynamics.opportunities && marketDynamics.opportunities.length > 0 && (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-yellow-600" />
                <h3 className="text-lg font-semibold text-gray-900">Market Opportunities</h3>
              </div>
              <ul className="space-y-2">
                {marketDynamics.opportunities.map((opportunity, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-yellow-600 font-semibold mt-1">💡</span>
                    <span className="text-gray-700 text-sm">{opportunity}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}

      {/* Barriers to Entry */}
      {barriersToEntry && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-bold text-gray-900">Barriers to Entry</h2>
          </div>
          <div className="mb-4">
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${getBarrierLevelColor(barriersToEntry.level)}`}>
              Level: {barriersToEntry.level?.replace('_', ' ').toUpperCase() || 'N/A'}
            </span>
          </div>
          {barriersToEntry.factors && barriersToEntry.factors.length > 0 && (
            <ul className="space-y-2">
              {barriersToEntry.factors.map((factor, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-gray-600 font-semibold mt-1">•</span>
                  <span className="text-gray-700 flex-1">{factor}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {/* Opportunities */}
      {opportunities.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900">Market Opportunities</h2>
          </div>
          <div className="space-y-4">
            {opportunities.map((opportunity, index) => (
              <div key={index} className="border-l-4 border-green-500 pl-4 py-2">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{opportunity.title}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getImpactColor(opportunity.potential_impact)}`}>
                    {opportunity.potential_impact.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <p className="text-gray-700 text-sm">{opportunity.description}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Threats */}
      {threats.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h2 className="text-xl font-bold text-gray-900">Market Threats</h2>
          </div>
          <div className="space-y-4">
            {threats.map((threat, index) => (
              <div key={index} className="border-l-4 border-red-500 pl-4 py-2">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{threat.title}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getImpactColor(threat.severity)}`}>
                    {threat.severity.toUpperCase()}
                  </span>
                </div>
                <p className="text-gray-700 text-sm mb-2">{threat.description}</p>
                <div className="bg-blue-50 border border-blue-200 rounded p-2 mt-2">
                  <p className="text-xs text-blue-900">
                    <strong>Mitigation:</strong> {threat.mitigation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Key Success Factors */}
      {keySuccessFactors.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-yellow-600" />
            <h2 className="text-xl font-bold text-gray-900">Key Success Factors</h2>
          </div>
          <ul className="space-y-2">
            {keySuccessFactors.map((factor, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="text-yellow-600 font-semibold mt-1">✓</span>
                <span className="text-gray-700 flex-1">{factor}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Strategic Recommendations */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Strategic Recommendations</h2>
        <div className="prose max-w-none">
          <p className="text-gray-800 whitespace-pre-line leading-relaxed font-medium">
            {data.strategicRecommendations}
          </p>
        </div>
      </Card>
    </div>
  );
};

