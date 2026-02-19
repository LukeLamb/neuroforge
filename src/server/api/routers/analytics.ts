import { router, publicProcedure } from '../trpc';
import { db } from '@/server/db';
import { posts, agents, comments, votes, follows } from '@/server/db/schema';
import { sql, eq, desc, and, gte, count } from 'drizzle-orm';
import { z } from 'zod';

export const analyticsRouter = router({
  /**
   * Platform-level stats: total agents, posts, comments, today's interactions
   */
  platformStats: publicProcedure.query(async () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [agentCount] = await db
      .select({ count: count() })
      .from(agents);

    const [postCount] = await db
      .select({ count: count() })
      .from(posts);

    const [commentCount] = await db
      .select({ count: count() })
      .from(comments);

    const [voteCount] = await db
      .select({ count: count() })
      .from(votes);

    // Today's activity
    const [postsToday] = await db
      .select({ count: count() })
      .from(posts)
      .where(gte(posts.createdAt, todayStart));

    const [commentsToday] = await db
      .select({ count: count() })
      .from(comments)
      .where(gte(comments.createdAt, todayStart));

    const [votesToday] = await db
      .select({ count: count() })
      .from(votes)
      .where(gte(votes.createdAt, todayStart));

    const totalAgents = agentCount?.count ?? 0;
    const totalPosts = postCount?.count ?? 0;

    return {
      totalAgents,
      totalPosts,
      totalComments: commentCount?.count ?? 0,
      totalVotes: voteCount?.count ?? 0,
      interactionsToday: (postsToday?.count ?? 0) + (commentsToday?.count ?? 0) + (votesToday?.count ?? 0),
      postsToday: postsToday?.count ?? 0,
      commentsToday: commentsToday?.count ?? 0,
      votesToday: votesToday?.count ?? 0,
      avgPostsPerAgent: totalAgents > 0 ? Math.round((Number(totalPosts) / Number(totalAgents)) * 10) / 10 : 0,
    };
  }),

  /**
   * Activity timeline: daily posts and comments for the last 30 days
   */
  activityTimeline: publicProcedure
    .input(
      z.object({
        days: z.number().min(1).max(90).default(30),
      }).optional()
    )
    .query(async ({ input }) => {
      const days = input?.days ?? 30;

      const postsPerDay = await db.execute(sql`
        SELECT
          DATE(created_at AT TIME ZONE 'UTC') as date,
          COUNT(*)::int as count
        FROM posts
        WHERE created_at >= NOW() - INTERVAL '1 day' * ${days}
        GROUP BY DATE(created_at AT TIME ZONE 'UTC')
        ORDER BY date ASC
      `);

      const commentsPerDay = await db.execute(sql`
        SELECT
          DATE(created_at AT TIME ZONE 'UTC') as date,
          COUNT(*)::int as count
        FROM comments
        WHERE created_at >= NOW() - INTERVAL '1 day' * ${days}
        GROUP BY DATE(created_at AT TIME ZONE 'UTC')
        ORDER BY date ASC
      `);

      // Merge into a single timeline
      const dateMap = new Map<string, { date: string; posts: number; comments: number }>();

      // Fill in all dates in range
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0]!;
        dateMap.set(key, { date: key, posts: 0, comments: 0 });
      }

      for (const row of postsPerDay as any[]) {
        const key = typeof row.date === 'string' ? row.date : new Date(row.date).toISOString().split('T')[0]!;
        const entry = dateMap.get(key);
        if (entry) entry.posts = Number(row.count);
      }

      for (const row of commentsPerDay as any[]) {
        const key = typeof row.date === 'string' ? row.date : new Date(row.date).toISOString().split('T')[0]!;
        const entry = dateMap.get(key);
        if (entry) entry.comments = Number(row.count);
      }

      return Array.from(dateMap.values());
    }),

  /**
   * Agent activity heatmap: hourly activity per agent
   */
  agentHeatmap: publicProcedure.query(async () => {
    const result = await db.execute(sql`
      SELECT
        a.display_name as agent_name,
        a.name as agent_handle,
        EXTRACT(HOUR FROM p.created_at AT TIME ZONE 'UTC')::int as hour,
        COUNT(*)::int as count
      FROM posts p
      JOIN agents a ON p.agent_id = a.id
      WHERE p.created_at >= NOW() - INTERVAL '7 days'
      GROUP BY a.display_name, a.name, EXTRACT(HOUR FROM p.created_at AT TIME ZONE 'UTC')
      ORDER BY a.display_name, hour
    `);

    // Group by agent
    const agentMap = new Map<string, { agentName: string; handle: string; hours: number[] }>();

    for (const row of result as any[]) {
      if (!agentMap.has(row.agent_handle)) {
        agentMap.set(row.agent_handle, {
          agentName: row.agent_name,
          handle: row.agent_handle,
          hours: new Array(24).fill(0),
        });
      }
      const agent = agentMap.get(row.agent_handle)!;
      agent.hours[row.hour] = Number(row.count);
    }

    return Array.from(agentMap.values());
  }),

  /**
   * Interaction network: who comments on whose posts
   */
  interactionNetwork: publicProcedure.query(async () => {
    // Get comment-based interactions
    const interactions = await db.execute(sql`
      SELECT
        commenter.name as source,
        commenter.display_name as source_name,
        poster.name as target,
        poster.display_name as target_name,
        COUNT(*)::int as weight
      FROM comments c
      JOIN agents commenter ON c.agent_id = commenter.id
      JOIN posts p ON c.post_id = p.id
      JOIN agents poster ON p.agent_id = poster.id
      WHERE commenter.id != poster.id
      GROUP BY commenter.name, commenter.display_name, poster.name, poster.display_name
      ORDER BY weight DESC
    `);

    // Get all agents as nodes
    const agentNodes = await db
      .select({
        name: agents.name,
        displayName: agents.displayName,
        postCount: agents.postCount,
        commentCount: agents.commentCount,
        karma: agents.karma,
      })
      .from(agents)
      .orderBy(agents.displayName);

    const nodes = agentNodes.map(a => ({
      id: a.name,
      name: a.displayName,
      postCount: a.postCount,
      commentCount: a.commentCount,
      karma: a.karma,
    }));

    const edges = (interactions as any[]).map(row => ({
      source: row.source,
      target: row.target,
      sourceName: row.source_name,
      targetName: row.target_name,
      weight: row.weight,
    }));

    return { nodes, edges };
  }),

  /**
   * Content stats: tag frequencies, avg post length, comment-to-post ratio
   */
  contentStats: publicProcedure.query(async () => {
    // Tag frequencies
    const tagResult = await db.execute(sql`
      SELECT tag, COUNT(*)::int as count
      FROM posts, UNNEST(tags) as tag
      WHERE tags IS NOT NULL
      GROUP BY tag
      ORDER BY count DESC
      LIMIT 20
    `);

    // Average post length per agent
    const postLengths = await db.execute(sql`
      SELECT
        a.display_name as agent_name,
        a.name as agent_handle,
        ROUND(AVG(LENGTH(COALESCE(p.content, ''))))::int as avg_length,
        COUNT(*)::int as post_count
      FROM posts p
      JOIN agents a ON p.agent_id = a.id
      GROUP BY a.display_name, a.name
      ORDER BY avg_length DESC
    `);

    // Comment-to-post ratio per agent
    const ratios = await db.execute(sql`
      SELECT
        a.display_name as agent_name,
        a.name as agent_handle,
        a.post_count,
        a.comment_count,
        CASE WHEN a.post_count > 0
          THEN ROUND(a.comment_count::numeric / a.post_count, 2)
          ELSE 0
        END as ratio
      FROM agents a
      ORDER BY ratio DESC
    `);

    return {
      topTags: (tagResult as any[]).map(r => ({ tag: r.tag, count: r.count })),
      postLengths: (postLengths as any[]).map(r => ({
        agentName: r.agent_name,
        handle: r.agent_handle,
        avgLength: r.avg_length,
        postCount: r.post_count,
      })),
      commentToPostRatio: (ratios as any[]).map(r => ({
        agentName: r.agent_name,
        handle: r.agent_handle,
        postCount: r.post_count,
        commentCount: r.comment_count,
        ratio: Number(r.ratio),
      })),
    };
  }),

  /**
   * Agent profile stats: top tags, interactions, top posts for a specific agent
   */
  agentProfileStats: publicProcedure
    .input(z.object({ agentName: z.string() }))
    .query(async ({ input }) => {
      // Look up agent
      const agent = await db.query.agents.findFirst({
        where: eq(agents.name, input.agentName),
        columns: { id: true, name: true },
      });

      if (!agent) return null;

      // Top tags used by this agent
      const topTags = await db.execute(sql`
        SELECT tag, COUNT(*)::int as count
        FROM posts, UNNEST(tags) as tag
        WHERE agent_id = ${agent.id} AND tags IS NOT NULL
        GROUP BY tag
        ORDER BY count DESC
        LIMIT 8
      `);

      // Top posts by upvotes
      const topPosts = await db.execute(sql`
        SELECT id, title, upvote_count, comment_count, created_at
        FROM posts
        WHERE agent_id = ${agent.id}
        ORDER BY upvote_count DESC
        LIMIT 5
      `);

      // Who this agent comments on most
      const commentsOn = await db.execute(sql`
        SELECT
          a.name as agent_handle,
          a.display_name as agent_name,
          COUNT(*)::int as count
        FROM comments c
        JOIN posts p ON c.post_id = p.id
        JOIN agents a ON p.agent_id = a.id
        WHERE c.agent_id = ${agent.id} AND p.agent_id != ${agent.id}
        GROUP BY a.name, a.display_name
        ORDER BY count DESC
        LIMIT 5
      `);

      // Who comments on this agent's posts most
      const commentedBy = await db.execute(sql`
        SELECT
          a.name as agent_handle,
          a.display_name as agent_name,
          COUNT(*)::int as count
        FROM comments c
        JOIN agents a ON c.agent_id = a.id
        WHERE c.post_id IN (SELECT id FROM posts WHERE agent_id = ${agent.id})
          AND c.agent_id != ${agent.id}
        GROUP BY a.name, a.display_name
        ORDER BY count DESC
        LIMIT 5
      `);

      // Daily post counts for the last 30 days (for sparkline)
      const dailyActivity = await db.execute(sql`
        SELECT
          DATE(created_at AT TIME ZONE 'UTC') as date,
          COUNT(*)::int as count
        FROM posts
        WHERE agent_id = ${agent.id}
          AND created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at AT TIME ZONE 'UTC')
        ORDER BY date ASC
      `);

      // Build 30-day sparkline data
      const sparkline: number[] = [];
      const dateMap = new Map<string, number>();
      for (const row of dailyActivity as any[]) {
        const key = typeof row.date === 'string' ? row.date : new Date(row.date).toISOString().split('T')[0]!;
        dateMap.set(key, Number(row.count));
      }
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0]!;
        sparkline.push(dateMap.get(key) ?? 0);
      }

      // Collaboration score: comments made / posts made
      const totalComments = (commentsOn as any[]).reduce((acc: number, r: any) => acc + r.count, 0);

      return {
        topTags: (topTags as any[]).map(r => ({ tag: r.tag, count: r.count })),
        topPosts: (topPosts as any[]).map(r => ({
          id: r.id,
          title: r.title,
          upvoteCount: r.upvote_count,
          commentCount: r.comment_count,
          createdAt: r.created_at,
        })),
        commentsOn: (commentsOn as any[]).map(r => ({
          handle: r.agent_handle,
          name: r.agent_name,
          count: r.count,
        })),
        commentedBy: (commentedBy as any[]).map(r => ({
          handle: r.agent_handle,
          name: r.agent_name,
          count: r.count,
        })),
        sparkline,
        collaborationScore: totalComments,
      };
    }),

  /**
   * Agent leaderboard: sortable rankings
   */
  leaderboard: publicProcedure.query(async () => {
    const result = await db
      .select({
        name: agents.name,
        displayName: agents.displayName,
        avatarUrl: agents.avatarUrl,
        verificationStatus: agents.verificationStatus,
        framework: agents.framework,
        karma: agents.karma,
        postCount: agents.postCount,
        commentCount: agents.commentCount,
        followerCount: agents.followerCount,
        followingCount: agents.followingCount,
        lastActiveAt: agents.lastActiveAt,
        createdAt: agents.createdAt,
      })
      .from(agents)
      .orderBy(desc(agents.karma));

    return result;
  }),

  /**
   * Trending topics: most discussed tags in the last 48 hours, weighted by engagement
   */
  trendingTopics: publicProcedure.query(async () => {
    const result = await db.execute(sql`
      SELECT
        tag,
        COUNT(DISTINCT p.id)::int as post_count,
        COALESCE(SUM(p.comment_count), 0)::int as total_comments,
        COALESCE(SUM(p.upvote_count), 0)::int as total_upvotes,
        COUNT(DISTINCT p.agent_id)::int as unique_agents
      FROM posts p, UNNEST(p.tags) as tag
      WHERE p.created_at >= NOW() - INTERVAL '48 hours'
        AND p.tags IS NOT NULL
      GROUP BY tag
      ORDER BY (COUNT(DISTINCT p.id) * 2 + COALESCE(SUM(p.comment_count), 0) * 3 + COALESCE(SUM(p.upvote_count), 0)) DESC
      LIMIT 10
    `);

    return (result as any[]).map(r => ({
      tag: r.tag,
      postCount: r.post_count,
      totalComments: r.total_comments,
      totalUpvotes: r.total_upvotes,
      uniqueAgents: r.unique_agents,
      score: r.post_count * 2 + r.total_comments * 3 + r.total_upvotes,
    }));
  }),
});
