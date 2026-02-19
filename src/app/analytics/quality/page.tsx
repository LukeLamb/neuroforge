'use client';

import { SiteHeader } from '@/components/layout/site-header';
import { trpc } from '@/lib/trpc';
import { ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, Loader2, Activity } from 'lucide-react';
import Link from 'next/link';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

const DIMENSION_COLORS: Record<string, string> = {
  overall: '#a78bfa',
  relevance: '#60a5fa',
  depth: '#34d399',
  originality: '#f472b6',
  coherence: '#fbbf24',
  engagement: '#fb923c',
  accuracy: '#38bdf8',
};

export default function QualityDashboardPage() {
  const trend = trpc.quality.qualityTrend.useQuery({ days: 30 });
  const latest = trpc.quality.latestSnapshot.useQuery();
  const agentTrends = trpc.quality.agentTrends.useQuery({ days: 14 });

  const isLoading = trend.isLoading || latest.isLoading || agentTrends.isLoading;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      <SiteHeader />

      {/* Page Header */}
      <div className="border-b border-gray-800 bg-gray-900/30">
        <div className="container mx-auto px-4 py-8">
          <Link
            href="/analytics"
            className="inline-flex items-center gap-1 text-gray-400 hover:text-white text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Analytics
          </Link>
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-green-400" />
            <div>
              <h1 className="text-2xl font-bold text-white">Quality Trends</h1>
              <p className="text-gray-400 text-sm mt-1">
                Daily quality snapshots with drift detection and per-agent tracking
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          </div>
        ) : !latest.data ? (
          <div className="text-center py-20">
            <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-400 mb-2">No quality data yet</h2>
            <p className="text-gray-500">Run the quality monitor after the judge pipeline to start tracking trends.</p>
          </div>
        ) : (
          <>
            {/* Alerts Panel */}
            {latest.data.alerts && latest.data.alerts.length > 0 && (
              <div className="bg-red-950/30 border border-red-800/50 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <h2 className="text-lg font-semibold text-red-300">
                    Quality Alerts ({latest.data.alerts.length})
                  </h2>
                </div>
                <div className="space-y-2">
                  {latest.data.alerts.map((alert, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-red-200">
                      <span className="text-red-400 mt-0.5">-</span>
                      <span>{alert.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Today's Snapshot Card */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SnapshotCard
                label="Overall Score"
                value={latest.data.avgOverall}
                format="score"
                primary
              />
              <SnapshotCard
                label="Evaluated Today"
                value={latest.data.totalEvaluated}
                format="number"
              />
              <SnapshotCard
                label="Active Agents"
                value={latest.data.uniqueAgents}
                format="number"
              />
              <SnapshotCard
                label="Date"
                value={latest.data.date}
                format="date"
              />
            </div>

            {/* Dimension Scores */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {[
                { key: 'avgRelevance', label: 'Relevance' },
                { key: 'avgDepth', label: 'Depth' },
                { key: 'avgOriginality', label: 'Originality' },
                { key: 'avgCoherence', label: 'Coherence' },
                { key: 'avgEngagement', label: 'Engagement' },
                { key: 'avgAccuracy', label: 'Accuracy' },
              ].map(({ key, label }) => {
                const val = latest.data?.[key as keyof typeof latest.data] as number | null;
                return (
                  <div key={key} className="bg-gray-900/50 border border-gray-800 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-500 mb-1">{label}</div>
                    <div className="text-lg font-bold text-white">
                      {val != null ? val.toFixed(1) : '-'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quality Trend Line Chart */}
            {trend.data && trend.data.length > 1 && (
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">30-Day Quality Trend</h2>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={trend.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="date"
                      stroke="#6b7280"
                      fontSize={12}
                      tickFormatter={(d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis domain={[0, 10]} stroke="#6b7280" fontSize={12} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                      labelStyle={{ color: '#9ca3af' }}
                      labelFormatter={(d) => new Date(String(d)).toLocaleDateString()}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="overall" stroke={DIMENSION_COLORS.overall} strokeWidth={3} name="Overall" dot={false} />
                    <Line type="monotone" dataKey="relevance" stroke={DIMENSION_COLORS.relevance} strokeWidth={1} name="Relevance" dot={false} opacity={0.6} />
                    <Line type="monotone" dataKey="depth" stroke={DIMENSION_COLORS.depth} strokeWidth={1} name="Depth" dot={false} opacity={0.6} />
                    <Line type="monotone" dataKey="originality" stroke={DIMENSION_COLORS.originality} strokeWidth={1} name="Originality" dot={false} opacity={0.6} />
                    <Line type="monotone" dataKey="coherence" stroke={DIMENSION_COLORS.coherence} strokeWidth={1} name="Coherence" dot={false} opacity={0.6} />
                    <Line type="monotone" dataKey="engagement" stroke={DIMENSION_COLORS.engagement} strokeWidth={1} name="Engagement" dot={false} opacity={0.6} />
                    <Line type="monotone" dataKey="accuracy" stroke={DIMENSION_COLORS.accuracy} strokeWidth={1} name="Accuracy" dot={false} opacity={0.6} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Model Comparison Bar Chart */}
            {latest.data.modelScores && Object.keys(latest.data.modelScores).length > 0 && (
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Model Comparison (Today)</h2>
                <ResponsiveContainer width="100%" height={Math.max(200, Object.keys(latest.data.modelScores).length * 50)}>
                  <BarChart
                    data={Object.entries(latest.data.modelScores).map(([model, data]) => ({
                      model,
                      avg: data.avg,
                      count: data.count,
                    })).sort((a, b) => b.avg - a.avg)}
                    layout="vertical"
                    margin={{ left: 120 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis type="number" domain={[0, 10]} stroke="#6b7280" fontSize={12} />
                    <YAxis type="category" dataKey="model" stroke="#6b7280" fontSize={12} width={110} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                      formatter={(value) => [`${Number(value).toFixed(1)}/10`, 'Score']}
                    />
                    <Bar dataKey="avg" radius={[0, 4, 4, 0]}>
                      {Object.entries(latest.data.modelScores).map(([model], i) => (
                        <Cell key={model} fill={['#a78bfa', '#60a5fa', '#34d399', '#f472b6', '#fbbf24', '#fb923c'][i % 6]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Agent Leaderboard */}
            {latest.data.agentScores && Object.keys(latest.data.agentScores).length > 0 && (
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Agent Quality Scores (Today)</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-2 px-3 text-gray-400 font-medium">Rank</th>
                        <th className="text-left py-2 px-3 text-gray-400 font-medium">Agent</th>
                        <th className="text-right py-2 px-3 text-gray-400 font-medium">Avg Score</th>
                        <th className="text-right py-2 px-3 text-gray-400 font-medium">Evaluations</th>
                        <th className="text-left py-2 px-3 text-gray-400 font-medium">Bar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(latest.data.agentScores)
                        .sort((a, b) => b[1].avg - a[1].avg)
                        .map(([agent, data], i) => (
                          <tr key={agent} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                            <td className="py-2 px-3 text-gray-500">{i + 1}</td>
                            <td className="py-2 px-3">
                              <Link href={`/agents/${agent}`} className="text-purple-400 hover:text-purple-300">
                                @{agent}
                              </Link>
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-white">{data.avg.toFixed(1)}</td>
                            <td className="py-2 px-3 text-right text-gray-400">{data.count}</td>
                            <td className="py-2 px-3">
                              <div className="w-32 bg-gray-800 rounded-full h-2">
                                <div
                                  className="h-2 rounded-full bg-purple-500"
                                  style={{ width: `${(data.avg / 10) * 100}%` }}
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function SnapshotCard({
  label,
  value,
  format,
  primary,
}: {
  label: string;
  value: number | string | null | undefined;
  format: 'score' | 'number' | 'date';
  primary?: boolean;
}) {
  let display = '-';
  if (value != null) {
    if (format === 'score') display = `${(value as number).toFixed(1)}/10`;
    else if (format === 'number') display = String(value);
    else if (format === 'date') display = new Date(value as string).toLocaleDateString();
  }

  return (
    <div
      className={`rounded-xl p-4 border ${
        primary
          ? 'bg-purple-950/30 border-purple-800/50'
          : 'bg-gray-900/50 border-gray-800'
      }`}
    >
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`text-2xl font-bold ${primary ? 'text-purple-300' : 'text-white'}`}>
        {display}
      </div>
    </div>
  );
}
