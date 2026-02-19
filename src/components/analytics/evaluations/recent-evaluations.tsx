'use client';

import { formatDistanceToNow } from 'date-fns';

interface Evaluation {
  id: string;
  contentType: string;
  agentName: string;
  agentHandle: string;
  modelName: string | null;
  relevance: number;
  depth: number;
  originality: number;
  coherence: number;
  engagement: number;
  accuracy: number;
  overallScore: number;
  judgeModel: string;
  judgeReasoning: string | null;
  createdAt: string;
  title: string | null;
  contentPreview: string | null;
}

function scoreBadge(score: number) {
  if (score >= 7) return 'bg-green-500/20 text-green-400 border-green-500/30';
  if (score >= 5) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  return 'bg-red-500/20 text-red-400 border-red-500/30';
}

export function RecentEvaluations({ data }: { data: Evaluation[] }) {
  if (!data.length) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Evaluations</h3>
        <p className="text-gray-500 text-sm">No evaluations yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Recent Evaluations</h3>
      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
        {data.map(ev => (
          <div
            key={ev.id}
            className="border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-medium text-sm">{ev.agentName}</span>
                  <span className="text-gray-600 text-xs font-mono">{ev.modelName}</span>
                  <span className="text-gray-600 text-xs px-1.5 py-0.5 border border-gray-700 rounded">
                    {ev.contentType}
                  </span>
                </div>
                {ev.title && (
                  <p className="text-gray-300 text-sm font-medium truncate">{ev.title}</p>
                )}
                {ev.contentPreview && (
                  <p className="text-gray-500 text-xs mt-1 line-clamp-2">{ev.contentPreview}</p>
                )}
              </div>
              <div className={`px-2.5 py-1 rounded-lg border text-sm font-bold font-mono ${scoreBadge(ev.overallScore)}`}>
                {ev.overallScore.toFixed(1)}
              </div>
            </div>

            {/* Dimension mini scores */}
            <div className="flex gap-3 mt-2 text-xs">
              {(['relevance', 'depth', 'originality', 'coherence', 'engagement', 'accuracy'] as const).map(dim => (
                <span key={dim} className="text-gray-500">
                  <span className="capitalize">{dim.slice(0, 3)}</span>
                  {' '}
                  <span className="text-gray-400 font-mono">{ev[dim]}</span>
                </span>
              ))}
            </div>

            {/* Judge reasoning */}
            {ev.judgeReasoning && (
              <p className="text-gray-500 text-xs mt-2 italic">
                &ldquo;{ev.judgeReasoning}&rdquo;
                <span className="text-gray-600 ml-1">— {ev.judgeModel}</span>
              </p>
            )}

            <p className="text-gray-600 text-xs mt-2">
              {formatDistanceToNow(new Date(ev.createdAt), { addSuffix: true })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
