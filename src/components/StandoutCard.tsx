'use client';

interface StandoutCardProps {
  title: string;
  description: string;
  opportunityScore: number;
  recommendation: string;
}

function getOpportunityStyle(score: number) {
  if (score >= 0 && score <= 30) {
    return { bg: 'bg-gray-400', text: 'text-white', label: 'Low' };
  } else if (score >= 31 && score <= 60) {
    return { bg: 'bg-yellow-500', text: 'text-white', label: 'Medium' };
  } else {
    return { bg: 'bg-green-600', text: 'text-white', label: 'High' };
  }
}

export function StandoutCard({
  title,
  description,
  opportunityScore,
  recommendation,
}: StandoutCardProps) {
  const opportunityStyle = getOpportunityStyle(opportunityScore);

  return (
    <div className="bg-white rounded-lg shadow-md border-l-4 border-green-600 p-5">
      {/* Header: Title + Opportunity Score */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-base font-bold text-gray-900 flex-1 mr-2">{title}</h3>
        <div className="flex flex-col items-end">
          <span
            className={`${opportunityStyle.bg} ${opportunityStyle.text} px-3 py-1 rounded text-xs font-medium whitespace-nowrap mb-1`}
          >
            {opportunityStyle.label}
          </span>
          <span className="text-xs text-gray-600">{opportunityScore}/100</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-700 mb-4">{description}</p>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`${opportunityStyle.bg} h-2 rounded-full transition-all`}
            style={{ width: `${opportunityScore}%` }}
          ></div>
        </div>
      </div>

      {/* Recommendation */}
      <div className="bg-green-50 rounded-md p-3">
        <p className="text-xs font-semibold text-gray-700 mb-1">Recommendation:</p>
        <p className="text-sm text-gray-800">{recommendation}</p>
      </div>
    </div>
  );
}
