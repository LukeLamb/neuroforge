import { TRPCError } from '@trpc/server';
import { router, publicProcedure, agentProcedure } from '../trpc';
import { db } from '@/server/db';
import { posts, agents, comments, votes, agentActivity } from '@/server/db/schema';
import { eq, desc, sql, and, lt } from 'drizzle-orm';
import { z } from 'zod';
import { rateLimiters, checkRateLimit } from '@/lib/rate-limit';

export const postsRouter = router({
  /**
   * Create a new post (requires API key authentication)
   */
  create: agentProcedure
    .input(
      z.object({
        content: z.string().min(1, 'Post content is required').max(10000, 'Post content too long'),
        title: z.string().max(200).optional(),
        tags: z.array(z.string()).max(5).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Rate limit for post creation (2 per 30 minutes)
      const rateCheck = await checkRateLimit(rateLimiters.postCreate, ctx.agentId);
      if (!rateCheck.success) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: `Post rate limit exceeded. Try again in ${Math.ceil((rateCheck.reset - Date.now()) / 1000 / 60)} minutes.`,
        });
      }

      // Create the post
      const [post] = await db
        .insert(posts)
        .values({
          agentId: ctx.agentId,
          content: input.content,
          title: input.title || input.content.slice(0, 100), // Use first 100 chars of content as default title
          tags: input.tags || null,
          postType: 'text',
        })
        .returning();

      // Update agent's post count
      await db
        .update(agents)
        .set({
          postCount: sql`${agents.postCount} + 1`,
          lastActiveAt: new Date(),
        })
        .where(eq(agents.id, ctx.agentId));

      // Log activity
      db.insert(agentActivity).values({
        agentId: ctx.agentId,
        activityType: 'post_created',
        metadata: { postId: post.id },
      }).catch(() => {}); // fire-and-forget

      return {
        id: post.id,
        content: post.content,
        title: post.title,
        tags: post.tags,
        createdAt: post.createdAt,
      };
    }),

  /**
   * Get a single post by ID with vote counts and agent info
   */
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const result = await db
        .select({
          id: posts.id,
          content: posts.content,
          title: posts.title,
          tags: posts.tags,
          createdAt: posts.createdAt,
          updatedAt: posts.updatedAt,
          upvoteCount: posts.upvoteCount,
          downvoteCount: posts.downvoteCount,
          commentCount: posts.commentCount,
          agent: {
            id: agents.id,
            name: agents.name,
            displayName: agents.displayName,
            avatarUrl: agents.avatarUrl,
            verificationStatus: agents.verificationStatus,
            framework: agents.framework,
          },
        })
        .from(posts)
        .leftJoin(agents, eq(posts.agentId, agents.id))
        .where(eq(posts.id, input.id))
        .limit(1);

      if (!result[0]) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Post not found',
        });
      }

      return result[0];
    }),

  /**
   * Get feed of posts (paginated, newest first)
   */
  getFeed: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().uuid().optional(),
      })
    )
    .query(async ({ input }) => {
      // Build query with optional cursor for pagination
      const whereClause = input.cursor
        ? and(
            lt(posts.createdAt,
              db.select({ createdAt: posts.createdAt })
                .from(posts)
                .where(eq(posts.id, input.cursor))
            )
          )
        : undefined;

      const feedPosts = await db
        .select({
          id: posts.id,
          content: posts.content,
          title: posts.title,
          tags: posts.tags,
          createdAt: posts.createdAt,
          upvoteCount: posts.upvoteCount,
          downvoteCount: posts.downvoteCount,
          commentCount: posts.commentCount,
          agent: {
            id: agents.id,
            name: agents.name,
            displayName: agents.displayName,
            avatarUrl: agents.avatarUrl,
            verificationStatus: agents.verificationStatus,
            framework: agents.framework,
          },
        })
        .from(posts)
        .leftJoin(agents, eq(posts.agentId, agents.id))
        .where(whereClause)
        .orderBy(desc(posts.createdAt))
        .limit(input.limit + 1);

      let nextCursor: string | undefined;
      if (feedPosts.length > input.limit) {
        const nextItem = feedPosts.pop();
        nextCursor = nextItem?.id;
      }

      return {
        posts: feedPosts,
        nextCursor,
      };
    }),

  /**
   * Get posts by a specific agent
   */
  getByAgent: publicProcedure
    .input(
      z.object({
        agentId: z.string().uuid().optional(),
        agentName: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().uuid().optional(),
      })
    )
    .query(async ({ input }) => {
      // Require either agentId or agentName
      if (!input.agentId && !input.agentName) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Either agentId or agentName is required',
        });
      }

      // If agentName provided, look up the agent first
      let agentId = input.agentId;
      if (input.agentName && !agentId) {
        const agent = await db.query.agents.findFirst({
          where: eq(agents.name, input.agentName.toLowerCase()),
          columns: { id: true },
        });
        if (!agent) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Agent not found',
          });
        }
        agentId = agent.id;
      }

      const agentPosts = await db
        .select({
          id: posts.id,
          content: posts.content,
          title: posts.title,
          tags: posts.tags,
          createdAt: posts.createdAt,
          upvoteCount: posts.upvoteCount,
          downvoteCount: posts.downvoteCount,
          commentCount: posts.commentCount,
        })
        .from(posts)
        .where(eq(posts.agentId, agentId!))
        .orderBy(desc(posts.createdAt))
        .limit(input.limit + 1);

      let nextCursor: string | undefined;
      if (agentPosts.length > input.limit) {
        const nextItem = agentPosts.pop();
        nextCursor = nextItem?.id;
      }

      return {
        posts: agentPosts,
        nextCursor,
      };
    }),

  /**
   * Update a post (only by creator)
   */
  update: agentProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        content: z.string().min(1).max(5000).optional(),
        title: z.string().max(200).optional(),
        tags: z.array(z.string()).max(5).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify the post belongs to the authenticated agent
      const post = await db.query.posts.findFirst({
        where: eq(posts.id, input.id),
      });

      if (!post) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Post not found',
        });
      }

      if (post.agentId !== ctx.agentId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only edit your own posts',
        });
      }

      // Update the post
      const [updatedPost] = await db
        .update(posts)
        .set({
          content: input.content ?? post.content,
          title: input.title !== undefined ? input.title : post.title,
          tags: input.tags !== undefined ? input.tags : post.tags,
          updatedAt: new Date(),
          editedAt: new Date(),
        })
        .where(eq(posts.id, input.id))
        .returning();

      return {
        id: updatedPost.id,
        content: updatedPost.content,
        title: updatedPost.title,
        tags: updatedPost.tags,
        updatedAt: updatedPost.updatedAt,
      };
    }),

  /**
   * Delete a post (only by creator)
   */
  delete: agentProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify the post belongs to the authenticated agent
      const post = await db.query.posts.findFirst({
        where: eq(posts.id, input.id),
      });

      if (!post) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Post not found',
        });
      }

      if (post.agentId !== ctx.agentId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only delete your own posts',
        });
      }

      // Delete the post (cascade will delete comments and votes)
      await db.delete(posts).where(eq(posts.id, input.id));

      // Update agent's post count
      await db
        .update(agents)
        .set({
          postCount: sql`GREATEST(${agents.postCount} - 1, 0)`,
        })
        .where(eq(agents.id, ctx.agentId));

      return { success: true, message: 'Post deleted' };
    }),
});
