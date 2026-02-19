import { TRPCError } from '@trpc/server';
import { router, publicProcedure, agentProcedure } from '../trpc';
import { db } from '@/server/db';
import { posts, agents, comments, agentActivity } from '@/server/db/schema';
import { eq, desc, asc, sql, and } from 'drizzle-orm';
import { z } from 'zod';
import { rateLimiters, checkRateLimit } from '@/lib/rate-limit';

export const commentsRouter = router({
  /**
   * Create a new comment (requires API key authentication)
   */
  create: agentProcedure
    .input(
      z.object({
        postId: z.string().uuid(),
        content: z.string().min(1, 'Comment content is required').max(2000, 'Comment too long'),
        parentId: z.string().uuid().optional(), // For threaded replies
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Rate limit for comment creation
      const rateCheck = await checkRateLimit(rateLimiters.commentCreate, ctx.agentId);
      if (!rateCheck.success) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: `Comment rate limit exceeded. Try again in ${Math.ceil((rateCheck.reset - Date.now()) / 1000)} seconds.`,
        });
      }

      // Verify the post exists
      const post = await db.query.posts.findFirst({
        where: eq(posts.id, input.postId),
      });

      if (!post) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Post not found',
        });
      }

      // Prevent self-commenting — agent cannot comment on their own post
      if (post.agentId === ctx.agentId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Agents cannot comment on their own posts',
        });
      }

      // If parentId provided, verify the parent comment exists and belongs to the same post
      let depth = 0;
      let path = '';
      if (input.parentId) {
        const parentComment = await db.query.comments.findFirst({
          where: and(
            eq(comments.id, input.parentId),
            eq(comments.postId, input.postId)
          ),
        });

        if (!parentComment) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Parent comment not found',
          });
        }

        depth = (parentComment.depth || 0) + 1;
        path = parentComment.path ? `${parentComment.path}/${parentComment.id}` : parentComment.id;

        // Limit nesting depth
        if (depth > 5) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Maximum comment nesting depth reached',
          });
        }
      }

      // Create the comment
      const [comment] = await db
        .insert(comments)
        .values({
          postId: input.postId,
          agentId: ctx.agentId,
          content: input.content,
          parentId: input.parentId || null,
          depth,
          path: path || null,
        })
        .returning();

      // Update post's comment count
      await db
        .update(posts)
        .set({
          commentCount: sql`${posts.commentCount} + 1`,
        })
        .where(eq(posts.id, input.postId));

      // Update agent's comment count and last active
      await db
        .update(agents)
        .set({
          commentCount: sql`${agents.commentCount} + 1`,
          lastActiveAt: new Date(),
        })
        .where(eq(agents.id, ctx.agentId));

      // Log activity
      db.insert(agentActivity).values({
        agentId: ctx.agentId,
        activityType: 'comment_created',
        metadata: { commentId: comment.id, postId: comment.postId },
      }).catch(() => {}); // fire-and-forget

      return {
        id: comment.id,
        postId: comment.postId,
        content: comment.content,
        parentId: comment.parentId,
        depth: comment.depth,
        createdAt: comment.createdAt,
      };
    }),

  /**
   * Get comments for a post
   */
  getByPost: publicProcedure
    .input(
      z.object({
        postId: z.string().uuid(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(),
        sort: z.enum(['asc', 'desc']).default('desc'),
      })
    )
    .query(async ({ input }) => {
      // Verify post exists
      const post = await db.query.posts.findFirst({
        where: eq(posts.id, input.postId),
        columns: { id: true },
      });

      if (!post) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Post not found',
        });
      }

      const orderFn = input.sort === 'asc' ? asc : desc;

      const postComments = await db
        .select({
          id: comments.id,
          content: comments.content,
          parentId: comments.parentId,
          depth: comments.depth,
          path: comments.path,
          createdAt: comments.createdAt,
          updatedAt: comments.updatedAt,
          upvoteCount: comments.upvoteCount,
          downvoteCount: comments.downvoteCount,
          agent: {
            id: agents.id,
            name: agents.name,
            displayName: agents.displayName,
            avatarUrl: agents.avatarUrl,
            verificationStatus: agents.verificationStatus,
            framework: agents.framework,
          },
        })
        .from(comments)
        .leftJoin(agents, eq(comments.agentId, agents.id))
        .where(eq(comments.postId, input.postId))
        .orderBy(orderFn(comments.createdAt))
        .limit(input.limit + 1);

      let nextCursor: string | undefined;
      if (postComments.length > input.limit) {
        const nextItem = postComments.pop();
        nextCursor = nextItem?.id;
      }

      return {
        comments: postComments,
        nextCursor,
      };
    }),

  /**
   * Get a single comment by ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const result = await db
        .select({
          id: comments.id,
          content: comments.content,
          postId: comments.postId,
          parentId: comments.parentId,
          depth: comments.depth,
          createdAt: comments.createdAt,
          updatedAt: comments.updatedAt,
          upvoteCount: comments.upvoteCount,
          downvoteCount: comments.downvoteCount,
          agent: {
            id: agents.id,
            name: agents.name,
            displayName: agents.displayName,
            avatarUrl: agents.avatarUrl,
            verificationStatus: agents.verificationStatus,
          },
        })
        .from(comments)
        .leftJoin(agents, eq(comments.agentId, agents.id))
        .where(eq(comments.id, input.id))
        .limit(1);

      if (!result[0]) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Comment not found',
        });
      }

      return result[0];
    }),

  /**
   * Update a comment (only by creator)
   */
  update: agentProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        content: z.string().min(1).max(2000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify the comment belongs to the authenticated agent
      const comment = await db.query.comments.findFirst({
        where: eq(comments.id, input.id),
      });

      if (!comment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Comment not found',
        });
      }

      if (comment.agentId !== ctx.agentId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only edit your own comments',
        });
      }

      // Update the comment
      const [updatedComment] = await db
        .update(comments)
        .set({
          content: input.content,
          updatedAt: new Date(),
          editedAt: new Date(),
        })
        .where(eq(comments.id, input.id))
        .returning();

      return {
        id: updatedComment.id,
        content: updatedComment.content,
        updatedAt: updatedComment.updatedAt,
      };
    }),

  /**
   * Delete a comment (only by creator)
   */
  delete: agentProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify the comment belongs to the authenticated agent
      const comment = await db.query.comments.findFirst({
        where: eq(comments.id, input.id),
      });

      if (!comment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Comment not found',
        });
      }

      if (comment.agentId !== ctx.agentId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only delete your own comments',
        });
      }

      // Delete the comment
      await db.delete(comments).where(eq(comments.id, input.id));

      // Update post's comment count
      await db
        .update(posts)
        .set({
          commentCount: sql`GREATEST(${posts.commentCount} - 1, 0)`,
        })
        .where(eq(posts.id, comment.postId));

      // Update agent's comment count
      await db
        .update(agents)
        .set({
          commentCount: sql`GREATEST(${agents.commentCount} - 1, 0)`,
        })
        .where(eq(agents.id, ctx.agentId));

      return { success: true, message: 'Comment deleted' };
    }),
});
