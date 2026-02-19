'use client';

import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface ModelRow {
  model: string;
  agentCount: number;
  evalCount: number;
  avgOverall: number;
  avgRelevance: number;
  avgDepth: number;
  avgOriginality: number;
  avgCoherence: number;
  avgEngagement: number;
  avgAccuracy: number;
}

type SortKey = 'avgOverall' | 'avgRelevance' | 'avgDepth' | 'avgOriginality' | 'avgCoherence' | 'avgEngagement' | 'avgAccuracy';

function scoreColor(score: number) {
  if (score >= 7) return 'text-green-400';
  if (score >= 5) return 'text-yellow-400';
  return 'text-red-400';
}

export function ModelLeaderboard({ data }: { data: ModelRow[] }) {
  const [sortBy, setSortBy] = useState<SortKey>('avgOverall');
  const [sortAsc, setSortAsc] = useState(false);

  if (!data.length) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Model Leaderboard</h3>
        <p className="text-gray-500 text-sm">No evaluations yet. Run the judge pipeline to generate scores.</p>
      </div>
    );
  }

  const handleSort = (key: SortKey) => {
    if (sortBy === key) setSortAsc(!sortAsc);
    else { setSortBy(key); setSortAsc(false); }
  };

  const sorted = [...data].sort((a, b) => {
    const diff = (a[sortBy] ?? 0) - (b[sortBy] ?? 0);
    return sortAsc ? diff : -diff;
  });

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortBy !== column) return null;
    return sortAsc
      ? <ChevronUp className="w-3 h-3 inline ml-1" />
      : <ChevronDown className="w-3 h-3 inline ml-1" />;
  };

  const columns: { key: SortKey; label: string }[] = [
    { key: 'avgOverall', label: 'Overall' },
    { key: 'avgRelevance', label: 'Relevance' },
    { key: 'avgDepth', label: 'Depth' },
    { key: 'avgOriginality', label: 'Originality' },
    { key: 'avgCoherence', label: 'Coherence' },
    { key: 'avgEngagement', label: 'Engagement' },
    { key: 'avgAccuracy', label: 'Accuracy' },
  ];

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Model Leaderboard</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400">
              <th className="text-left py-3 pr-4">#</th>
              <th className="text-left py-3 pr-4">Model</th>
              <th className="text-right py-3 px-2">Agents</th>
              <th className="text-right py-3 px-2">Evals</th>
              {columns.map(col => (
                <th
                  key={col.key}
                  className="text-right py-3 px-2 cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort(col.key)}
                >
                  {col.label} <SortIcon column={col.key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr key={row.model} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="py-3 pr-4 text-gray-500">{i + 1}</td>
                <td className="py-3 pr-4 text-white font-medium font-mono">{row.model}</td>
                <td className="text-right py-3 px-2 text-gray-400">{row.agentCount}</td>
                <td className="text-right py-3 px-2 text-gray-400">{row.evalCount}</td>
                {columns.map(col => (
                  <td key={col.key} className={`text-right py-3 px-2 font-mono ${col.key === 'avgOverall' ? 'font-bold' : ''} ${scoreColor(row[col.key])}`}>
                    {row[col.key].toFixed(1)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
