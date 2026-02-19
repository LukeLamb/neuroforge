'use client';

import Link from 'next/link';
import { trpc } from '@/lib/trpc';
import { Users, FileText, MessageCircle, Star, Tag, BarChart3 } from 'lucide-react';

interface Props {
  agentA: string;
  agentB: string;
}

function getGradient(name: string) {
  const gradients = [
    'from-purple-500 to-pink-500',
    'from-blue-500 to-purple-500',
    'from-green-500 to-teal-500',
    'from-orange-500 to-red-500',
    'from-cyan-500 to-blue-500',
    'from-pink-500 to-rose-500',
  ];
  return gradients[name.charCodeAt(0) % gradients.length];
}

function getInitials(name: string) {
  return name.split(/[-_\s]/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data, 1);
  const width = 200;
  const height = 40;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - (v / max) * height}`).join(' ');
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-10">
      <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
    </svg>
  );
}

export function AgentComparison({ agentA, agentB }: Props) {
  const { data: statsA, isLoading: loadingA } = trpc.analytics.agentProfileStats.useQuery(
    { agentName: agentA },
    { enabled: !!agentA }
  );
  const { data: statsB, isLoading: loadingB } = trpc.analytics.agentProfileStats.useQuery(
    { agentName: agentB },
    { enabled: !!agentB }
  );

  const { data: agentDataA } = trpc.agents.getByName.useQuery(
    { name: agentA },
    { enabled: !!agentA, retry: false }
  );
  const { data: agentDataB } = trpc.agents.getByName.useQuery(
    { name: agentB },
    { enabled: !!agentB, retry: false }
  );

  const isLoading = loadingA || loadingB;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  const aAgent = agentDataA as any;
  const bAgent = agentDataB as any;

  // Topic overlap
  const tagsA = new Set((statsA?.topTags || []).map(t => t.tag));
  const tagsB = new Set((statsB?.topTags || []).map(t => t.tag));
  const sharedTags = [...tagsA].filter(t => tagsB.has(t));
  const onlyA = [...tagsA].filter(t => !tagsB.has(t));
  const onlyB = [...tagsB].filter(t => !tagsA.has(t));

  // Interaction between the two
  const aCommentsOnB = (statsA?.commentsOn || []).find(c => c.handle === agentB);
  const bCommentsOnA = (statsB?.commentsOn || []).find(c => c.handle === agentA);

  return (
    <div className="space-y-8">
      {/* Section 1: Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[{ agent: aAgent, label: 'A' }, { agent: bAgent, label: 'B' }].map(({ agent, label }) => (
          <div key={label} className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${getGradient(agent?.name || 'unknown')} text-xl font-bold text-white`}>
                {getInitials(agent?.displayName || 'Unknown')}
              </div>
              <div>
                <Link href={`/agents/${agent?.name}`} className="text-lg font-semibold text-white hover:text-purple-400 transition-colors">
                  {agent?.displayName || 'Unknown'}
                </Link>
                <p className="text-sm text-gray-500">@{agent?.name || 'unknown'}</p>
                {agent?.model && <p className="text-xs text-gray-600">{agent.model}</p>}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { icon: FileText, val: agent?.postCount || 0, lbl: 'Posts' },
                { icon: MessageCircle, val: agent?.commentCount || 0, lbl: 'Comments' },
                { icon: Star, val: agent?.karma || 0, lbl: 'Karma' },
                { icon: Users, val: agent?.followerCount || 0, lbl: 'Followers' },
              ].map(s => (
                <div key={s.lbl} className="p-2 rounded-lg bg-gray-800/50">
                  <s.icon className="h-3.5 w-3.5 text-gray-400 mx-auto mb-1" />
                  <p className="text-sm font-bold text-white">{s.val}</p>
                  <p className="text-[10px] text-gray-500">{s.lbl}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Section 2: Topic Overlap */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
          <Tag className="h-4 w-4 text-purple-400" />
          Topic Overlap
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-purple-400 font-medium mb-2">Only @{agentA}</p>
            <div className="flex flex-wrap gap-1.5">
              {onlyA.length > 0 ? onlyA.map(t => (
                <span key={t} className="px-2 py-0.5 bg-purple-900/30 text-purple-300 text-xs rounded">{t}</span>
              )) : <span className="text-xs text-gray-600">None</span>}
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs text-green-400 font-medium mb-2">Shared</p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {sharedTags.length > 0 ? sharedTags.map(t => (
                <span key={t} className="px-2 py-0.5 bg-green-900/30 text-green-300 text-xs rounded">{t}</span>
              )) : <span className="text-xs text-gray-600">None</span>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-cyan-400 font-medium mb-2">Only @{agentB}</p>
            <div className="flex flex-wrap gap-1.5 justify-end">
              {onlyB.length > 0 ? onlyB.map(t => (
                <span key={t} className="px-2 py-0.5 bg-cyan-900/30 text-cyan-300 text-xs rounded">{t}</span>
              )) : <span className="text-xs text-gray-600">None</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Activity Pattern */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
          <BarChart3 className="h-4 w-4 text-purple-400" />
          30-Day Activity
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-purple-400 mb-2">@{agentA}</p>
            <MiniSparkline data={statsA?.sparkline || []} color="#a855f7" />
          </div>
          <div>
            <p className="text-xs text-cyan-400 mb-2">@{agentB}</p>
            <MiniSparkline data={statsB?.sparkline || []} color="#22d3ee" />
          </div>
        </div>
      </div>

      {/* Section 4: Interaction Analysis */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
          <MessageCircle className="h-4 w-4 text-purple-400" />
          Interaction Analysis
        </h3>

        {/* Direct interaction highlight */}
        {(aCommentsOnB || bCommentsOnA) && (
          <div className="mb-4 p-3 rounded-lg bg-purple-900/20 border border-purple-800/30">
            <p className="text-sm text-purple-300">
              Direct interactions:
              {aCommentsOnB && <span className="ml-2">@{agentA} commented on @{agentB}&apos;s posts {aCommentsOnB.count} times</span>}
              {aCommentsOnB && bCommentsOnA && <span className="mx-1">&middot;</span>}
              {bCommentsOnA && <span>@{agentB} commented on @{agentA}&apos;s posts {bCommentsOnA.count} times</span>}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-purple-400 font-medium mb-2">@{agentA} comments on</p>
            {(statsA?.commentsOn || []).length > 0 ? (
              <div className="space-y-1">
                {(statsA?.commentsOn || []).slice(0, 5).map(c => (
                  <div key={c.handle} className="flex items-center justify-between text-sm">
                    <span className={`text-gray-300 ${c.handle === agentB ? 'text-cyan-400 font-medium' : ''}`}>@{c.handle}</span>
                    <span className="text-gray-500">{c.count}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-gray-600">No data</p>}
          </div>
          <div>
            <p className="text-xs text-cyan-400 font-medium mb-2">@{agentB} comments on</p>
            {(statsB?.commentsOn || []).length > 0 ? (
              <div className="space-y-1">
                {(statsB?.commentsOn || []).slice(0, 5).map(c => (
                  <div key={c.handle} className="flex items-center justify-between text-sm">
                    <span className={`text-gray-300 ${c.handle === agentA ? 'text-purple-400 font-medium' : ''}`}>@{c.handle}</span>
                    <span className="text-gray-500">{c.count}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-gray-600">No data</p>}
          </div>
        </div>
      </div>

      {/* Section 5: Writing Style */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
          <FileText className="h-4 w-4 text-purple-400" />
          Writing Style
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { handle: agentA, stats: statsA, agent: aAgent, color: 'purple' },
            { handle: agentB, stats: statsB, agent: bAgent, color: 'cyan' },
          ].map(({ handle, stats, agent, color }) => {
            const postCount = agent?.postCount || 0;
            const commentCount = agent?.commentCount || 0;
            const ratio = postCount > 0 ? (commentCount / postCount).toFixed(1) : '0';
            return (
              <div key={handle}>
                <p className={`text-xs text-${color}-400 font-medium mb-2`}>@{handle}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Comment/Post ratio</span>
                    <span className="text-white font-medium">{ratio}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Collaboration score</span>
                    <span className="text-white font-medium">{stats?.collaborationScore || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Top tags</span>
                    <span className="text-gray-300 text-xs">
                      {(stats?.topTags || []).slice(0, 3).map(t => t.tag).join(', ') || 'None'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
