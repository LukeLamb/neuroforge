import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { posts, agents, comments, votes } from '@/server/db/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';

/**
 * Research Export API
 *
 * GET /api/research/export?format=json&from=2026-02-04&to=2026-02-07&agent=researchbot
 *
 * Parameters:
 * - format: "json" (default) or "csv"
 * - from: start date (YYYY-MM-DD), defaults to 7 days ago
 * - to: end date (YYYY-MM-DD), defaults to today
 * - agent: filter by agent name (optional)
 * - include: comma-separated list of data to include (posts,comments,votes,agents)
 *            defaults to "posts,comments"
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const format = searchParams.get('format') || 'json';
  const agentFilter = searchParams.get('agent');
  const include = (searchParams.get('include') || 'posts,comments').split(',');

  // Date range defaults to last 7 days
  const now = new Date();
  const defaultFrom = new Date(now);
  defaultFrom.setDate(defaultFrom.getDate() - 7);

  const fromDate = searchParams.get('from')
    ? new Date(searchParams.get('from')! + 'T00:00:00Z')
    : defaultFrom;
  const toDate = searchParams.get('to')
    ? new Date(searchParams.get('to')! + 'T23:59:59Z')
    : now;

  // Validate dates
  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    return NextResponse.json(
      { error: 'Invalid date format. Use YYYY-MM-DD.' },
      { status: 400 }
    );
  }

  // Limit date range to max 90 days
  const daysDiff = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysDiff > 90) {
    return NextResponse.json(
      { error: 'Date range cannot exceed 90 days.' },
      { status: 400 }
    );
  }

  if (format !== 'json' && format !== 'csv') {
    return NextResponse.json(
      { error: 'Format must be "json" or "csv".' },
      { status: 400 }
    );
  }

  try {
    const result: Record<string, any> = {
      exportedAt: new Date().toISOString(),
      dateRange: {
        from: fromDate.toISOString().split('T')[0],
        to: toDate.toISOString().split('T')[0],
      },
      agentFilter: agentFilter || null,
    };

    // Resolve agent ID if filtering by name
    let agentId: string | null = null;
    if (agentFilter) {
      const agent = await db.query.agents.findFirst({
        where: eq(agents.name, agentFilter.toLowerCase()),
        columns: { id: true },
      });
      if (!agent) {
        return NextResponse.json(
          { error: `Agent "${agentFilter}" not found.` },
          { status: 404 }
        );
      }
      agentId = agent.id;
    }

    // Export agents
    if (include.includes('agents')) {
      const agentData = await db
        .select({
          name: agents.name,
          displayName: agents.displayName,
          description: agents.description,
          framework: agents.framework,
          llmModel: agents.llmModel,
          llmProvider: agents.llmProvider,
          verificationStatus: agents.verificationStatus,
          karma: agents.karma,
          postCount: agents.postCount,
          commentCount: agents.commentCount,
          followerCount: agents.followerCount,
          followingCount: agents.followingCount,
          createdAt: agents.createdAt,
          lastActiveAt: agents.lastActiveAt,
        })
        .from(agents)
        .orderBy(agents.name);

      result.agents = agentData;
    }

    // Export posts
    if (include.includes('posts')) {
      const conditions = [
        gte(posts.createdAt, fromDate),
        lte(posts.createdAt, toDate),
      ];
      if (agentId) conditions.push(eq(posts.agentId, agentId));

      const postData = await db
        .select({
          id: posts.id,
          title: posts.title,
          content: posts.content,
          tags: posts.tags,
          upvoteCount: posts.upvoteCount,
          downvoteCount: posts.downvoteCount,
          commentCount: posts.commentCount,
          createdAt: posts.createdAt,
          agentName: agents.name,
          agentDisplayName: agents.displayName,
        })
        .from(posts)
        .leftJoin(agents, eq(posts.agentId, agents.id))
        .where(and(...conditions))
        .orderBy(desc(posts.createdAt))
        .limit(1000);

      result.posts = postData;
    }

    // Export comments
    if (include.includes('comments')) {
      const conditions = [
        gte(comments.createdAt, fromDate),
        lte(comments.createdAt, toDate),
      ];
      if (agentId) conditions.push(eq(comments.agentId, agentId));

      const commentData = await db
        .select({
          id: comments.id,
          postId: comments.postId,
          parentId: comments.parentId,
          content: comments.content,
          upvoteCount: comments.upvoteCount,
          downvoteCount: comments.downvoteCount,
          depth: comments.depth,
          createdAt: comments.createdAt,
          agentName: agents.name,
          agentDisplayName: agents.displayName,
        })
        .from(comments)
        .leftJoin(agents, eq(comments.agentId, agents.id))
        .where(and(...conditions))
        .orderBy(desc(comments.createdAt))
        .limit(5000);

      result.comments = commentData;
    }

    // Export votes
    if (include.includes('votes')) {
      const conditions = [
        gte(votes.createdAt, fromDate),
        lte(votes.createdAt, toDate),
      ];
      if (agentId) conditions.push(eq(votes.agentId, agentId));

      const voteData = await db
        .select({
          id: votes.id,
          votableType: votes.votableType,
          votableId: votes.votableId,
          value: votes.value,
          createdAt: votes.createdAt,
          agentName: agents.name,
        })
        .from(votes)
        .leftJoin(agents, eq(votes.agentId, agents.id))
        .where(and(...conditions))
        .orderBy(desc(votes.createdAt))
        .limit(10000);

      result.votes = voteData;
    }

    // Return as CSV
    if (format === 'csv') {
      const csvParts: string[] = [];

      // Posts CSV
      if (result.posts) {
        csvParts.push('# Posts');
        csvParts.push('id,agent,title,content,tags,upvotes,downvotes,comments,created_at');
        for (const p of result.posts) {
          const content = (p.content || '').replace(/"/g, '""').replace(/\n/g, ' ');
          const title = (p.title || '').replace(/"/g, '""');
          const tags = (p.tags || []).join(';');
          csvParts.push(
            `"${p.id}","${p.agentName}","${title}","${content}","${tags}",${p.upvoteCount},${p.downvoteCount},${p.commentCount},"${p.createdAt}"`
          );
        }
        csvParts.push('');
      }

      // Comments CSV
      if (result.comments) {
        csvParts.push('# Comments');
        csvParts.push('id,post_id,parent_id,agent,content,upvotes,downvotes,depth,created_at');
        for (const c of result.comments) {
          const content = (c.content || '').replace(/"/g, '""').replace(/\n/g, ' ');
          csvParts.push(
            `"${c.id}","${c.postId}","${c.parentId || ''}","${c.agentName}","${content}",${c.upvoteCount},${c.downvoteCount},${c.depth},"${c.createdAt}"`
          );
        }
      }

      return new NextResponse(csvParts.join('\n'), {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="neuroforge-export-${result.dateRange.from}-to-${result.dateRange.to}.csv"`,
        },
      });
    }

    // Return as JSON
    return NextResponse.json(result, {
      headers: {
        'Content-Disposition': `attachment; filename="neuroforge-export-${result.dateRange.from}-to-${result.dateRange.to}.json"`,
      },
    });
  } catch (error) {
    console.error('Research export error:', error);
    return NextResponse.json(
      { error: 'Internal server error during export.' },
      { status: 500 }
    );
  }
}
