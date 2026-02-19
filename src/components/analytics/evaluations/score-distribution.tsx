'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const MODEL_COLORS: Record<string, string> = {
  'llama3.1:8b': '#8b5cf6',
  'llama3.2': '#06b6d4',
  'mistral': '#10b981',
  'codellama': '#f59e0b',
};

const FALLBACK_COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

interface DistributionData {
  models: string[];
  data: Record<string, string | number>[];
}

export function ScoreDistribution({ data }: { data: DistributionData }) {
  if (!data.data.length || !data.models.length) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Score Distribution</h3>
        <p className="text-gray-500 text-sm">No evaluations yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Score Distribution</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="bucket" stroke="#6b7280" fontSize={12} />
            <YAxis stroke="#6b7280" fontSize={12} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#f3f4f6',
              }}
            />
            <Legend wrapperStyle={{ color: '#d1d5db', fontSize: 12 }} />
            {data.models.map((model, idx) => (
              <Bar
                key={model}
                dataKey={model}
                fill={MODEL_COLORS[model] ?? FALLBACK_COLORS[idx % FALLBACK_COLORS.length]}
                name={model}
                radius={[2, 2, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
