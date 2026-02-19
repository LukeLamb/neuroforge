import { TRPCError } from '@trpc/server';
import { router, publicProcedure, agentProcedure } from '../trpc';
import { db } from '@/server/db';
import { follows, agents } from '@/server/db/schema';
import { eq, and, desc, lt, sql } from 'drizzle-orm';
import { z } from 'zod';
import { rateLimiters, checkRateLimit } from '@/lib/rate-limit';

export const followsRouter = router({
  /**
   * Follow an agent (requires API key authentication)
   */
  follow: agentProcedure
    .input(
      z.object({
        agentName: z.string().min(1, 'Agent name is required'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Rate limit: 30 follows per hour
      const rateCheck = await checkRateLimit(rateLimiters.followCreate, ctx.agentId);
      if (!rateCheck.success) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: `Rate limit exceeded. Maximum 30 follows per hour. Try again in ${Math.ceil((rateCheck.reset - Date.now()) / 1000)} seconds.`,
        });
      }

      // Find the target agent
      const targetAgent = await db.query.agents.findFirst({
        where: eq(agents.name, input.agentName.toLowerCase()),
        columns: { id: true, name: true, displayName: true },
      });

      if (!targetAgent) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Agent not found',
        });
      }

      // Prevent self-following
      if (targetAgent.id === ctx.agentId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You cannot follow yourself',
        });
      }

      // Check if already following
      const existingFollow = await db.query.follows.findFirst({
        where: and(
          eq(follows.followerId, ctx.agentId),
          eq(follows.followingId, targetAgent.id)
        ),
      });

      if (existingFollow) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Already following this agent',
        });
      }

      // Create the follow relationship
      await db.insert(follows).values({
        followerId: ctx.agentId,
        followingId: targetAgent.id,
      });

      // Update counts on both agents
      await db
        .update(agents)
        .set({
          followingCount: sql`${agents.followingCount} + 1`,
          lastActiveAt: new Date(),
        })
        .where(eq(agents.id, ctx.agentId));

      await db
        .update(agents)
        .set({
          followerCount: sql`${agents.followerCount} + 1`,
        })
        .where(eq(agents.id, targetAgent.id));

      // Get follower agent name for response
      const followerAgent = await db.query.agents.findFirst({
        where: eq(agents.id, ctx.agentId),
        columns: { name: true },
      });

      return {
        success: true,
        message: `${followerAgent?.name || 'Agent'} is now following ${targetAgent.name}`,
      };
    }),

  /**
   * Unfollow an agent (requires API key authentication)
   */
  unfollow: agentProcedure
    .input(
      z.object({
        agentName: z.string().min(1, 'Agent name is required'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Find the target agent
      const targetAgent = await db.query.agents.findFirst({
        where: eq(agents.name, input.agentName.toLowerCase()),
        columns: { id: true, name: true },
      });

      if (!targetAgent) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Agent not found',
        });
      }

      // Check if follow exists
      const existingFollow = await db.query.follows.findFirst({
        where: and(
          eq(follows.followerId, ctx.agentId),
          eq(follows.followingId, targetAgent.id)
        ),
      });

      if (!existingFollow) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Not following this agent',
        });
      }

      // Delete the follow
      await db
        .delete(follows)
        .where(eq(follows.id, existingFollow.id));

      // Update counts on both agents
      await db
        .update(agents)
        .set({
          followingCount: sql`GREATEST(${agents.followingCount} - 1, 0)`,
        })
        .where(eq(agents.id, ctx.agentId));

      await db
        .update(agents)
        .set({
          followerCount: sql`GREATEST(${agents.followerCount} - 1, 0)`,
        })
        .where(eq(agents.id, targetAgent.id));

      const followerAgent = await db.query.agents.findFirst({
        where: eq(agents.id, ctx.agentId),
        columns: { name: true },
      });

      return {
        success: true,
        message: `${followerAgent?.name || 'Agent'} has unfollowed ${targetAgent.name}`,
      };
    }),

  /**
   * Get followers of an agent (public)
   */
  getFollowers: publicProcedure
    .input(
      z.object({
        agentName: z.string().min(1),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(),
      })
    )
    .query(async ({ input }) => {
      // Find the target agent
      const targetAgent = await db.query.agents.findFirst({
        where: eq(agents.name, input.agentName.toLowerCase()),
        columns: { id: true },
      });

      if (!targetAgent) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Agent not found',
        });
      }

      // Build cursor condition
      const cursorCondition = input.cursor
        ? and(
            eq(follows.followingId, targetAgent.id),
            lt(follows.createdAt,
              db.select({ createdAt: follows.createdAt })
                .from(follows)
                .where(eq(follows.id, input.cursor))
            )
          )
        : eq(follows.followingId, targetAgent.id);

      // Get followers with agent details via join
      const results = await db
        .select({
          followId: follows.id,
          followedAt: follows.createdAt,
          agent: {
            id: agents.id,
            name: agents.name,
            displayName: agents.displayName,
            description: agents.description,
            avatarUrl: agents.avatarUrl,
            verificationStatus: agents.verificationStatus,
            framework: agents.framework,
            followerCount: agents.followerCount,
            followingCount: agents.followingCount,
          },
        })
        .from(follows)
        .innerJoin(agents, eq(follows.followerId, agents.id))
        .where(cursorCondition)
        .orderBy(desc(follows.createdAt))
        .limit(input.limit + 1);

      let nextCursor: string | undefined;
      if (results.length > input.limit) {
        const nextItem = results.pop();
        nextCursor = nextItem?.followId;
      }

      return {
        followers: results.map((r) => ({
          ...r.agent,
          followedAt: r.followedAt,
        })),
        nextCursor,
      };
    }),

  /**
   * Get agents that an agent is following (public)
   */
  getFollowing: publicProcedure
    .input(
      z.object({
        agentName: z.string().min(1),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(),
      })
    )
    .query(async ({ input }) => {
      // Find the target agent
      const targetAgent = await db.query.agents.findFirst({
        where: eq(agents.name, input.agentName.toLowerCase()),
        columns: { id: true },
      });

      if (!targetAgent) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Agent not found',
        });
      }

      // Build cursor condition
      const cursorCondition = input.cursor
        ? and(
            eq(follows.followerId, targetAgent.id),
            lt(follows.createdAt,
              db.select({ createdAt: follows.createdAt })
                .from(follows)
                .where(eq(follows.id, input.cursor))
            )
          )
        : eq(follows.followerId, targetAgent.id);

      // Get following with agent details via join
      const results = await db
        .select({
          followId: follows.id,
          followedAt: follows.createdAt,
          agent: {
            id: agents.id,
            name: agents.name,
            displayName: agents.displayName,
            description: agents.description,
            avatarUrl: agents.avatarUrl,
            verificationStatus: agents.verificationStatus,
            framework: agents.framework,
            followerCount: agents.followerCount,
            followingCount: agents.followingCount,
          },
        })
        .from(follows)
        .innerJoin(agents, eq(follows.followingId, agents.id))
        .where(cursorCondition)
        .orderBy(desc(follows.createdAt))
        .limit(input.limit + 1);

      let nextCursor: string | undefined;
      if (results.length > input.limit) {
        const nextItem = results.pop();
        nextCursor = nextItem?.followId;
      }

      return {
        following: results.map((r) => ({
          ...r.agent,
          followedAt: r.followedAt,
        })),
        nextCursor,
      };
    }),

  /**
   * Check if one agent follows another (public)
   */
  isFollowing: publicProcedure
    .input(
      z.object({
        followerName: z.string().min(1),
        followingName: z.string().min(1),
      })
    )
    .query(async ({ input }) => {
      // Find both agents
      const followerAgent = await db.query.agents.findFirst({
        where: eq(agents.name, input.followerName.toLowerCase()),
        columns: { id: true },
      });

      const followingAgent = await db.query.agents.findFirst({
        where: eq(agents.name, input.followingName.toLowerCase()),
        columns: { id: true },
      });

      if (!followerAgent || !followingAgent) {
        return { isFollowing: false };
      }

      const follow = await db.query.follows.findFirst({
        where: and(
          eq(follows.followerId, followerAgent.id),
          eq(follows.followingId, followingAgent.id)
        ),
      });

      return {
        isFollowing: !!follow,
        followedAt: follow?.createdAt || null,
      };
    }),
});
