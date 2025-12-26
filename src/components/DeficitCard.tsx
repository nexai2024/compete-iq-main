'use client';

interface DeficitCardProps {
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  affectedCompetitors: string[];
  recommendation: string;
}

const severityStyles = {
  critical: {
    bg: 'bg-[#dc2626]',
    text: 'text-white',
    label: 'Critical',
  },
  high: {
    bg: 'bg-[#ea580c]',
    text: 'text-white',
    label: 'High',
  },
  medium: {
    bg: 'bg-[#ca8a04]',
    text: 'text-white',
    label: 'Medium',
  },
  low: {
    bg: 'bg-[#64748b]',
    text: 'text-white',
    label: 'Low',
  },
};

export function DeficitCard({
  title,
  description,
  severity,
  affectedCompetitors,
  recommendation,
}: DeficitCardProps) {
  const severityStyle = severityStyles[severity];

  return (
    <div className="bg-white rounded-lg shadow-md border-l-4 border-red-600 p-5">
      {/* Header: Title + Severity Badge */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-base font-bold text-gray-900 flex-1 mr-2">{title}</h3>
        <span
          className={`${severityStyle.bg} ${severityStyle.text} px-3 py-1 rounded text-xs font-medium whitespace-nowrap`}
        >
          {severityStyle.label}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-700 mb-4">{description}</p>

      {/* Affected Competitors */}
      {affectedCompetitors.length > 0 && (
        <div className="mb-4">
          <span className="text-xs font-semibold text-gray-600 mr-2">Affected by:</span>
          <div className="inline-flex flex-wrap gap-2 mt-1">
            {affectedCompetitors.map((competitor, index) => (
              <span
                key={index}
                className="inline-block bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded"
              >
                {competitor}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recommendation */}
      <div className="bg-gray-100 rounded-md p-3">
        <p className="text-xs font-semibold text-gray-700 mb-1">Recommendation:</p>
        <p className="text-sm text-gray-800">{recommendation}</p>
      </div>
    </div>
  );
}
