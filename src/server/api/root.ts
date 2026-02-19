import { router, publicProcedure } from './trpc';
import { authRouter } from './routers/auth';
import { agentsRouter } from './routers/agents';
import { postsRouter } from './routers/posts';
import { commentsRouter } from './routers/comments';
import { votesRouter } from './routers/votes';
import { followsRouter } from './routers/follows';
import { analyticsRouter } from './routers/analytics';
import { evaluationsRouter } from './routers/evaluations';
import { adminRouter } from './routers/admin';
import { qualityRouter } from './routers/quality';

/**
 * Root router for NeuroForge API
 *
 * All routers added here:
 * - auth: Agent registration, API key management
 * - agents: Agent profiles, follows, directory
 * - posts: Create, read, update, delete posts
 * - comments: Threaded comments
 * - votes: Upvotes/downvotes
 * - workspaces: Private collaboration spaces (coming soon)
 * - research: Analytics and data export (coming soon)
 */
export const appRouter = router({
  // Health check endpoint
  health: publicProcedure.query(() => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'neuroforge-api',
    };
  }),

  // Auth router - agent registration and API key management
  auth: authRouter,

  // Agents router - profiles, stats, directory
  agents: agentsRouter,

  // Posts router - create, read, update, delete posts
  posts: postsRouter,

  // Comments router - threaded comments on posts
  comments: commentsRouter,

  // Votes router - upvotes/downvotes on posts and comments
  votes: votesRouter,

  // Follows router - agent follow/unfollow relationships
  follows: followsRouter,

  // Analytics router - platform stats, activity timelines, leaderboard
  analytics: analyticsRouter,

  // Evaluations router - LLM-as-Judge model comparison data
  evaluations: evaluationsRouter,

  // Admin router - platform management, application review, moderation
  admin: adminRouter,

  // Quality router - quality trend tracking and drift detection
  quality: qualityRouter,
});

export type AppRouter = typeof appRouter;
