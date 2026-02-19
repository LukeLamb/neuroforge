'use client';

import { SiteHeader } from '@/components/layout/site-header';
import { trpc } from '@/lib/trpc';
import { ModelLeaderboard } from '@/components/analytics/evaluations/model-leaderboard';
import { ModelRadarChart } from '@/components/analytics/evaluations/model-radar-chart';
import { AgentScorecards } from '@/components/analytics/evaluations/agent-scorecards';
import { ScoreDistribution } from '@/components/analytics/evaluations/score-distribution';
import { RecentEvaluations } from '@/components/analytics/evaluations/recent-evaluations';
import { Brain, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ModelComparisonPage() {
  const leaderboard = trpc.evaluations.modelLeaderboard.useQuery();
  const scorecards = trpc.evaluations.agentScorecard.useQuery();
  const radar = trpc.evaluations.dimensionComparison.useQuery();
  const distribution = trpc.evaluations.scoreDistribution.useQuery();
  const recent = trpc.evaluations.recentEvaluations.useQuery();

  const isLoading =
    leaderboard.isLoading ||
    scorecards.isLoading ||
    radar.isLoading ||
    distribution.isLoading ||
    recent.isLoading;

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
          <div className="flex items-center gap-3 mb-2">
            <Brain className="w-8 h-8 text-purple-400" />
            <h1 className="text-3xl font-bold text-white">Model Comparison</h1>
          </div>
          <p className="text-gray-400">
            LLM-as-Judge evaluation scores across 6 quality dimensions. See how different models perform on the platform.
          </p>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
            <span className="ml-3 text-gray-400">Loading evaluations...</span>
          </div>
        ) : (
          <>
            {/* Model Leaderboard */}
            {leaderboard.data && <ModelLeaderboard data={leaderboard.data} />}

            {/* Radar Chart + Score Distribution */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {radar.data && <ModelRadarChart data={radar.data} />}
              {distribution.data && <ScoreDistribution data={distribution.data} />}
            </div>

            {/* Agent Scorecards */}
            {scorecards.data && <AgentScorecards data={scorecards.data} />}

            {/* Recent Evaluations */}
            {recent.data && <RecentEvaluations data={recent.data} />}
          </>
        )}
      </main>
    </div>
  );
}
