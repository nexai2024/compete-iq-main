'use client';

import { Check, Users } from 'lucide-react';

interface BlueOceanCardProps {
  marketVacuumTitle: string;
  description: string;
  supportingEvidence: string[];
  targetSegment: string;
  estimatedOpportunity: 'low' | 'medium' | 'high' | 'very_high';
  implementationDifficulty: 'easy' | 'moderate' | 'hard' | 'very_hard';
  strategicRecommendation: string;
}

const opportunityStyles = {
  low: { bg: 'bg-gray-500', text: 'text-white', label: 'Low' },
  medium: { bg: 'bg-yellow-500', text: 'text-white', label: 'Medium' },
  high: { bg: 'bg-green-600', text: 'text-white', label: 'High' },
  very_high: { bg: 'bg-green-500', text: 'text-white', label: 'Very High' },
};

const difficultyStyles = {
  easy: { bg: 'bg-green-600', text: 'text-white', label: 'Easy' },
  moderate: { bg: 'bg-yellow-500', text: 'text-white', label: 'Moderate' },
  hard: { bg: 'bg-orange-600', text: 'text-white', label: 'Hard' },
  very_hard: { bg: 'bg-red-600', text: 'text-white', label: 'Very Hard' },
};

export function BlueOceanCard({
  marketVacuumTitle,
  description,
  supportingEvidence,
  targetSegment,
  estimatedOpportunity,
  implementationDifficulty,
  strategicRecommendation,
}: BlueOceanCardProps) {
  const opportunityStyle = opportunityStyles[estimatedOpportunity];
  const difficultyStyle = difficultyStyles[implementationDifficulty];

  return (
    <div className="bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg shadow-lg p-8 text-white">
      {/* Header */}
      <div className="flex items-center mb-4">
        <span className="text-4xl mr-3">🌊</span>
        <h2 className="text-2xl font-bold">Blue Ocean Opportunity</h2>
      </div>

      {/* Market Vacuum Title */}
      <h3 className="text-xl font-bold mb-4">{marketVacuumTitle}</h3>

      {/* Description */}
      <p className="text-blue-50 mb-6 leading-relaxed">{description}</p>

      {/* Supporting Evidence */}
      {supportingEvidence.length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold mb-3">Supporting Evidence</h4>
          <ul className="space-y-2">
            {supportingEvidence.map((evidence, index) => (
              <li key={index} className="flex items-start">
                <Check className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-blue-50">{evidence}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Metadata Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Target Segment */}
        <div className="bg-white/10 rounded-md p-4">
          <div className="flex items-center mb-2">
            <Users className="w-5 h-5 mr-2" />
            <span className="font-semibold">Target Segment</span>
          </div>
          <p className="text-blue-50">{targetSegment}</p>
        </div>

        {/* Badges Container */}
        <div className="space-y-3">
          {/* Estimated Opportunity */}
          <div>
            <p className="text-sm mb-1">Estimated Opportunity</p>
            <span
              className={`inline-block ${opportunityStyle.bg} ${opportunityStyle.text} px-3 py-2 rounded font-medium text-sm`}
            >
              {opportunityStyle.label}
            </span>
          </div>

          {/* Implementation Difficulty */}
          <div>
            <p className="text-sm mb-1">Implementation Difficulty</p>
            <span
              className={`inline-block ${difficultyStyle.bg} ${difficultyStyle.text} px-3 py-2 rounded font-medium text-sm`}
            >
              {difficultyStyle.label}
            </span>
          </div>
        </div>
      </div>

      {/* Strategic Recommendation */}
      <div className="bg-white/95 rounded-md p-4 text-gray-900">
        <div className="flex items-center mb-2">
          <span className="text-xl mr-2">💡</span>
          <h4 className="font-bold">Strategic Recommendation</h4>
        </div>
        <p className="text-sm">{strategicRecommendation}</p>
      </div>
    </div>
  );
}
