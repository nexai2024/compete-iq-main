'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface MVPRoadmapProps {
  features: Array<{
    id: string;
    featureName: string;
    featureDescription: string | null;
    mvpPriority: 'P0' | 'P1' | 'P2' | null;
    priorityReasoning: string | null;
  }>;
}

interface FeatureCardProps {
  feature: {
    id: string;
    featureName: string;
    featureDescription: string | null;
    priorityReasoning: string | null;
  };
}

function FeatureCard({ feature }: FeatureCardProps) {
  const [showReasoning, setShowReasoning] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-md p-3">
      <h4 className="text-sm font-bold text-gray-900 mb-1">{feature.featureName}</h4>
      {feature.featureDescription && (
        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{feature.featureDescription}</p>
      )}
      {feature.priorityReasoning && (
        <div className="mt-2">
          <button
            onClick={() => setShowReasoning(!showReasoning)}
            className="flex items-center text-xs text-blue-600 hover:text-blue-700"
          >
            {showReasoning ? (
              <>
                <ChevronUp className="w-3 h-3 mr-1" />
                Hide reasoning
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3 mr-1" />
                Why?
              </>
            )}
          </button>
          {showReasoning && (
            <p className="text-xs text-gray-500 italic mt-2">{feature.priorityReasoning}</p>
          )}
        </div>
      )}
    </div>
  );
}

export function MVPRoadmap({ features }: MVPRoadmapProps) {
  // Group features by priority
  const p0Features = features.filter((f) => f.mvpPriority === 'P0');
  const p1Features = features.filter((f) => f.mvpPriority === 'P1');
  const p2Features = features.filter((f) => f.mvpPriority === 'P2');
  const unscopedFeatures = features.filter((f) => f.mvpPriority === null);

  return (
    <div className="space-y-4">
      {/* Three Priority Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* P0 Column */}
        <div className="flex flex-col">
          <div className="bg-[#fecaca] rounded-t-lg px-4 py-3 font-bold text-base text-gray-900">
            🔴 P0: Must Have ({p0Features.length})
          </div>
          <div className="bg-gray-50 rounded-b-lg p-3 min-h-[400px] space-y-3 overflow-y-auto max-h-[600px]">
            {p0Features.length > 0 ? (
              p0Features.map((feature) => <FeatureCard key={feature.id} feature={feature} />)
            ) : (
              <p className="text-center text-gray-400 text-sm py-8">
                No features in this category
              </p>
            )}
          </div>
        </div>

        {/* P1 Column */}
        <div className="flex flex-col">
          <div className="bg-[#fde68a] rounded-t-lg px-4 py-3 font-bold text-base text-gray-900">
            🟡 P1: Should Have ({p1Features.length})
          </div>
          <div className="bg-gray-50 rounded-b-lg p-3 min-h-[400px] space-y-3 overflow-y-auto max-h-[600px]">
            {p1Features.length > 0 ? (
              p1Features.map((feature) => <FeatureCard key={feature.id} feature={feature} />)
            ) : (
              <p className="text-center text-gray-400 text-sm py-8">
                No features in this category
              </p>
            )}
          </div>
        </div>

        {/* P2 Column */}
        <div className="flex flex-col">
          <div className="bg-[#bbf7d0] rounded-t-lg px-4 py-3 font-bold text-base text-gray-900">
            🟢 P2: Nice to Have ({p2Features.length})
          </div>
          <div className="bg-gray-50 rounded-b-lg p-3 min-h-[400px] space-y-3 overflow-y-auto max-h-[600px]">
            {p2Features.length > 0 ? (
              p2Features.map((feature) => <FeatureCard key={feature.id} feature={feature} />)
            ) : (
              <p className="text-center text-gray-400 text-sm py-8">
                No features in this category
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Unscoped Features */}
      {unscopedFeatures.length > 0 && (
        <div>
          <div className="bg-gray-200 rounded-t-lg px-4 py-3 font-bold text-base text-gray-700">
            ⚪ Unscoped Features ({unscopedFeatures.length})
          </div>
          <div className="bg-gray-50 rounded-b-lg p-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {unscopedFeatures.map((feature) => (
                <FeatureCard key={feature.id} feature={feature} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
