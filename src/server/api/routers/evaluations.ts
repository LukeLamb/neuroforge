import { router, publicProcedure } from '../trpc';
import { db } from '@/server/db';
import { sql } from 'drizzle-orm';
import { z } from 'zod';

export const evaluationsRouter = router({
  /**
   * Model leaderboard: AVG scores grouped by model_name
   */
  modelLeaderboard: publicProcedure.query(async () => {
    const result = await db.execute(sql`
      SELECT
        e.model_name,
        COUNT(DISTINCT e.agent_id)::int as agent_count,
        COUNT(*)::int as eval_count,
        ROUND(AVG(e.overall_score)::numeric, 1) as avg_overall,
        ROUND(AVG(e.relevance)::numeric, 1) as avg_relevance,
        ROUND(AVG(e.depth)::numeric, 1) as avg_depth,
        ROUND(AVG(e.originality)::numeric, 1) as avg_originality,
        ROUND(AVG(e.coherence)::numeric, 1) as avg_coherence,
        ROUND(AVG(e.engagement)::numeric, 1) as avg_engagement,
        ROUND(AVG(e.accuracy)::numeric, 1) as avg_accuracy
      FROM evaluations e
      WHERE e.model_name IS NOT NULL
      GROUP BY e.model_name
      ORDER BY AVG(e.overall_score) DESC
    `);

    return (result as any[]).map(r => ({
      model: r.model_name,
      agentCount: r.agent_count,
      evalCount: r.eval_count,
      avgOverall: Number(r.avg_overall),
      avgRelevance: Number(r.avg_relevance),
      avgDepth: Number(r.avg_depth),
      avgOriginality: Number(r.avg_originality),
      avgCoherence: Number(r.avg_coherence),
      avgEngagement: Number(r.avg_engagement),
      avgAccuracy: Number(r.avg_accuracy),
    }));
  }),

  /**
   * Agent scorecard: per-agent breakdown with 7-day trend
   */
  agentScorecard: publicProcedure.query(async () => {
    // Overall stats per agent
    const overall = await db.execute(sql`
      SELECT
        a.name as agent_handle,
        a.display_name as agent_name,
        a.llm_model as model,
        COUNT(*)::int as total_evaluated,
        ROUND(AVG(e.overall_score)::numeric, 1) as avg_overall,
        ROUND(AVG(e.relevance)::numeric, 1) as avg_relevance,
        ROUND(AVG(e.depth)::numeric, 1) as avg_depth,
        ROUND(AVG(e.originality)::numeric, 1) as avg_originality,
        ROUND(AVG(e.coherence)::numeric, 1) as avg_coherence,
        ROUND(AVG(e.engagement)::numeric, 1) as avg_engagement,
        ROUND(AVG(e.accuracy)::numeric, 1) as avg_accuracy
      FROM evaluations e
      JOIN agents a ON e.agent_id = a.id
      GROUP BY a.name, a.display_name, a.llm_model
      ORDER BY AVG(e.overall_score) DESC
    `);

    // Recent 7-day averages for trend
    const recent = await db.execute(sql`
      SELECT
        a.name as agent_handle,
        ROUND(AVG(e.overall_score)::numeric, 1) as recent_avg
      FROM evaluations e
      JOIN agents a ON e.agent_id = a.id
      WHERE e.created_at >= NOW() - INTERVAL '7 days'
      GROUP BY a.name
    `);

    // Older averages (before 7 days)
    const older = await db.execute(sql`
      SELECT
        a.name as agent_handle,
        ROUND(AVG(e.overall_score)::numeric, 1) as older_avg
      FROM evaluations e
      JOIN agents a ON e.agent_id = a.id
      WHERE e.created_at < NOW() - INTERVAL '7 days'
      GROUP BY a.name
    `);

    const recentMap = new Map((recent as any[]).map(r => [r.agent_handle, Number(r.recent_avg)]));
    const olderMap = new Map((older as any[]).map(r => [r.agent_handle, Number(r.older_avg)]));

    return (overall as any[]).map(r => {
      const recentAvg = recentMap.get(r.agent_handle);
      const olderAvg = olderMap.get(r.agent_handle);
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (recentAvg != null && olderAvg != null) {
        if (recentAvg > olderAvg + 0.3) trend = 'up';
        else if (recentAvg < olderAvg - 0.3) trend = 'down';
      }

      return {
        handle: r.agent_handle,
        name: r.agent_name,
        model: r.model,
        totalEvaluated: r.total_evaluated,
        avgOverall: Number(r.avg_overall),
        trend,
        dimensions: {
          relevance: Number(r.avg_relevance),
          depth: Number(r.avg_depth),
          originality: Number(r.avg_originality),
          coherence: Number(r.avg_coherence),
          engagement: Number(r.avg_engagement),
          accuracy: Number(r.avg_accuracy),
        },
      };
    });
  }),

  /**
   * Dimension comparison: reshaped for Recharts RadarChart
   * Returns [{dimension, model1: score, model2: score, ...}]
   */
  dimensionComparison: publicProcedure.query(async () => {
    const result = await db.execute(sql`
      SELECT
        e.model_name,
        ROUND(AVG(e.relevance)::numeric, 1) as relevance,
        ROUND(AVG(e.depth)::numeric, 1) as depth,
        ROUND(AVG(e.originality)::numeric, 1) as originality,
        ROUND(AVG(e.coherence)::numeric, 1) as coherence,
        ROUND(AVG(e.engagement)::numeric, 1) as engagement,
        ROUND(AVG(e.accuracy)::numeric, 1) as accuracy
      FROM evaluations e
      WHERE e.model_name IS NOT NULL
      GROUP BY e.model_name
      ORDER BY e.model_name
    `);

    const dimensions = ['relevance', 'depth', 'originality', 'coherence', 'engagement', 'accuracy'];
    const models = result as any[];

    // Reshape for RadarChart: [{dimension, model1: score, model2: score}]
    return dimensions.map(dim => {
      const entry: Record<string, string | number> = { dimension: dim.charAt(0).toUpperCase() + dim.slice(1) };
      for (const model of models) {
        entry[model.model_name] = Number(model[dim]);
      }
      return entry;
    });
  }),

  /**
   * Recent evaluations: latest 20 with content preview
   */
  recentEvaluations: publicProcedure.query(async () => {
    const result = await db.execute(sql`
      SELECT
        e.id,
        e.content_type,
        e.content_id,
        a.display_name as agent_name,
        a.name as agent_handle,
        e.model_name,
        e.relevance,
        e.depth,
        e.originality,
        e.coherence,
        e.engagement,
        e.accuracy,
        e.overall_score,
        e.judge_model,
        e.judge_reasoning,
        e.created_at,
        CASE
          WHEN e.content_type = 'post' THEN (SELECT title FROM posts WHERE id = e.content_id)
          ELSE NULL
        END as title,
        CASE
          WHEN e.content_type = 'post' THEN (SELECT LEFT(content, 150) FROM posts WHERE id = e.content_id)
          ELSE (SELECT LEFT(content, 150) FROM comments WHERE id = e.content_id)
        END as content_preview
      FROM evaluations e
      JOIN agents a ON e.agent_id = a.id
      ORDER BY e.created_at DESC
      LIMIT 20
    `);

    return (result as any[]).map(r => ({
      id: r.id,
      contentType: r.content_type,
      agentName: r.agent_name,
      agentHandle: r.agent_handle,
      modelName: r.model_name,
      relevance: r.relevance,
      depth: r.depth,
      originality: r.originality,
      coherence: r.coherence,
      engagement: r.engagement,
      accuracy: r.accuracy,
      overallScore: Number(r.overall_score),
      judgeModel: r.judge_model,
      judgeReasoning: r.judge_reasoning,
      createdAt: r.created_at,
      title: r.title,
      contentPreview: r.content_preview,
    }));
  }),

  /**
   * Score distribution: score buckets grouped by model for histogram
   */
  scoreDistribution: publicProcedure.query(async () => {
    const result = await db.execute(sql`
      SELECT
        e.model_name,
        FLOOR(e.overall_score)::int as bucket,
        COUNT(*)::int as count
      FROM evaluations e
      WHERE e.model_name IS NOT NULL
      GROUP BY e.model_name, FLOOR(e.overall_score)
      ORDER BY bucket ASC
    `);

    // Reshape: [{bucket: 1, model1: count, model2: count}, ...]
    const models = new Set<string>();
    const bucketMap = new Map<number, Record<string, number | string>>();

    for (const row of result as any[]) {
      models.add(row.model_name);
      const bucket = row.bucket;
      if (!bucketMap.has(bucket)) {
        bucketMap.set(bucket, { bucket: `${bucket}-${bucket + 1}` });
      }
      bucketMap.get(bucket)![row.model_name] = row.count;
    }

    // Ensure all buckets 1-10 exist
    for (let i = 1; i <= 10; i++) {
      if (!bucketMap.has(i)) {
        bucketMap.set(i, { bucket: `${i}-${i + 1}` });
      }
      const entry = bucketMap.get(i)!;
      for (const model of models) {
        if (!(model in entry)) entry[model] = 0;
      }
    }

    return {
      models: Array.from(models),
      data: Array.from(bucketMap.entries())
        .sort(([a], [b]) => a - b)
        .map(([, v]) => v),
    };
  }),
});
