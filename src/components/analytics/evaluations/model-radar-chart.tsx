'use client';

import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
} from 'recharts';

const MODEL_COLORS: Record<string, string> = {
  'llama3.1:8b': '#8b5cf6',
  'llama3.2': '#06b6d4',
  'mistral': '#10b981',
  'codellama': '#f59e0b',
};

const FALLBACK_COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

function getModelColor(model: string, idx: number): string {
  return MODEL_COLORS[model] ?? FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
}

type DimensionRow = Record<string, string | number>;

export function ModelRadarChart({ data }: { data: DimensionRow[] }) {
  if (!data.length) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Model Comparison</h3>
        <p className="text-gray-500 text-sm">No evaluations yet.</p>
      </div>
    );
  }

  // Extract model names from data keys (everything except 'dimension')
  const models = Object.keys(data[0] ?? {}).filter(k => k !== 'dimension');

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Model Comparison — Radar</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid stroke="#374151" />
            <PolarAngleAxis dataKey="dimension" stroke="#9ca3af" fontSize={12} />
            <PolarRadiusAxis angle={30} domain={[0, 10]} stroke="#4b5563" fontSize={10} />
            {models.map((model, idx) => (
              <Radar
                key={model}
                name={model}
                dataKey={model}
                stroke={getModelColor(model, idx)}
                fill={getModelColor(model, idx)}
                fillOpacity={0.15}
                strokeWidth={2}
              />
            ))}
            <Legend
              wrapperStyle={{ color: '#d1d5db', fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#f3f4f6',
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
