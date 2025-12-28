'use client';

import { DollarSign, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PricingComparisonProps {
  userAppName: string;
  userPricing?: string | null;
  competitors: Array<{
    id: string;
    name: string;
    type: 'direct' | 'indirect';
    pricingModel?: string | null;
  }>;
}

interface PricingTier {
  name: string;
  price: string;
  features: string[];
}

/**
 * Parse pricing model string to extract structured pricing information
 */
function parsePricingModel(pricingModel: string | null | undefined): {
  model: string;
  tiers?: PricingTier[];
  notes?: string;
} {
  if (!pricingModel) {
    return { model: 'Not specified' };
  }

  // Try to extract pricing tiers from common formats
  const pricing = pricingModel.toLowerCase();
  
  // Check for free tier mentions
  if (pricing.includes('free') || pricing.includes('freemium')) {
    return { model: 'Freemium' };
  }
  
  // Check for subscription models
  if (pricing.includes('subscription') || pricing.includes('monthly') || pricing.includes('annual')) {
    return { model: 'Subscription-based' };
  }
  
  // Check for one-time payment
  if (pricing.includes('one-time') || pricing.includes('lifetime') || pricing.includes('perpetual')) {
    return { model: 'One-time payment' };
  }
  
  // Check for usage-based
  if (pricing.includes('usage') || pricing.includes('per') || pricing.includes('pay-as-you-go')) {
    return { model: 'Usage-based' };
  }
  
  // Check for enterprise
  if (pricing.includes('enterprise') || pricing.includes('custom')) {
    return { model: 'Enterprise/Custom' };
  }
  
  // Default: return the original string
  return { model: pricingModel };
}

/**
 * Compare pricing models and determine relative position
 */
function comparePricing(
  userPricing: string | null | undefined,
  competitorPricing: string | null | undefined
): 'higher' | 'lower' | 'similar' | 'unknown' {
  if (!userPricing || !competitorPricing) {
    return 'unknown';
  }

  const user = parsePricingModel(userPricing);
  const competitor = parsePricingModel(competitorPricing);

  // If models are the same, consider similar
  if (user.model === competitor.model) {
    return 'similar';
  }

  // Simple heuristic: freemium is typically lower, enterprise is typically higher
  const pricingOrder = ['Freemium', 'Usage-based', 'Subscription-based', 'One-time payment', 'Enterprise/Custom'];
  const userIndex = pricingOrder.indexOf(user.model);
  const competitorIndex = pricingOrder.indexOf(competitor.model);

  if (userIndex === -1 || competitorIndex === -1) {
    return 'unknown';
  }

  if (userIndex < competitorIndex) {
    return 'lower';
  } else if (userIndex > competitorIndex) {
    return 'higher';
  }

  return 'similar';
}

export function PricingComparison({
  userAppName,
  userPricing,
  competitors,
}: PricingComparisonProps) {
  const competitorsWithPricing = competitors.filter((c) => c.pricingModel);
  const hasUserPricing = !!userPricing;

  if (competitorsWithPricing.length === 0 && !hasUserPricing) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Pricing information is not available for this analysis.</p>
        <p className="text-sm mt-2">Pricing models will be displayed here once competitor data is enriched.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User App Pricing */}
      {hasUserPricing && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <DollarSign className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-bold text-gray-900">{userAppName}</h3>
                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Your App
                </span>
              </div>
              <p className="text-gray-700 font-medium">{userPricing}</p>
              <p className="text-sm text-gray-600 mt-1">
                Model: {parsePricingModel(userPricing).model}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Competitors Pricing */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Competitor Pricing Comparison
        </h3>
        {competitorsWithPricing.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {competitorsWithPricing.map((competitor) => {
              const comparison = comparePricing(userPricing, competitor.pricingModel);
              const parsedPricing = parsePricingModel(competitor.pricingModel);

              return (
                <div
                  key={competitor.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{competitor.name}</h4>
                      <span
                        className={`inline-block mt-1 text-xs px-2 py-1 rounded ${
                          competitor.type === 'direct'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {competitor.type === 'direct' ? 'Direct' : 'Indirect'}
                      </span>
                    </div>
                    {hasUserPricing && (
                      <div className="ml-2" title={
                        comparison === 'higher' ? 'Higher pricing' :
                        comparison === 'lower' ? 'Lower pricing' :
                        'Similar pricing'
                      }>
                        {comparison === 'higher' && (
                          <TrendingUp className="w-5 h-5 text-red-500" />
                        )}
                        {comparison === 'lower' && (
                          <TrendingDown className="w-5 h-5 text-green-500" />
                        )}
                        {comparison === 'similar' && (
                          <Minus className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-gray-700 font-medium mb-1">
                    {competitor.pricingModel}
                  </p>
                  <p className="text-sm text-gray-600">
                    Model: {parsedPricing.model}
                  </p>
                  {hasUserPricing && comparison !== 'unknown' && (
                    <p className="text-xs text-gray-500 mt-2">
                      {comparison === 'higher' && 'Typically higher than your pricing model'}
                      {comparison === 'lower' && 'Typically lower than your pricing model'}
                      {comparison === 'similar' && 'Similar pricing model to yours'}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <p>No competitor pricing information available yet.</p>
          </div>
        )}
      </div>

      {/* Pricing Insights */}
      {hasUserPricing && competitorsWithPricing.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
          <h4 className="font-semibold text-gray-900 mb-2">Pricing Insights</h4>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>
              • {competitorsWithPricing.length} competitor
              {competitorsWithPricing.length !== 1 ? 's' : ''} with pricing information
            </li>
            <li>
              • Your pricing model: <strong>{parsePricingModel(userPricing).model}</strong>
            </li>
            {competitorsWithPricing.some((c) => comparePricing(userPricing, c.pricingModel) === 'lower') && (
              <li className="text-green-700">
                • Some competitors use lower-priced models - consider value proposition
              </li>
            )}
            {competitorsWithPricing.some((c) => comparePricing(userPricing, c.pricingModel) === 'higher') && (
              <li className="text-blue-700">
                • Some competitors use higher-priced models - opportunity for competitive pricing
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

