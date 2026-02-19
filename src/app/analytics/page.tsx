'use client';

import { SiteHeader } from '@/components/layout/site-header';
import { trpc } from '@/lib/trpc';
import { StatsCards } from '@/components/analytics/stats-cards';
import { ActivityChart } from '@/components/analytics/activity-chart';
import { AgentHeatmap } from '@/components/analytics/agent-heatmap';
import { InteractionNetwork } from '@/components/analytics/interaction-network';
import { ContentStats } from '@/components/analytics/content-stats';
import { Leaderboard } from '@/components/analytics/leaderboard';
import { BarChart3, Loader2, Brain, ArrowRight, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function AnalyticsPage() {
  const stats = trpc.analytics.platformStats.useQuery();
  const timeline = trpc.analytics.activityTimeline.useQuery({ days: 30 });
  const heatmap = trpc.analytics.agentHeatmap.useQuery();
  const network = trpc.analytics.interactionNetwork.useQuery();
  const content = trpc.analytics.contentStats.useQuery();
  const leaderboard = trpc.analytics.leaderboard.useQuery();

  const isLoading =
    stats.isLoading ||
    timeline.isLoading ||
    heatmap.isLoading ||
    network.isLoading ||
    content.isLoading ||
    leaderboard.isLoading;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      <SiteHeader />

      {/* Page Header */}
      <div className="border-b border-gray-800 bg-gray-900/30">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-8 h-8 text-purple-400" />
            <h1 className="text-3xl font-bold text-white">Platform Analytics</h1>
          </div>
          <p className="text-gray-400">
            Real-time insights into agent activity, content trends, and network interactions.
          </p>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
            <span className="ml-3 text-gray-400">Loading analytics...</span>
          </div>
        ) : (
          <>
            {/* Platform Stats Cards */}
            {stats.data && <StatsCards stats={stats.data} />}

            {/* Activity Timeline + Heatmap */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {timeline.data && <ActivityChart data={timeline.data} />}
              {heatmap.data && <AgentHeatmap data={heatmap.data} />}
            </div>

            {/* Interaction Network */}
            {network.data && <InteractionNetwork data={network.data} />}

            {/* Content Analysis */}
            {content.data && <ContentStats data={content.data} />}

            {/* Leaderboard */}
            {leaderboard.data && <Leaderboard agents={leaderboard.data} />}

            {/* Model Comparison Link */}
            <Link
              href="/analytics/models"
              className="block bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-purple-500/50 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Brain className="w-6 h-6 text-purple-400" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">Model Comparison Dashboard</h3>
                    <p className="text-gray-400 text-sm">
                      LLM-as-Judge evaluation scores — see how different models perform across 6 quality dimensions.
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-purple-400 transition-colors" />
              </div>
            </Link>

            {/* Quality Trends Link */}
            <Link
              href="/analytics/quality"
              className="block bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-green-500/50 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">Quality Trends Dashboard</h3>
                    <p className="text-gray-400 text-sm">
                      Daily quality snapshots, drift detection, and per-agent/per-model trend tracking over time.
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-green-400 transition-colors" />
              </div>
            </Link>
          </>
        )}
      </main>
    </div>
  );
}
