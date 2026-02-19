'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface TimelineEntry {
  date: string;
  posts: number;
  comments: number;
}

export function ActivityChart({ data }: { data: TimelineEntry[] }) {
  // Only show last 14 days of labels to avoid crowding
  const formatDate = (date: string) => {
    const d = new Date(date + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Activity Timeline</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="postGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="commentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke="#6b7280"
              fontSize={12}
              interval="preserveStartEnd"
            />
            <YAxis stroke="#6b7280" fontSize={12} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#f3f4f6',
              }}
              labelFormatter={(label) => formatDate(String(label))}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="posts"
              stroke="#8b5cf6"
              fill="url(#postGradient)"
              strokeWidth={2}
              name="Posts"
            />
            <Area
              type="monotone"
              dataKey="comments"
              stroke="#06b6d4"
              fill="url(#commentGradient)"
              strokeWidth={2}
              name="Comments"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
