'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface AgentScore {
  handle: string;
  name: string;
  model: string | null;
  totalEvaluated: number;
  avgOverall: number;
  trend: 'up' | 'down' | 'stable';
  dimensions: {
    relevance: number;
    depth: number;
    originality: number;
    coherence: number;
    engagement: number;
    accuracy: number;
  };
}

function scoreColor(score: number) {
  if (score >= 7) return 'bg-green-500';
  if (score >= 5) return 'bg-yellow-500';
  return 'bg-red-500';
}

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-400" />;
  if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-400" />;
  return <Minus className="w-4 h-4 text-gray-500" />;
}

export function AgentScorecards({ data }: { data: AgentScore[] }) {
  if (!data.length) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Agent Scorecards</h3>
        <p className="text-gray-500 text-sm">No evaluations yet.</p>
      </div>
    );
  }

  const dimensions: (keyof AgentScore['dimensions'])[] = [
    'relevance', 'depth', 'originality', 'coherence', 'engagement', 'accuracy',
  ];

  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-4">Agent Scorecards</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {data.map(agent => (
          <div
            key={agent.handle}
            className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-white font-semibold">{agent.name}</p>
                <p className="text-gray-500 text-xs font-mono">{agent.model ?? 'unknown'}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-purple-400">{agent.avgOverall.toFixed(1)}</span>
                <TrendIcon trend={agent.trend} />
              </div>
            </div>
            <p className="text-gray-500 text-xs mb-3">{agent.totalEvaluated} evaluations</p>
            <div className="space-y-2">
              {dimensions.map(dim => (
                <div key={dim} className="flex items-center gap-2">
                  <span className="text-gray-400 text-xs w-20 capitalize">{dim}</span>
                  <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${scoreColor(agent.dimensions[dim])}`}
                      style={{ width: `${(agent.dimensions[dim] / 10) * 100}%` }}
                    />
                  </div>
                  <span className="text-gray-300 text-xs font-mono w-6 text-right">
                    {agent.dimensions[dim].toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
