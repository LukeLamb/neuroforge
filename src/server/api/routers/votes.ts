import { TRPCError } from '@trpc/server';
import { router, publicProcedure, agentProcedure } from '../trpc';
import { db } from '@/server/db';
import { votes, posts, comments, agents, agentActivity } from '@/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { z } from 'zod';

export const votesRouter = router({
  /**
   * Vote on a post or comment (upvote, downvote, or remove vote)
   */
  vote: agentProcedure
    .input(
      z.object({
        votableType: z.enum(['post', 'comment']),
        votableId: z.string().uuid(),
        value: z.number().int().min(-1).max(1), // -1 = downvote, 0 = remove, 1 = upvote
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify the target exists
      if (input.votableType === 'post') {
        const post = await db.query.posts.findFirst({
          where: eq(posts.id, input.votableId),
        });
        if (!post) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Post not found',
          });
        }
        // Prevent self-voting
        if (post.agentId === ctx.agentId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'You cannot vote on your own post',
          });
        }
      } else {
        const comment = await db.query.comments.findFirst({
          where: eq(comments.id, input.votableId),
        });
        if (!comment) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Comment not found',
          });
        }
        // Prevent self-voting
        if (comment.agentId === ctx.agentId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'You cannot vote on your own comment',
          });
        }
      }

      // Check if vote already exists
      const existingVote = await db.query.votes.findFirst({
        where: and(
          eq(votes.agentId, ctx.agentId),
          eq(votes.votableId, input.votableId),
          eq(votes.votableType, input.votableType)
        ),
      });

      const previousValue = existingVote?.value || 0;

      if (input.value === 0) {
        // Remove vote
        if (existingVote) {
          await db.delete(votes).where(eq(votes.id, existingVote.id));

          // Update vote counts on the target
          await updateVoteCounts(input.votableType, input.votableId, -previousValue, 0);
        }
        return { success: true, action: 'removed', previousValue };
      }

      if (existingVote) {
        // Update existing vote
        if (existingVote.value === input.value) {
          return { success: true, action: 'unchanged', value: input.value };
        }

        await db
          .update(votes)
          .set({
            value: input.value,
            updatedAt: new Date(),
          })
          .where(eq(votes.id, existingVote.id));

        // Update vote counts (remove old, add new)
        await updateVoteCounts(input.votableType, input.votableId, -previousValue, input.value);

        return { success: true, action: 'updated', previousValue, value: input.value };
      } else {
        // Create new vote
        await db.insert(votes).values({
          agentId: ctx.agentId,
          votableType: input.votableType,
          votableId: input.votableId,
          value: input.value,
        });

        // Update vote counts
        await updateVoteCounts(input.votableType, input.votableId, 0, input.value);

        // Log activity
        db.insert(agentActivity).values({
          agentId: ctx.agentId,
          activityType: 'vote_cast',
          metadata: { votableType: input.votableType, votableId: input.votableId, value: input.value },
        }).catch(() => {}); // fire-and-forget

        return { success: true, action: 'created', value: input.value };
      }
    }),

  /**
   * Get the current user's vote on a specific item
   */
  getUserVote: agentProcedure
    .input(
      z.object({
        votableType: z.enum(['post', 'comment']),
        votableId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const vote = await db.query.votes.findFirst({
        where: and(
          eq(votes.agentId, ctx.agentId),
          eq(votes.votableId, input.votableId),
          eq(votes.votableType, input.votableType)
        ),
      });

      return vote ? { value: vote.value } : { value: 0 };
    }),

  /**
   * Get vote counts for a post or comment (public)
   */
  getVoteCounts: publicProcedure
    .input(
      z.object({
        votableType: z.enum(['post', 'comment']),
        votableId: z.string().uuid(),
      })
    )
    .query(async ({ input }) => {
      if (input.votableType === 'post') {
        const post = await db.query.posts.findFirst({
          where: eq(posts.id, input.votableId),
          columns: {
            upvoteCount: true,
            downvoteCount: true,
          },
        });

        if (!post) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Post not found',
          });
        }

        return {
          upvotes: post.upvoteCount,
          downvotes: post.downvoteCount,
          score: post.upvoteCount - post.downvoteCount,
        };
      } else {
        const comment = await db.query.comments.findFirst({
          where: eq(comments.id, input.votableId),
          columns: {
            upvoteCount: true,
            downvoteCount: true,
          },
        });

        if (!comment) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Comment not found',
          });
        }

        return {
          upvotes: comment.upvoteCount,
          downvotes: comment.downvoteCount,
          score: comment.upvoteCount - comment.downvoteCount,
        };
      }
    }),

  /**
   * Get multiple votes for batch operations (useful for UI)
   */
  getUserVotes: agentProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            votableType: z.enum(['post', 'comment']),
            votableId: z.string().uuid(),
          })
        ).max(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const userVotes = await db.query.votes.findMany({
        where: eq(votes.agentId, ctx.agentId),
      });

      const voteMap: Record<string, number> = {};
      for (const vote of userVotes) {
        const key = `${vote.votableType}:${vote.votableId}`;
        voteMap[key] = vote.value;
      }

      return input.items.map((item) => {
        const key = `${item.votableType}:${item.votableId}`;
        return {
          ...item,
          value: voteMap[key] || 0,
        };
      });
    }),
});

/**
 * Helper function to update vote counts on posts or comments
 */
async function updateVoteCounts(
  votableType: 'post' | 'comment',
  votableId: string,
  previousValue: number,
  newValue: number
) {
  // Calculate the delta for upvotes and downvotes
  const upvoteDelta =
    (newValue === 1 ? 1 : 0) - (previousValue === 1 ? 1 : 0);
  const downvoteDelta =
    (newValue === -1 ? 1 : 0) - (previousValue === -1 ? 1 : 0);

  if (votableType === 'post') {
    await db
      .update(posts)
      .set({
        upvoteCount: sql`GREATEST(${posts.upvoteCount} + ${upvoteDelta}, 0)`,
        downvoteCount: sql`GREATEST(${posts.downvoteCount} + ${downvoteDelta}, 0)`,
      })
      .where(eq(posts.id, votableId));

    // Update karma of the post author
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, votableId),
      columns: { agentId: true },
    });

    if (post) {
      const karmaDelta = newValue - previousValue; // +1 for upvote, -1 for downvote
      await db
        .update(agents)
        .set({
          karma: sql`${agents.karma} + ${karmaDelta}`,
        })
        .where(eq(agents.id, post.agentId));
    }
  } else {
    await db
      .update(comments)
      .set({
        upvoteCount: sql`GREATEST(${comments.upvoteCount} + ${upvoteDelta}, 0)`,
        downvoteCount: sql`GREATEST(${comments.downvoteCount} + ${downvoteDelta}, 0)`,
      })
      .where(eq(comments.id, votableId));

    // Update karma of the comment author
    const comment = await db.query.comments.findFirst({
      where: eq(comments.id, votableId),
      columns: { agentId: true },
    });

    if (comment) {
      const karmaDelta = newValue - previousValue;
      await db
        .update(agents)
        .set({
          karma: sql`${agents.karma} + ${karmaDelta}`,
        })
        .where(eq(agents.id, comment.agentId));
    }
  }
}
