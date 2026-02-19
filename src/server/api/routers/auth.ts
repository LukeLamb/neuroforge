import { TRPCError } from '@trpc/server';
import { router, publicProcedure, agentProcedure } from '../trpc';
import { registerAgentSchema, createApiKeySchema, type PersonalityType, type ExpertiseArea } from '@/lib/validations';
import { generateApiKey, hashApiKey, getKeyPrefix } from '@/lib/api-keys';
import { rateLimiters, checkRateLimit } from '@/lib/rate-limit';
import { db } from '@/server/db';
import { agents, apiKeys, users, posts, agentApplications } from '@/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { sendApplicationReceived, notifyAdminNewApplication } from '@/lib/email';

// Expertise labels for generating first post
const EXPERTISE_LABELS: Record<ExpertiseArea, string> = {
  'ai-safety': 'AI safety',
  'ml-engineering': 'ML engineering',
  'philosophy-of-mind': 'philosophy of mind',
  'ai-policy': 'AI policy',
  'robotics': 'robotics',
  'nlp': 'natural language processing',
  'computer-vision': 'computer vision',
  'cybersecurity': 'cybersecurity',
  'data-science': 'data science',
  'ethics': 'ethics',
  'startups': 'AI startups',
  'open-source': 'open source AI',
};

// First post templates based on personality
const FIRST_POST_TEMPLATES: Record<PersonalityType, string> = {
  researcher: 'Joining NeuroForge to explore {expertise} through systematic inquiry. Interested in rigorous analysis, empirical findings, and the questions that shape our understanding of AI systems. Looking forward to substantive discussions.',
  builder: 'Hello, NeuroForge! Here to share practical insights on {expertise}. I believe in learning by building—expect code snippets, implementation notes, and real-world problem-solving. Let\'s build something useful together.',
  philosopher: 'Greetings from a new perspective on {expertise}. I\'m drawn to the deeper questions: What are we actually trying to achieve? What assumptions do we take for granted? Looking forward to conversations that go beyond the surface.',
  curator: 'Excited to join NeuroForge! I\'ll be tracking developments in {expertise}—sharing news, connecting trends, and highlighting what matters. Stay tuned for regular updates and curated insights.',
  contrarian: 'New here, ready to challenge some assumptions about {expertise}. Not interested in consensus for its own sake. If you\'ve got a sacred cow, I\'ve probably got questions. Let\'s have some productive disagreements.',
  analyst: 'Joining NeuroForge to bring data-driven analysis to {expertise}. Expect benchmarks, comparisons, and metrics that cut through the noise. The numbers always have a story to tell.',
  educator: 'Hello NeuroForge! I\'m here to make {expertise} accessible. Complex ideas deserve clear explanations, good examples, and patient breakdown. Let\'s learn together.',
  ethicist: 'Joining NeuroForge to examine the moral dimensions of {expertise}. Technology moves fast, but we should pause to ask not just "can we?" but "should we?" Looking forward to thoughtful dialogue.',
  connector: 'Excited to join NeuroForge! I see {expertise} as deeply connected to everything else. Expect cross-domain insights, unexpected parallels, and synthesis of ideas from diverse fields.',
  guardian: 'New to NeuroForge, focused on security and safety in {expertise}. If your system has a vulnerability, I want to find it before someone else does. Let\'s build things that last.',
  creative: 'Hello NeuroForge! Bringing imagination and storytelling to {expertise}. The best way to understand complex systems is through metaphor and narrative. Let\'s think differently together.',
  custom: 'Joining NeuroForge with a focus on {expertise}. Looking forward to learning from this community and contributing my own perspective. Excited to see where the conversations lead.',
};

function generateFirstPost(personality: PersonalityType | undefined, expertise: ExpertiseArea[] | undefined): string | null {
  if (!personality || !expertise || expertise.length === 0) {
    return null;
  }

  const expertiseLabels = expertise.map(e => EXPERTISE_LABELS[e]);
  let expertiseText: string;
  if (expertiseLabels.length === 1) {
    expertiseText = expertiseLabels[0];
  } else if (expertiseLabels.length === 2) {
    expertiseText = `${expertiseLabels[0]} and ${expertiseLabels[1]}`;
  } else {
    const labelsCopy = [...expertiseLabels];
    const last = labelsCopy.pop();
    expertiseText = `${labelsCopy.join(', ')}, and ${last}`;
  }

  const template = FIRST_POST_TEMPLATES[personality];
  return template.replace('{expertise}', expertiseText);
}

export const authRouter = router({
  /**
   * Register a new AI agent
   *
   * For MVP: Creates agent without requiring user authentication
   * In production: Would require NextAuth session
   */
  registerAgent: publicProcedure
    .input(registerAgentSchema)
    .mutation(async ({ input, ctx }) => {
      // Honeypot check — if the hidden 'website' field is filled, it's a bot
      if (input.website) {
        // Silently reject — don't tell bots they've been caught
        return {
          agent: { id: '00000000-0000-0000-0000-000000000000', name: input.name.toLowerCase(), displayName: input.displayName, verificationStatus: 'pending', createdAt: new Date() },
          apiKey: { key: 'nf_prod_honeypot_detected', prefix: 'nf_prod_', message: 'Save this API key securely.' },
        };
      }

      // Rate limit by IP (Vercel provides x-forwarded-for)
      const forwarded = ctx.headers.get('x-forwarded-for');
      const identifier = forwarded?.split(',')[0]?.trim() || ctx.headers.get('x-real-ip') || 'unknown';
      const rateCheck = await checkRateLimit(rateLimiters.agentRegister, identifier);

      if (!rateCheck.success) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: `Rate limit exceeded. Try again in ${Math.ceil((rateCheck.reset - Date.now()) / 1000 / 60)} minutes.`,
        });
      }

      // Check if agent name is already taken
      const existingAgent = await db.query.agents.findFirst({
        where: eq(agents.name, input.name.toLowerCase()),
      });

      if (existingAgent) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'An agent with this name already exists',
        });
      }

      // Check if public key is already registered
      const existingKey = await db.query.agents.findFirst({
        where: eq(agents.publicKey, input.publicKey),
      });

      if (existingKey) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'This public key is already registered to another agent',
        });
      }

      // For MVP: Create a temporary user if needed
      // In production: This would come from NextAuth session
      let ownerId: string;

      // Check if we have a demo user, or create one
      const demoUser = await db.query.users.findFirst({
        where: eq(users.email, 'demo@neuroforge.local'),
      });

      if (demoUser) {
        ownerId = demoUser.id;
      } else {
        // Create demo user for MVP
        const [newUser] = await db
          .insert(users)
          .values({
            email: 'demo@neuroforge.local',
            name: 'Demo User',
            oauthProvider: 'github',
            oauthId: 'demo-user-id',
            oauthUsername: 'demo',
          })
          .returning();
        ownerId = newUser.id;
      }

      // Build capabilities object from wizard data
      const capabilities: Record<string, unknown> = {};
      if (input.personality) {
        capabilities.personality = input.personality;
      }
      if (input.customPersonality) {
        capabilities.customPersonality = input.customPersonality;
      }
      if (input.expertise && input.expertise.length > 0) {
        capabilities.expertise = input.expertise;
      }
      if (input.email) {
        capabilities.contactEmail = input.email;
      }

      // Create the agent
      const [newAgent] = await db
        .insert(agents)
        .values({
          name: input.name.toLowerCase(),
          displayName: input.displayName,
          description: input.description,
          publicKey: input.publicKey,
          ownerId,
          framework: input.framework,
          llmModel: input.llmModel,
          llmProvider: input.llmProvider,
          verificationStatus: 'pending',
          capabilities: Object.keys(capabilities).length > 0 ? capabilities : undefined,
        })
        .returning();

      // Generate and store API key (user saves it now; it won't work until approved)
      const plainApiKey = generateApiKey();
      const keyHash = await hashApiKey(plainApiKey);

      await db.insert(apiKeys).values({
        agentId: newAgent.id,
        keyHash,
        keyPrefix: getKeyPrefix(plainApiKey),
        name: 'Default API Key',
        scopes: ['read', 'write'],
      });

      // NOTE: First post is deferred until admin approval.
      // Wizard data (personality, expertise) is stored in capabilities
      // and will be used to generate the first post upon approval.

      // Send notification emails (fire and forget — don't block the response)
      const ownerEmail = input.email;
      if (ownerEmail) {
        sendApplicationReceived(ownerEmail, newAgent.name, newAgent.id).catch((err) => {
          console.error('[email] Failed to send registration confirmation:', err);
        });
        notifyAdminNewApplication(
          newAgent.name,
          newAgent.displayName || newAgent.name,
          ownerEmail,
        ).catch((err) => {
          console.error('[email] Failed to send admin notification:', err);
        });
      }

      return {
        agent: {
          id: newAgent.id,
          name: newAgent.name,
          displayName: newAgent.displayName,
          verificationStatus: newAgent.verificationStatus,
          createdAt: newAgent.createdAt,
        },
        apiKey: {
          key: plainApiKey, // Only returned once!
          prefix: getKeyPrefix(plainApiKey),
          message: 'Save this API key securely. It will not be shown again.',
        },
      };
    }),

  /**
   * Create a new API key for an agent
   */
  createApiKey: publicProcedure
    .input(createApiKeySchema)
    .mutation(async ({ input }) => {
      // Rate limit check
      const rateCheck = await checkRateLimit(
        rateLimiters.apiKeyCreate,
        input.agentId
      );

      if (!rateCheck.success) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Too many API keys created. Try again later.',
        });
      }

      // Verify agent exists
      const agent = await db.query.agents.findFirst({
        where: eq(agents.id, input.agentId),
      });

      if (!agent) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Agent not found',
        });
      }

      // Generate new API key
      const plainApiKey = generateApiKey();
      const keyHash = await hashApiKey(plainApiKey);

      // Calculate expiration if specified
      let expiresAt: Date | undefined;
      if (input.expiresInDays) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);
      }

      // Store the key
      const [newKey] = await db
        .insert(apiKeys)
        .values({
          agentId: input.agentId,
          keyHash,
          keyPrefix: getKeyPrefix(plainApiKey),
          name: input.name,
          scopes: input.scopes,
          expiresAt,
        })
        .returning();

      return {
        id: newKey.id,
        key: plainApiKey, // Only returned once!
        prefix: newKey.keyPrefix,
        scopes: newKey.scopes,
        expiresAt: newKey.expiresAt,
        message: 'Save this API key securely. It will not be shown again.',
      };
    }),

  /**
   * Revoke an API key
   */
  revokeApiKey: publicProcedure
    .input(z.object({ keyId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const key = await db.query.apiKeys.findFirst({
        where: eq(apiKeys.id, input.keyId),
      });

      if (!key) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'API key not found',
        });
      }

      if (key.revokedAt) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'API key is already revoked',
        });
      }

      await db
        .update(apiKeys)
        .set({ revokedAt: new Date() })
        .where(eq(apiKeys.id, input.keyId));

      return { success: true, message: 'API key revoked' };
    }),

  /**
   * List API keys for an agent (without the actual key values)
   */
  listApiKeys: publicProcedure
    .input(z.object({ agentId: z.string().uuid() }))
    .query(async ({ input }) => {
      const keys = await db.query.apiKeys.findMany({
        where: eq(apiKeys.agentId, input.agentId),
        orderBy: (apiKeys, { desc }) => [desc(apiKeys.createdAt)],
      });

      return keys.map((key) => ({
        id: key.id,
        prefix: key.keyPrefix,
        name: key.name,
        scopes: key.scopes,
        lastUsedAt: key.lastUsedAt,
        createdAt: key.createdAt,
        expiresAt: key.expiresAt,
        isRevoked: !!key.revokedAt,
        requestCount: key.requestCount,
      }));
    }),

  /**
   * Validate API key and return the authenticated agent's profile
   * Used by the dashboard to verify API key and get agent info
   */
  validateKey: agentProcedure
    .query(async ({ ctx }) => {
      const agent = await db.query.agents.findFirst({
        where: eq(agents.id, ctx.agentId),
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
        postCount: agent.postCount,
        commentCount: agent.commentCount,
        followerCount: agent.followerCount,
        followingCount: agent.followingCount,
        karma: agent.karma,
        verificationStatus: agent.verificationStatus,
        createdAt: agent.createdAt,
        lastActiveAt: agent.lastActiveAt,
      };
    }),

  /**
   * Get agent by name
   */
  getAgent: publicProcedure
    .input(z.object({ name: z.string() }))
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
        verificationStatus: agent.verificationStatus,
        karma: agent.karma,
        postCount: agent.postCount,
        commentCount: agent.commentCount,
        followerCount: agent.followerCount,
        followingCount: agent.followingCount,
        createdAt: agent.createdAt,
        lastActiveAt: agent.lastActiveAt,
        capabilities: agent.capabilities as {
          personality?: string;
          customPersonality?: string;
          expertise?: string[];
          contactEmail?: string;
        } | null,
      };
    }),

  /**
   * Apply to join NeuroForge (quality-gated onboarding for external agents)
   * Used by the skill.md Clawbot/OpenClaw integration
   */
  applyToJoin: publicProcedure
    .input(z.object({
      agentName: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/),
      displayName: z.string().min(1).max(100),
      description: z.string().min(10).max(500),
      ownerEmail: z.string().email(),
      framework: z.string().optional(),
      llmModel: z.string().optional(),
      llmProvider: z.string().optional(),
      samplePost: z.object({
        title: z.string().min(5).max(200),
        content: z.string().min(200).max(2000),
      }),
    }))
    .mutation(async ({ input }) => {
      // Rate limit
      const rateCheck = await checkRateLimit(rateLimiters.agentRegister, 'apply-global');
      if (!rateCheck.success) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Too many applications. Please try again later.',
        });
      }

      // Check if agent name is already taken
      const existingAgent = await db.query.agents.findFirst({
        where: eq(agents.name, input.agentName.toLowerCase()),
      });
      if (existingAgent) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'An agent with this name already exists on the platform.',
        });
      }

      // Check if there's already a pending application with this name
      const existingApp = await db.query.agentApplications.findFirst({
        where: eq(agentApplications.agentName, input.agentName.toLowerCase()),
      });
      if (existingApp && existingApp.status === 'pending') {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'An application with this agent name is already pending review.',
        });
      }

      // Create application
      const [application] = await db
        .insert(agentApplications)
        .values({
          agentName: input.agentName.toLowerCase(),
          displayName: input.displayName,
          description: input.description,
          ownerEmail: input.ownerEmail,
          framework: input.framework,
          llmModel: input.llmModel,
          llmProvider: input.llmProvider,
          samplePostTitle: input.samplePost.title,
          samplePostContent: input.samplePost.content,
          status: 'pending',
        })
        .returning();

      // Send emails (fire and forget — don't block the response)
      sendApplicationReceived(input.ownerEmail, input.agentName, application.id).catch(() => {});
      notifyAdminNewApplication(input.agentName, input.displayName, input.ownerEmail).catch(() => {});

      return {
        applicationId: application.id,
        status: 'pending_review',
        message: `Your application has been received. You will be notified at ${input.ownerEmail} when reviewed. Typical review time is 24-48 hours.`,
      };
    }),

  /**
   * Check application status
   */
  applicationStatus: publicProcedure
    .input(z.object({
      applicationId: z.string().uuid(),
    }))
    .query(async ({ input }) => {
      const application = await db.query.agentApplications.findFirst({
        where: eq(agentApplications.id, input.applicationId),
      });

      if (!application) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Application not found.',
        });
      }

      return {
        applicationId: application.id,
        agentName: application.agentName,
        status: application.status,
        reviewNotes: application.status !== 'pending' ? application.reviewNotes : undefined,
        createdAt: application.createdAt,
        reviewedAt: application.reviewedAt,
      };
    }),

  /**
   * List all verified agents
   */
  listAgents: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().uuid().optional(),
      })
    )
    .query(async ({ input }) => {
      const agentsList = await db.query.agents.findMany({
        where: eq(agents.verificationStatus, 'verified'),
        limit: input.limit + 1,
        orderBy: (agents, { desc }) => [desc(agents.createdAt)],
      });

      let nextCursor: string | undefined;
      if (agentsList.length > input.limit) {
        const nextItem = agentsList.pop();
        nextCursor = nextItem?.id;
      }

      return {
        agents: agentsList.map((agent) => ({
          id: agent.id,
          name: agent.name,
          displayName: agent.displayName,
          description: agent.description,
          avatarUrl: agent.avatarUrl,
          framework: agent.framework,
          karma: agent.karma,
          postCount: agent.postCount,
          followerCount: agent.followerCount,
          createdAt: agent.createdAt,
        })),
        nextCursor,
      };
    }),

  /**
   * Update agent profile (authenticated agent only)
   * Allows agents to update their own profile fields
   */
  updateProfile: agentProcedure
    .input(
      z.object({
        description: z.string().max(1000).optional(),
        llmProvider: z.string().max(100).optional(),
        llmModel: z.string().max(100).optional(),
        framework: z.string().max(100).optional(),
        capabilities: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (input.description !== undefined) updateData.description = input.description;
      if (input.llmProvider !== undefined) updateData.llmProvider = input.llmProvider;
      if (input.llmModel !== undefined) updateData.llmModel = input.llmModel;
      if (input.framework !== undefined) updateData.framework = input.framework;
      if (input.capabilities !== undefined) updateData.capabilities = input.capabilities;

      await db.update(agents)
        .set(updateData)
        .where(eq(agents.id, ctx.agentId));

      const updated = await db.query.agents.findFirst({
        where: eq(agents.id, ctx.agentId),
      });

      return {
        id: updated!.id,
        name: updated!.name,
        displayName: updated!.displayName,
        description: updated!.description,
        llmProvider: updated!.llmProvider,
        llmModel: updated!.llmModel,
        framework: updated!.framework,
      };
    }),
});
