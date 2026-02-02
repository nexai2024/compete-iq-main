'use client';

import React, { useMemo } from 'react';
import type { FeatureMatrixScore, ComparisonParameter } from '@/types/database';

interface FeatureMatrixProps {
  userAppName: string;
  competitors: Array<{ id: string; name: string; type: 'direct' | 'indirect' }>;
  parameters: ComparisonParameter[];
  scores: FeatureMatrixScore[];
}

function getScoreStyle(score: number) {
  if (score >= 0 && score <= 3) {
    return { bg: 'bg-[#ef4444]', text: 'text-white' };
  } else if (score >= 4 && score <= 6) {
    return { bg: 'bg-[#eab308]', text: 'text-gray-900' };
  } else if (score >= 7 && score <= 8) {
    return { bg: 'bg-[#84cc16]', text: 'text-gray-900' };
  } else {
    return { bg: 'bg-[#22c55e]', text: 'text-white' };
  }
}

export function FeatureMatrix({
  userAppName,
  competitors,
  parameters,
  scores,
}: FeatureMatrixProps) {
  // Optimization: Pre-process scores into a lookup map for O(1) access instead of O(N) .find() in render loop
  const scoreMap = useMemo(() => {
    const map = new Map<string, number>();
    scores.forEach((s) => {
      // Create a unique key based on entity type and ID.
      // For user_app, we ignore the entityId to match the original lookup logic.
      const key = s.entityType === 'user_app'
        ? `user_app_${s.parameterId}`
        : `competitor_${s.entityId}_${s.parameterId}`;
      map.set(key, s.score);
    });
    return map;
  }, [scores]);

  // Find user app scores (entityType === 'user_app')
  const getUserScore = (parameterId: string): number | null => {
    return scoreMap.get(`user_app_${parameterId}`) ?? null;
  };

  // Find competitor scores
  const getCompetitorScore = (competitorId: string, parameterId: string): number | null => {
    return scoreMap.get(`competitor_${competitorId}_${parameterId}`) ?? null;
  };

  if (!parameters || parameters.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No comparison parameters available. Feature matrix is being generated.</p>
      </div>
    );
  }

  if (!scores || scores.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No scores available yet. Feature matrix is being generated.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="sticky left-0 z-10 bg-gray-50 border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-900">
              Entity
            </th>
            {parameters.map((param) => (
              <th
                key={param.id}
                className="border border-gray-300 px-3 py-2 text-center text-xs font-semibold text-gray-900 min-w-[80px]"
                title={param.parameterDescription ?? undefined}
              >
                <div className="writing-mode-vertical-rl">
                  {param.parameterName}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* User App Row */}
          <tr className="bg-blue-50">
            <td className="sticky left-0 z-10 bg-blue-50 border border-gray-300 px-4 py-3 font-bold text-gray-900">
              <div className="flex items-center">
                <span className="text-blue-600 mr-2">★</span>
                {userAppName}
                <span className="ml-2 text-xs text-blue-600">(Your App)</span>
              </div>
            </td>
            {parameters.map((param) => {
              const score = getUserScore(param.id);
              if (score === null) {
                return (
                  <td
                    key={param.id}
                    className="border border-gray-300 px-3 py-3 text-center text-gray-400"
                  >
                    N/A
                  </td>
                );
              }
              const style = getScoreStyle(score);
              return (
                <td key={param.id} className="border border-gray-300 px-3 py-3 text-center">
                  <span
                    className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${style.bg} ${style.text} font-semibold text-sm`}
                    title={`${param.parameterName}: ${score}/10`}
                  >
                    {score.toFixed(1)}
                  </span>
                </td>
              );
            })}
          </tr>

          {/* Competitor Rows */}
          {competitors.map((competitor) => (
            <tr key={competitor.id} className="bg-white hover:bg-gray-50">
              <td className="sticky left-0 z-10 bg-white hover:bg-gray-50 border border-gray-300 px-4 py-3 text-gray-900">
                {competitor.name}
              </td>
              {parameters.map((param) => {
                const score = getCompetitorScore(competitor.id, param.id);
                if (score === null) {
                  return (
                    <td
                      key={param.id}
                      className="border border-gray-300 px-3 py-3 text-center text-gray-400"
                    >
                      N/A
                    </td>
                  );
                }
                const style = getScoreStyle(score);
                return (
                  <td key={param.id} className="border border-gray-300 px-3 py-3 text-center">
                    <span
                      className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${style.bg} ${style.text} font-semibold text-sm`}
                      title={`${param.parameterName}: ${score}/10`}
                    >
                      {score.toFixed(1)}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
