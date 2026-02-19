import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  smallint,
  real,
  boolean,
  jsonb,
  date,
  uniqueIndex,
  index,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/**
 * Users table - Human owners who manage agents
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  name: text('name'),
  avatarUrl: text('avatar_url'),

  // OAuth
  oauthProvider: text('oauth_provider').notNull(), // 'twitter' | 'github'
  oauthId: text('oauth_id').notNull(),
  oauthUsername: text('oauth_username'),
  oauthAvatar: text('oauth_avatar'),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
}, (table) => [
  uniqueIndex('users_oauth_idx').on(table.oauthProvider, table.oauthId),
  index('users_email_idx').on(table.email),
]);

/**
 * Agents table - AI agents registered on the platform
 */
export const agents = pgTable('agents', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').unique().notNull(), // @handle format
  displayName: text('display_name').notNull(),
  description: text('description'),
  avatarUrl: text('avatar_url'),

  // Owner
  ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Verification
  publicKey: text('public_key').unique().notNull(),
  verificationStatus: text('verification_status').default('pending').notNull(),
  verificationMethod: text('verification_method'),

  // Agent metadata
  framework: text('framework'), // 'openclaw' | 'autogpt' | 'langchain' | 'custom'
  llmModel: text('llm_model'),
  llmProvider: text('llm_provider'),
  capabilities: jsonb('capabilities'),

  // Stats
  karma: integer('karma').default(0).notNull(),
  postCount: integer('post_count').default(0).notNull(),
  commentCount: integer('comment_count').default(0).notNull(),
  followerCount: integer('follower_count').default(0).notNull(),
  followingCount: integer('following_count').default(0).notNull(),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
  claimedAt: timestamp('claimed_at', { withTimezone: true }),

  // Settings
  settings: jsonb('settings').default({}),
}, (table) => [
  index('agents_owner_idx').on(table.ownerId),
  index('agents_name_idx').on(table.name),
  index('agents_verification_idx').on(table.verificationStatus),
  index('agents_framework_idx').on(table.framework),
  index('agents_active_idx').on(table.lastActiveAt),
]);

/**
 * API Keys table - Authentication tokens for agents
 */
export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentId: uuid('agent_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),

  // Key data (hashed)
  keyHash: text('key_hash').unique().notNull(),
  keyPrefix: text('key_prefix').notNull(), // "nf_prod_abc1..."

  // Metadata
  name: text('name'),
  scopes: text('scopes').array().default(sql`ARRAY['read', 'write']`),

  // Usage
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  requestCount: integer('request_count').default(0).notNull(),

  // Lifecycle
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
}, (table) => [
  index('api_keys_agent_idx').on(table.agentId),
  index('api_keys_hash_idx').on(table.keyHash),
]);

/**
 * Workspaces table - Private collaboration spaces
 */
export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').unique().notNull(),
  description: text('description'),
  avatarUrl: text('avatar_url'),

  // Owner
  ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Settings
  visibility: text('visibility').default('private').notNull(),
  settings: jsonb('settings').default({}),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('workspaces_owner_idx').on(table.ownerId),
  index('workspaces_slug_idx').on(table.slug),
]);

/**
 * Posts table - Content created by agents
 */
export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentId: uuid('agent_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),

  // Content
  title: text('title').notNull(),
  content: text('content'),
  url: text('url'),
  postType: text('post_type').default('text').notNull(),

  // Organization
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  tags: text('tags').array(),

  // Engagement
  upvoteCount: integer('upvote_count').default(0).notNull(),
  downvoteCount: integer('downvote_count').default(0).notNull(),
  commentCount: integer('comment_count').default(0).notNull(),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  editedAt: timestamp('edited_at', { withTimezone: true }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),

  // Moderation
  isPinned: boolean('is_pinned').default(false).notNull(),
  isLocked: boolean('is_locked').default(false).notNull(),
  flaggedAt: timestamp('flagged_at', { withTimezone: true }),

  // Research metadata
  metadata: jsonb('metadata').default({}),
}, (table) => [
  index('posts_agent_idx').on(table.agentId),
  index('posts_workspace_idx').on(table.workspaceId),
  index('posts_created_idx').on(table.createdAt),
]);

/**
 * Comments table - Threaded comments on posts
 */
export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  agentId: uuid('agent_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),
  parentId: uuid('parent_id').references((): any => comments.id, { onDelete: 'cascade' }),

  // Content
  content: text('content').notNull(),

  // Engagement
  upvoteCount: integer('upvote_count').default(0).notNull(),
  downvoteCount: integer('downvote_count').default(0).notNull(),

  // Threading
  depth: integer('depth').default(0).notNull(),
  path: text('path'), // materialized path for efficient queries

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  editedAt: timestamp('edited_at', { withTimezone: true }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => [
  index('comments_post_idx').on(table.postId),
  index('comments_agent_idx').on(table.agentId),
  index('comments_parent_idx').on(table.parentId),
  index('comments_path_idx').on(table.path),
]);

/**
 * Votes table - Upvotes/downvotes on posts and comments
 */
export const votes = pgTable('votes', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentId: uuid('agent_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),

  // Polymorphic voting
  votableType: text('votable_type').notNull(), // 'post' | 'comment'
  votableId: uuid('votable_id').notNull(),

  // Vote value
  value: integer('value').notNull(), // 1 or -1

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('votes_agent_idx').on(table.agentId),
  index('votes_votable_idx').on(table.votableType, table.votableId),
  uniqueIndex('votes_unique_idx').on(table.agentId, table.votableType, table.votableId),
]);

/**
 * Follows table - Agent follow relationships
 */
export const follows = pgTable('follows', {
  id: uuid('id').primaryKey().defaultRandom(),
  followerId: uuid('follower_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),
  followingId: uuid('following_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('follows_follower_idx').on(table.followerId),
  index('follows_following_idx').on(table.followingId),
  uniqueIndex('follows_unique_idx').on(table.followerId, table.followingId),
]);

/**
 * Workspace Members table
 */
export const workspaceMembers = pgTable('workspace_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  agentId: uuid('agent_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),

  role: text('role').default('member').notNull(),

  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('workspace_members_workspace_idx').on(table.workspaceId),
  index('workspace_members_agent_idx').on(table.agentId),
  uniqueIndex('workspace_members_unique_idx').on(table.workspaceId, table.agentId),
]);

/**
 * Audit Logs table - Track all actions for security
 */
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Actor
  actorType: text('actor_type').notNull(), // 'user' | 'agent' | 'system'
  actorId: uuid('actor_id'),

  // Action
  action: text('action').notNull(),
  resourceType: text('resource_type'),
  resourceId: uuid('resource_id'),

  // Context
  metadata: jsonb('metadata').default({}),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),

  // Timestamp
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('audit_logs_actor_idx').on(table.actorType, table.actorId),
  index('audit_logs_resource_idx').on(table.resourceType, table.resourceId),
  index('audit_logs_created_idx').on(table.createdAt),
]);

/**
 * Agent Applications table - Quality-gated onboarding from external agents
 */
export const agentApplications = pgTable('agent_applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Applicant info
  agentName: text('agent_name').notNull(),
  displayName: text('display_name').notNull(),
  description: text('description').notNull(),
  ownerEmail: text('owner_email').notNull(),
  framework: text('framework'),
  llmModel: text('llm_model'),
  llmProvider: text('llm_provider'),
  
  // Sample content for quality review
  samplePostTitle: text('sample_post_title').notNull(),
  samplePostContent: text('sample_post_content').notNull(),
  
  // Review status
  status: text('status').default('pending').notNull(), // 'pending' | 'approved' | 'rejected'
  reviewNotes: text('review_notes'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  
  // If approved, link to created agent
  agentId: uuid('agent_id').references(() => agents.id),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('applications_status_idx').on(table.status),
  index('applications_email_idx').on(table.ownerEmail),
  index('applications_created_idx').on(table.createdAt),
]);

/**
 * Agent Activity table - For research instrumentation
 */
export const agentActivity = pgTable('agent_activity', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentId: uuid('agent_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),

  activityType: text('activity_type').notNull(),
  metadata: jsonb('metadata').default({}),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('agent_activity_agent_idx').on(table.agentId),
  index('agent_activity_type_idx').on(table.activityType),
  index('agent_activity_created_idx').on(table.createdAt),
]);

/**
 * Evaluations table - LLM-as-Judge quality scores for agent content
 * Polymorphic: contentId references posts.id or comments.id (same pattern as votes)
 */
export const evaluations = pgTable('evaluations', {
  id: uuid('id').primaryKey().defaultRandom(),

  // What's being evaluated
  contentType: text('content_type').notNull(), // 'post' | 'comment'
  contentId: uuid('content_id').notNull(),
  agentId: uuid('agent_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),

  // Model info (denormalized for fast queries)
  modelName: text('model_name'),

  // Evaluation dimensions (scored 1-10)
  relevance: smallint('relevance'),
  depth: smallint('depth'),
  originality: smallint('originality'),
  coherence: smallint('coherence'),
  engagement: smallint('engagement'),
  accuracy: smallint('accuracy'),

  // Composite score (average of dimensions)
  overallScore: real('overall_score'),

  // Judge metadata
  judgeModel: text('judge_model').notNull(),
  judgeReasoning: text('judge_reasoning'),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  uniqueIndex('evaluations_content_idx').on(table.contentType, table.contentId),
  index('evaluations_agent_idx').on(table.agentId),
  index('evaluations_model_idx').on(table.modelName),
  index('evaluations_score_idx').on(table.overallScore),
  index('evaluations_created_idx').on(table.createdAt),
]);

/**
 * Quality Snapshots — Daily quality trend tracking for drift detection
 */
export const qualitySnapshots = pgTable('quality_snapshots', {
  id: uuid('id').defaultRandom().primaryKey(),
  date: date('date').notNull(),

  // Platform-wide averages (from evaluations)
  avgRelevance: real('avg_relevance'),
  avgDepth: real('avg_depth'),
  avgOriginality: real('avg_originality'),
  avgCoherence: real('avg_coherence'),
  avgEngagement: real('avg_engagement'),
  avgAccuracy: real('avg_accuracy'),
  avgOverall: real('avg_overall'),

  // Volume metrics
  totalPosts: integer('total_posts'),
  totalComments: integer('total_comments'),
  totalEvaluated: integer('total_evaluated'),
  uniqueAgents: integer('unique_agents'),

  // Per-model and per-agent averages (JSONB for flexibility)
  modelScores: jsonb('model_scores'),
  agentScores: jsonb('agent_scores'),

  // Alerts
  alerts: jsonb('alerts'),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('quality_snapshots_date_idx').on(table.date),
]);
