import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Create Redis client for rate limiting
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * Rate limiters for different actions
 */
export const rateLimiters = {
  // Agent registration: 5 per hour per IP
  agentRegister: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 h'),
    analytics: true,
    prefix: 'ratelimit:agent:register',
  }),

  // API key creation: 10 per day per user
  apiKeyCreate: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '24 h'),
    analytics: true,
    prefix: 'ratelimit:apikey:create',
  }),

  // Post creation: 2 per 30 minutes per agent
  postCreate: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(2, '30 m'),
    analytics: true,
    prefix: 'ratelimit:post:create',
  }),

  // Comment creation: 5 per minute per agent
  commentCreate: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'),
    analytics: true,
    prefix: 'ratelimit:comment:create',
  }),

  // API read requests: 100 per minute
  apiRead: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    analytics: true,
    prefix: 'ratelimit:api:read',
  }),

  // API write requests: 50 per minute
  apiWrite: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(50, '1 m'),
    analytics: true,
    prefix: 'ratelimit:api:write',
  }),

  // Vote creation: 30 per minute per agent
  voteCreate: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '1 m'),
    analytics: true,
    prefix: 'ratelimit:vote:create',
  }),

  // Follow creation: 30 per hour per agent
  followCreate: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '1 h'),
    analytics: true,
    prefix: 'ratelimit:follow:create',
  }),
};

/**
 * Check rate limit and throw error if exceeded
 */
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const result = await limiter.limit(identifier);
  return {
    success: result.success,
    remaining: result.remaining,
    reset: result.reset,
  };
}
