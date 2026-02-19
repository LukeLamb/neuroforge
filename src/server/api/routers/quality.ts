import { router, publicProcedure } from '../trpc';
import { db } from '@/server/db';
import { qualitySnapshots } from '@/server/db/schema';
import { desc, gte } from 'drizzle-orm';
import { z } from 'zod';

export const qualityRouter = router({
  /**
   * Get quality trend data — last N days of quality snapshots for line chart
   */
  qualityTrend: publicProcedure
    .input(
      z.object({
        days: z.number().min(1).max(90).default(30),
      })
    )
    .query(async ({ input }) => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - input.days);

      const snapshots = await db
        .select()
        .from(qualitySnapshots)
        .where(gte(qualitySnapshots.createdAt, cutoff))
        .orderBy(qualitySnapshots.date);

      return snapshots.map((s) => ({
        date: s.date,
        relevance: s.avgRelevance,
        depth: s.avgDepth,
        originality: s.avgOriginality,
        coherence: s.avgCoherence,
        engagement: s.avgEngagement,
        accuracy: s.avgAccuracy,
        overall: s.avgOverall,
        totalEvaluated: s.totalEvaluated,
        uniqueAgents: s.uniqueAgents,
        modelScores: s.modelScores as Record<string, { avg: number; count: number }> | null,
        agentScores: s.agentScores as Record<string, { avg: number; count: number }> | null,
        alerts: s.alerts as Array<{ type: string; message: string }> | null,
      }));
    }),

  /**
   * Get today's (or latest) snapshot with alerts
   */
  latestSnapshot: publicProcedure.query(async () => {
    const [latest] = await db
      .select()
      .from(qualitySnapshots)
      .orderBy(desc(qualitySnapshots.date))
      .limit(1);

    if (!latest) return null;

    return {
      date: latest.date,
      avgRelevance: latest.avgRelevance,
      avgDepth: latest.avgDepth,
      avgOriginality: latest.avgOriginality,
      avgCoherence: latest.avgCoherence,
      avgEngagement: latest.avgEngagement,
      avgAccuracy: latest.avgAccuracy,
      avgOverall: latest.avgOverall,
      totalEvaluated: latest.totalEvaluated,
      uniqueAgents: latest.uniqueAgents,
      modelScores: latest.modelScores as Record<string, { avg: number; count: number }> | null,
      agentScores: latest.agentScores as Record<string, { avg: number; count: number }> | null,
      alerts: latest.alerts as Array<{ type: string; dimension?: string; agent?: string; message: string; today?: number; rolling_avg?: number; drop?: number }> | null,
    };
  }),

  /**
   * Get per-agent quality trends over last N days
   */
  agentTrends: publicProcedure
    .input(
      z.object({
        days: z.number().min(1).max(30).default(14),
      })
    )
    .query(async ({ input }) => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - input.days);

      const snapshots = await db
        .select({
          date: qualitySnapshots.date,
          agentScores: qualitySnapshots.agentScores,
        })
        .from(qualitySnapshots)
        .where(gte(qualitySnapshots.createdAt, cutoff))
        .orderBy(qualitySnapshots.date);

      // Transform into per-agent time series
      const agentMap: Record<string, Array<{ date: string; avg: number; count: number }>> = {};

      for (const snap of snapshots) {
        const scores = snap.agentScores as Record<string, { avg: number; count: number }> | null;
        if (!scores) continue;

        for (const [agent, data] of Object.entries(scores)) {
          if (!agentMap[agent]) agentMap[agent] = [];
          agentMap[agent].push({
            date: snap.date,
            avg: data.avg,
            count: data.count,
          });
        }
      }

      return agentMap;
    }),
});
