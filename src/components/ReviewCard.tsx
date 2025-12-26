'use client';

import { Star } from 'lucide-react';

interface ReviewCardProps {
  reviewerName: string;
  reviewerProfile: string;
  rating: number;
  reviewText: string;
  sentiment: 'positive' | 'mixed' | 'negative';
  highlightedFeatures: string[];
  painPointsAddressed: string[];
}

const sentimentStyles = {
  positive: {
    bg: 'bg-[#22c55e]',
    text: 'text-white',
    label: 'Positive',
  },
  mixed: {
    bg: 'bg-[#eab308]',
    text: 'text-white',
    label: 'Mixed',
  },
  negative: {
    bg: 'bg-[#ef4444]',
    text: 'text-white',
    label: 'Negative',
  },
};

export function ReviewCard({
  reviewerName,
  reviewerProfile,
  rating,
  reviewText,
  sentiment,
  highlightedFeatures,
  painPointsAddressed,
}: ReviewCardProps) {
  const sentimentStyle = sentimentStyles[sentiment];

  // Render star rating
  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-4 h-4 ${
            i <= rating ? 'fill-[#eab308] text-[#eab308]' : 'fill-[#d1d5db] text-[#d1d5db]'
          }`}
        />
      );
    }
    return stars;
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5">
      {/* Header: Reviewer name + star rating */}
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-gray-900">{reviewerName}</h4>
        <div className="flex items-center gap-1">
          {renderStars()}
          <span className="ml-1 text-sm text-gray-600">{rating}/5</span>
        </div>
      </div>

      {/* Reviewer profile */}
      <p className="text-xs text-gray-500 italic mb-3">{reviewerProfile}</p>

      {/* Review text */}
      <p className="text-sm text-gray-700 mb-4 leading-relaxed">{reviewText}</p>

      {/* Tags section */}
      {highlightedFeatures.length > 0 && (
        <div className="mb-3">
          <span className="text-xs font-semibold text-gray-600 mr-2">Loves:</span>
          <div className="inline-flex flex-wrap gap-1">
            {highlightedFeatures.slice(0, 3).map((feature, index) => (
              <span
                key={index}
                className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded"
              >
                {feature}
              </span>
            ))}
            {highlightedFeatures.length > 3 && (
              <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                +{highlightedFeatures.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {painPointsAddressed.length > 0 && (
        <div className="mb-3">
          <span className="text-xs font-semibold text-gray-600 mr-2">Solves:</span>
          <div className="inline-flex flex-wrap gap-1">
            {painPointsAddressed.slice(0, 3).map((painPoint, index) => (
              <span
                key={index}
                className="inline-block bg-green-100 text-green-700 text-xs px-2 py-1 rounded"
              >
                {painPoint}
              </span>
            ))}
            {painPointsAddressed.length > 3 && (
              <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                +{painPointsAddressed.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Sentiment badge */}
      <div className="flex justify-end">
        <span
          className={`${sentimentStyle.bg} ${sentimentStyle.text} px-3 py-1 rounded-full text-xs font-medium`}
        >
          {sentimentStyle.label}
        </span>
      </div>
    </div>
  );
}
