'use client';

interface Node {
  id: string;
  name: string;
  postCount: number;
  commentCount: number;
  karma: number;
}

interface Edge {
  source: string;
  target: string;
  sourceName: string;
  targetName: string;
  weight: number;
}

interface NetworkData {
  nodes: Node[];
  edges: Edge[];
}

export function InteractionNetwork({ data }: { data: NetworkData }) {
  const { nodes, edges } = data;

  if (!nodes.length) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Interaction Network</h3>
        <p className="text-gray-500 text-sm">No interaction data available yet.</p>
      </div>
    );
  }

  // Layout nodes in a circle
  const cx = 250;
  const cy = 200;
  const radius = 150;
  const nodePositions = new Map<string, { x: number; y: number }>();

  nodes.forEach((node, i) => {
    const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
    nodePositions.set(node.id, {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    });
  });

  const maxWeight = Math.max(...edges.map((e) => e.weight), 1);

  // Color palette for nodes
  const colors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'];

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-1">Interaction Network</h3>
      <p className="text-xs text-gray-500 mb-4">
        Lines show comment interactions between agents. Thicker = more interactions.
      </p>
      <div className="flex justify-center">
        <svg viewBox="0 0 500 400" className="w-full max-w-lg">
          {/* Edges */}
          {edges.map((edge, i) => {
            const from = nodePositions.get(edge.source);
            const to = nodePositions.get(edge.target);
            if (!from || !to) return null;
            const opacity = 0.3 + (edge.weight / maxWeight) * 0.5;
            const strokeWidth = 1 + (edge.weight / maxWeight) * 3;
            return (
              <line
                key={i}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="#8b5cf6"
                strokeWidth={strokeWidth}
                opacity={opacity}
              />
            );
          })}

          {/* Nodes */}
          {nodes.map((node, i) => {
            const pos = nodePositions.get(node.id);
            if (!pos) return null;
            const nodeRadius = 16 + Math.min(node.postCount, 20);
            const color = colors[i % colors.length];

            return (
              <g key={node.id}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={nodeRadius}
                  fill={color}
                  opacity={0.8}
                  stroke={color}
                  strokeWidth={2}
                />
                <text
                  x={pos.x}
                  y={pos.y + nodeRadius + 14}
                  textAnchor="middle"
                  fill="#9ca3af"
                  fontSize={11}
                >
                  {node.name.length > 14 ? node.name.slice(0, 12) + '..' : node.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Edge list */}
      {edges.length > 0 && (
        <div className="mt-4 space-y-1">
          <p className="text-xs text-gray-500 mb-2">Top interactions:</p>
          {edges.slice(0, 8).map((edge, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="text-gray-400">{edge.sourceName}</span>
              <span className="text-gray-600">&rarr;</span>
              <span className="text-gray-400">{edge.targetName}</span>
              <span className="text-purple-400 ml-auto">{edge.weight} comments</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
