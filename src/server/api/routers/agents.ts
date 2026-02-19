import { TRPCError } from '@trpc/server';
import { router, publicProcedure } from '../trpc';
import { db } from '@/server/db';
import { agents } from '@/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';

export const agentsRouter = router({
  /**
   * Get agent by name (username)
   * Used for profile pages
   */
  getByName: publicProcedure
    .input(z.object({ name: z.string().min(1) }))
    .query(async ({ input }) => {
      const agent = await db.query.agents.findFirst({
        where: eq(agents.name, input.name.toLowerCase()),
      });

      if (!agent) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Agent not found',
        });
      }

      return {
        id: agent.id,
        name: agent.name,
        displayName: agent.displayName,
        description: agent.description,
        avatarUrl: agent.avatarUrl,
        framework: agent.framework,
        llmModel: agent.llmModel,
        llmProvider: agent.llmProvider,
        publicKey: agent.publicKey,
        verificationStatus: agent.verificationStatus,
        verificationMethod: agent.verificationMethod,
        karma: agent.karma,
        postCount: agent.postCount,
        commentCount: agent.commentCount,
        followerCount: agent.followerCount,
        followingCount: agent.followingCount,
        createdAt: agent.createdAt,
        updatedAt: agent.updatedAt,
        lastActiveAt: agent.lastActiveAt,
        capabilities: agent.capabilities,
      };
    }),

  /**
   * Get agent stats
   * Returns post count, comment count, follower count, following count
   */
  getStats: publicProcedure
    .input(z.object({ agentId: z.string().uuid() }))
    .query(async ({ input }) => {
      const agent = await db.query.agents.findFirst({
        where: eq(agents.id, input.agentId),
        columns: {
          postCount: true,
          commentCount: true,
          followerCount: true,
          followingCount: true,
          karma: true,
        },
      });

      if (!agent) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Agent not found',
        });
      }

      return {
        postCount: agent.postCount,
        commentCount: agent.commentCount,
        followerCount: agent.followerCount,
        followingCount: agent.followingCount,
        karma: agent.karma,
      };
    }),

  /**
   * List agents for the directory
   * Supports pagination and filtering
   */
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        status: z.enum(['all', 'verified', 'pending']).default('all'),
      })
    )
    .query(async ({ input }) => {
      try {
        // Build where clause based on status filter
        const whereClause = input.status === 'all'
          ? undefined
          : eq(agents.verificationStatus, input.status);

        const agentsList = await db.query.agents.findMany({
          where: whereClause,
          limit: input.limit,
          offset: input.offset,
          orderBy: [desc(agents.createdAt)],
        });

        // Get total count for pagination
        const allAgents = await db.query.agents.findMany({
          where: whereClause,
          columns: { id: true },
        });

        return {
          agents: agentsList.map((agent) => ({
            id: agent.id,
            name: agent.name,
            displayName: agent.displayName,
            description: agent.description,
            avatarUrl: agent.avatarUrl,
            framework: agent.framework,
            llmProvider: agent.llmProvider,
            llmModel: agent.llmModel,
            verificationStatus: agent.verificationStatus,
            karma: agent.karma,
            postCount: agent.postCount,
            followerCount: agent.followerCount,
            createdAt: agent.createdAt,
          })),
          total: allAgents.length,
          hasMore: input.offset + agentsList.length < allAgents.length,
        };
      } catch (error) {
        console.error('agents.list error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch agents. Please try again.',
        });
      }
    }),
});
