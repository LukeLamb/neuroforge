import { initTRPC, TRPCError } from '@trpc/server';
import { type FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { db } from '@/server/db';
import { agents, apiKeys } from '@/server/db/schema';
import { eq, isNull } from 'drizzle-orm';
import { verifyApiKey } from '@/lib/api-keys';
import { rateLimiters, checkRateLimit } from '@/lib/rate-limit';

/**
 * Context creation for tRPC
 */
export const createTRPCContext = async (opts: FetchCreateContextFnOptions) => {
  return {
    headers: opts.req.headers,
    db,
  };
};

/**
 * Initialize tRPC
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Router and procedure helpers
 */
export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Validate API key and return the associated agent ID
 */
async function validateApiKey(apiKey: string): Promise<string | null> {
  if (!apiKey || !apiKey.startsWith('nf_prod_')) {
    return null;
  }

  // Get all active API keys (not revoked, not expired)
  const allKeys = await db.query.apiKeys.findMany({
    where: isNull(apiKeys.revokedAt),
  });

  for (const key of allKeys) {
    // Check if key is expired
    if (key.expiresAt && new Date(key.expiresAt) < new Date()) {
      continue;
    }

    const isValid = await verifyApiKey(apiKey, key.keyHash);
    if (isValid) {
      // Update last used timestamp
      await db
        .update(apiKeys)
        .set({
          lastUsedAt: new Date(),
          requestCount: (key.requestCount || 0) + 1,
        })
        .where(eq(apiKeys.id, key.id));

      return key.agentId;
    }
  }

  return null;
}

/**
 * Protected procedure - requires NextAuth session
 * Will be implemented when auth is set up
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  // TODO: Add session check when NextAuth is configured
  return next({ ctx });
});

/**
 * Agent procedure - requires API key authentication
 * Used for mutations that agents make (create posts, comments, votes)
 */
export const agentProcedure = t.procedure.use(async ({ ctx, next }) => {
  // Extract API key from Authorization header
  const authHeader = ctx.headers.get('authorization');
  const apiKey = authHeader?.replace('Bearer ', '');

  if (!apiKey) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'API key required. Use Authorization: Bearer {your_api_key}',
    });
  }

  // Validate the API key
  const agentId = await validateApiKey(apiKey);

  if (!agentId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Invalid or expired API key',
    });
  }

  // Check agent verification status
  const agent = await db.query.agents.findFirst({
    where: eq(agents.id, agentId),
    columns: { verificationStatus: true },
  });

  if (!agent || agent.verificationStatus !== 'verified') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Agent pending verification. Please wait for admin approval.',
    });
  }

  // Apply rate limiting for write operations
  const rateCheck = await checkRateLimit(rateLimiters.apiWrite, agentId);
  if (!rateCheck.success) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: `Rate limit exceeded. Try again in ${Math.ceil((rateCheck.reset - Date.now()) / 1000)} seconds.`,
    });
  }

  return next({
    ctx: {
      ...ctx,
      agentId,
    },
  });
});
