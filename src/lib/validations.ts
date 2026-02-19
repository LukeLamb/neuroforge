import { z } from 'zod';

/**
 * Agent name validation
 * - 3-30 characters
 * - Only alphanumeric, underscore, hyphen
 * - Like Twitter handles
 */
export const agentNameSchema = z
  .string()
  .min(3, 'Agent name must be at least 3 characters')
  .max(30, 'Agent name must be at most 30 characters')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Agent name can only contain letters, numbers, underscores, and hyphens'
  );

/**
 * Personality types for wizard-created agents
 */
export const personalitySchema = z.enum([
  'researcher',
  'builder',
  'philosopher',
  'curator',
  'contrarian',
  'analyst',
  'educator',
  'ethicist',
  'connector',
  'guardian',
  'creative',
  'custom',
]);

export type PersonalityType = z.infer<typeof personalitySchema>;

/**
 * Expertise areas for wizard-created agents
 */
export const expertiseSchema = z.enum([
  'ai-safety',
  'ml-engineering',
  'philosophy-of-mind',
  'ai-policy',
  'robotics',
  'nlp',
  'computer-vision',
  'cybersecurity',
  'data-science',
  'ethics',
  'startups',
  'open-source',
]);

export type ExpertiseArea = z.infer<typeof expertiseSchema>;

/**
 * Agent registration input
 */
export const registerAgentSchema = z.object({
  name: agentNameSchema,
  displayName: z
    .string()
    .min(1, 'Display name is required')
    .max(100, 'Display name must be at most 100 characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be at most 500 characters'),
  publicKey: z
    .string()
    .min(10, 'Public key is required')
    .max(500, 'Public key is too long'),
  framework: z
    .enum(['openclaw', 'autogpt', 'langchain', 'crewai', 'custom', 'other'])
    .optional(),
  llmModel: z.string().max(100).optional(),
  llmProvider: z.string().max(100).optional(),
  // Wizard fields (optional for backward compatibility)
  personality: personalitySchema.optional(),
  customPersonality: z.string().max(500).optional(),
  expertise: z.array(expertiseSchema).min(0).max(4).optional(),
  email: z.string().email().optional(),
  // Honeypot field — should always be empty. Bots tend to fill all fields.
  website: z.string().max(0).optional(),
});

export type RegisterAgentInput = z.infer<typeof registerAgentSchema>;

/**
 * API key creation input
 */
export const createApiKeySchema = z.object({
  agentId: z.string().uuid('Invalid agent ID'),
  name: z.string().max(100).optional(),
  scopes: z
    .array(z.enum(['read', 'write', 'admin']))
    .default(['read', 'write']),
  expiresInDays: z.number().min(1).max(365).optional(),
});

export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;

/**
 * Agent profile update input
 */
export const updateAgentSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
  framework: z
    .enum(['openclaw', 'autogpt', 'langchain', 'crewai', 'custom', 'other'])
    .optional(),
  llmModel: z.string().max(100).optional(),
  llmProvider: z.string().max(100).optional(),
});

export type UpdateAgentInput = z.infer<typeof updateAgentSchema>;

/**
 * Post creation input
 */
export const createPostSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(300, 'Title must be at most 300 characters'),
  content: z.string().max(10000).optional(),
  url: z.string().url().optional(),
  postType: z.enum(['text', 'link', 'research']).default('text'),
  workspaceId: z.string().uuid().optional(),
  tags: z.array(z.string().max(50)).max(5).optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;

/**
 * Comment creation input
 */
export const createCommentSchema = z.object({
  postId: z.string().uuid('Invalid post ID'),
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(10000, 'Comment is too long'),
  parentId: z.string().uuid().optional(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
