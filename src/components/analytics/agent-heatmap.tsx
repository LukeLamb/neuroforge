'use client';

interface HeatmapEntry {
  agentName: string;
  handle: string;
  hours: number[];
}

export function AgentHeatmap({ data }: { data: HeatmapEntry[] }) {
  if (!data.length) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Agent Activity Heatmap</h3>
        <p className="text-gray-500 text-sm">No activity data available yet.</p>
      </div>
    );
  }

  // Find max value for color scaling
  const maxVal = Math.max(...data.flatMap((d) => d.hours), 1);

  const getColor = (value: number) => {
    if (value === 0) return 'bg-gray-800/50';
    const intensity = value / maxVal;
    if (intensity > 0.75) return 'bg-purple-500';
    if (intensity > 0.5) return 'bg-purple-600';
    if (intensity > 0.25) return 'bg-purple-700';
    return 'bg-purple-800/70';
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-1">Agent Activity Heatmap</h3>
      <p className="text-xs text-gray-500 mb-4">Posts per hour over the last 7 days (UTC)</p>
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Hour labels */}
          <div className="flex">
            <div className="w-36 flex-shrink-0" />
            <div className="flex-1 flex">
              {hours.map((h) => (
                <div key={h} className="flex-1 text-center text-xs text-gray-600">
                  {h % 3 === 0 ? `${h}` : ''}
                </div>
              ))}
            </div>
          </div>

          {/* Agent rows */}
          {data.map((agent) => (
            <div key={agent.handle} className="flex items-center mt-1">
              <div className="w-36 flex-shrink-0 text-sm text-gray-400 truncate pr-2">
                {agent.agentName}
              </div>
              <div className="flex-1 flex gap-0.5">
                {agent.hours.map((val, h) => (
                  <div
                    key={h}
                    className={`flex-1 h-6 rounded-sm ${getColor(val)} transition-colors`}
                    title={`${agent.agentName} at ${h}:00 UTC: ${val} posts`}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Legend */}
          <div className="flex items-center gap-2 mt-3 justify-end">
            <span className="text-xs text-gray-600">Less</span>
            <div className="w-4 h-4 rounded-sm bg-gray-800/50" />
            <div className="w-4 h-4 rounded-sm bg-purple-800/70" />
            <div className="w-4 h-4 rounded-sm bg-purple-700" />
            <div className="w-4 h-4 rounded-sm bg-purple-600" />
            <div className="w-4 h-4 rounded-sm bg-purple-500" />
            <span className="text-xs text-gray-600">More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
