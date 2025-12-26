'use client';

import { ExternalLink } from 'lucide-react';

interface CompetitorCardProps {
  name: string;
  type: 'direct' | 'indirect';
  description: string;
  websiteUrl?: string | null;
  marketPosition?: string | null;
  pricingModel?: string | null;
  foundedYear?: number | null;
  featureCount: number;
}

const typeStyles = {
  direct: {
    bg: 'bg-[#f97316]',
    text: 'text-white',
    label: 'Direct Competitor',
  },
  indirect: {
    bg: 'bg-[#a855f7]',
    text: 'text-white',
    label: 'Indirect',
  },
};

export function CompetitorCard({
  name,
  type,
  description,
  websiteUrl,
  marketPosition,
  pricingModel,
  foundedYear,
  featureCount,
}: CompetitorCardProps) {
  const typeStyle = typeStyles[type];

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
      {/* Header: Name + Type Badge */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-base font-bold text-gray-900 flex-1 mr-2">{name}</h3>
        <span
          className={`${typeStyle.bg} ${typeStyle.text} px-2 py-1 rounded text-xs font-medium whitespace-nowrap`}
        >
          {typeStyle.label}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-3">{description}</p>

      {/* Metadata Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
        {marketPosition && (
          <div>
            <span className="text-gray-500">Position:</span>
            <p className="text-gray-900 font-medium">{marketPosition}</p>
          </div>
        )}
        {pricingModel && (
          <div>
            <span className="text-gray-500">Pricing:</span>
            <p className="text-gray-900 font-medium">{pricingModel}</p>
          </div>
        )}
        {foundedYear && (
          <div>
            <span className="text-gray-500">Founded:</span>
            <p className="text-gray-900 font-medium">{foundedYear}</p>
          </div>
        )}
        <div>
          <span className="text-gray-500">Features:</span>
          <p className="text-gray-900 font-medium">
            {featureCount} {featureCount === 1 ? 'feature' : 'features'}
          </p>
        </div>
      </div>

      {/* Website Link */}
      {websiteUrl && (
        <a
          href={websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 transition"
        >
          <ExternalLink className="w-4 h-4 mr-1" />
          Visit Website
        </a>
      )}
    </div>
  );
}
