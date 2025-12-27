'use client';

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';

interface PositioningMapProps {
  userAppName: string;
  positioningData: Array<{
    id: string;
    entityType: 'user_app' | 'competitor';
    entityName: string;
    valueScore: number;
    complexityScore: number;
    quadrant: string;
    competitorType?: 'direct' | 'indirect';
  }>;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      entityName: string;
      valueScore: number;
      complexityScore: number;
      quadrant?: string | null;
    };
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
        <p className="font-semibold text-gray-900">{data.entityName}</p>
        <p className="text-sm text-gray-600">Value Score: {data.valueScore.toFixed(1)}/10</p>
        <p className="text-sm text-gray-600">
          Complexity Score: {data.complexityScore.toFixed(1)}/10
        </p>
        <p className="text-sm text-gray-500 italic">{data.quadrant}</p>
      </div>
    );
  }
  return null;
}

export function PositioningMap({ positioningData }: PositioningMapProps) {
  if (!positioningData || positioningData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Positioning data is being generated. Please check back shortly.</p>
      </div>
    );
  }

  // Split data by type
  const userAppData = positioningData.filter((d) => d.entityType === 'user_app');
  const directCompetitorData = positioningData.filter(
    (d) => d.entityType === 'competitor' && d.competitorType === 'direct'
  );
  const indirectCompetitorData = positioningData.filter(
    (d) => d.entityType === 'competitor' && d.competitorType === 'indirect'
  );

  // If no data points, show message
  if (userAppData.length === 0 && directCompetitorData.length === 0 && indirectCompetitorData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No positioning data available yet.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={600}>
        <ScatterChart margin={{ top: 40, right: 40, bottom: 60, left: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="complexityScore"
            name="Complexity"
            domain={[0, 10]}
            label={{
              value: 'Complexity Score',
              position: 'bottom',
              offset: 20,
              style: { fontSize: 14, fontWeight: 600 },
            }}
            ticks={[0, 2, 4, 6, 8, 10]}
          />
          <YAxis
            type="number"
            dataKey="valueScore"
            name="Value"
            domain={[0, 10]}
            label={{
              value: 'Value Score',
              angle: -90,
              position: 'left',
              offset: 20,
              style: { fontSize: 14, fontWeight: 600 },
            }}
            ticks={[0, 2, 4, 6, 8, 10]}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Quadrant dividing lines */}
          <ReferenceLine x={5} stroke="#9ca3af" strokeWidth={2} />
          <ReferenceLine y={5} stroke="#9ca3af" strokeWidth={2} />

          {/* Scatter plots */}
          <Scatter name="Your App" data={userAppData} fill="#3b82f6">
            {userAppData.map((entry) => (
              <Cell key={entry.id} r={12} />
            ))}
          </Scatter>
          <Scatter name="Direct Competitors" data={directCompetitorData} fill="#f97316">
            {directCompetitorData.map((entry) => (
              <Cell key={entry.id} fill="#f97316" r={8} />
            ))}
          </Scatter>
          <Scatter name="Indirect Competitors" data={indirectCompetitorData} fill="#a855f7">
            {indirectCompetitorData.map((entry) => (
              <Cell key={entry.id} r={8} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-[#3b82f6] mr-2"></div>
          <span className="text-sm text-gray-700">Your App</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-[#f97316] mr-2"></div>
          <span className="text-sm text-gray-700">Direct Competitors</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded-full bg-[#a855f7] mr-2"></div>
          <span className="text-sm text-gray-700">Indirect Competitors</span>
        </div>
      </div>

      {/* Quadrant Labels */}
      <div className="relative w-full h-12 mt-2">
        <div className="absolute top-0 left-4 text-xs text-gray-500">
          Basic / Commodity
        </div>
        <div className="absolute top-0 right-4 text-xs text-gray-500">
          Overengineered
        </div>
        <div className="absolute bottom-0 left-4 text-xs text-gray-500">
          High Value / Simple
        </div>
        <div className="absolute bottom-0 right-4 text-xs text-gray-500">
          Premium / Feature-Rich
        </div>
      </div>
    </div>
  );
}
