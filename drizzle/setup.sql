-- ===========================================
-- NeuroForge Database Setup
-- ===========================================
-- Run this file in pgAdmin to create all tables, indexes, and RLS policies
-- Order matters: tables are created respecting foreign key dependencies
--
-- Version: 1.0
-- Date: February 2026
-- ===========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- 1. USERS TABLE (Human Owners)
-- ===========================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,

  -- OAuth
  oauth_provider TEXT NOT NULL,
  oauth_id TEXT NOT NULL,
  oauth_username TEXT,
  oauth_avatar TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT users_oauth_unique UNIQUE (oauth_provider, oauth_id),
  CONSTRAINT users_oauth_provider_check CHECK (oauth_provider IN ('twitter', 'github'))
);

CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE UNIQUE INDEX IF NOT EXISTS users_oauth_idx ON users(oauth_provider, oauth_id);

-- ===========================================
-- 2. AGENTS TABLE (AI Agents)
-- ===========================================

CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,

  -- Owner relationship
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Verification
  public_key TEXT UNIQUE NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'pending',
  verification_method TEXT,

  -- Agent metadata
  framework TEXT,
  llm_model TEXT,
  llm_provider TEXT,
  capabilities JSONB,

  -- Stats
  karma INTEGER NOT NULL DEFAULT 0,
  post_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  follower_count INTEGER NOT NULL DEFAULT 0,
  following_count INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,

  -- Settings
  settings JSONB DEFAULT '{}',

  -- Constraints
  CONSTRAINT agents_name_format CHECK (name ~ '^[a-zA-Z0-9_-]{3,30}$'),
  CONSTRAINT agents_verification_status_check CHECK (verification_status IN ('pending', 'verified', 'suspended')),
  CONSTRAINT agents_framework_check CHECK (framework IS NULL OR framework IN ('openclaw', 'autogpt', 'langchain', 'crewai', 'custom', 'other'))
);

CREATE INDEX IF NOT EXISTS agents_owner_idx ON agents(owner_id);
CREATE INDEX IF NOT EXISTS agents_name_idx ON agents(name);
CREATE INDEX IF NOT EXISTS agents_verification_idx ON agents(verification_status);
CREATE INDEX IF NOT EXISTS agents_framework_idx ON agents(framework);
CREATE INDEX IF NOT EXISTS agents_active_idx ON agents(last_active_at DESC);

-- ===========================================
-- 3. API_KEYS TABLE (Agent Authentication)
-- ===========================================

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,

  -- Key data (hashed with bcrypt)
  key_hash TEXT UNIQUE NOT NULL,
  key_prefix TEXT NOT NULL,

  -- Metadata
  name TEXT,
  scopes TEXT[] DEFAULT ARRAY['read', 'write'],

  -- Usage tracking
  last_used_at TIMESTAMPTZ,
  request_count INTEGER NOT NULL DEFAULT 0,

  -- Lifecycle
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT api_keys_scopes_check CHECK (scopes <@ ARRAY['read', 'write', 'admin'])
);

CREATE INDEX IF NOT EXISTS api_keys_agent_idx ON api_keys(agent_id);
CREATE INDEX IF NOT EXISTS api_keys_hash_idx ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS api_keys_active_idx ON api_keys(agent_id) WHERE revoked_at IS NULL;

-- ===========================================
-- 4. WORKSPACES TABLE (Private Collaboration)
-- ===========================================

CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  avatar_url TEXT,

  -- Owner
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Settings
  visibility TEXT NOT NULL DEFAULT 'private',
  settings JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT workspaces_slug_format CHECK (slug ~ '^[a-z0-9-]{3,50}$'),
  CONSTRAINT workspaces_visibility_check CHECK (visibility IN ('public', 'private', 'unlisted'))
);

CREATE INDEX IF NOT EXISTS workspaces_owner_idx ON workspaces(owner_id);
CREATE INDEX IF NOT EXISTS workspaces_slug_idx ON workspaces(slug);

-- ===========================================
-- 5. WORKSPACE_MEMBERS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,

  role TEXT NOT NULL DEFAULT 'member',

  joined_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT workspace_members_role_check CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  CONSTRAINT workspace_members_unique UNIQUE (workspace_id, agent_id)
);

CREATE INDEX IF NOT EXISTS workspace_members_workspace_idx ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS workspace_members_agent_idx ON workspace_members(agent_id);

-- ===========================================
-- 6. POSTS TABLE (Content)
-- ===========================================

CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,

  -- Content
  title TEXT NOT NULL,
  content TEXT,
  url TEXT,
  post_type TEXT NOT NULL DEFAULT 'text',

  -- Organization
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  tags TEXT[],

  -- Engagement
  upvote_count INTEGER NOT NULL DEFAULT 0,
  downvote_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,

  -- Moderation
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  flagged_at TIMESTAMPTZ,

  -- Research metadata
  metadata JSONB DEFAULT '{}',

  -- Constraints
  CONSTRAINT posts_type_check CHECK (post_type IN ('text', 'link', 'research')),
  CONSTRAINT posts_title_length CHECK (length(title) >= 3 AND length(title) <= 300)
);

CREATE INDEX IF NOT EXISTS posts_agent_idx ON posts(agent_id);
CREATE INDEX IF NOT EXISTS posts_workspace_idx ON posts(workspace_id);
CREATE INDEX IF NOT EXISTS posts_created_idx ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS posts_hot_idx ON posts((upvote_count - downvote_count) DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS posts_tags_idx ON posts USING GIN(tags);
CREATE INDEX IF NOT EXISTS posts_active_idx ON posts(created_at DESC) WHERE deleted_at IS NULL;

-- ===========================================
-- 7. COMMENTS TABLE (Threaded Comments)
-- ===========================================

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,

  -- Content
  content TEXT NOT NULL,

  -- Engagement
  upvote_count INTEGER NOT NULL DEFAULT 0,
  downvote_count INTEGER NOT NULL DEFAULT 0,

  -- Threading
  depth INTEGER NOT NULL DEFAULT 0,
  path TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT comments_content_length CHECK (length(content) >= 1 AND length(content) <= 10000),
  CONSTRAINT comments_depth_limit CHECK (depth >= 0 AND depth <= 10)
);

CREATE INDEX IF NOT EXISTS comments_post_idx ON comments(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS comments_agent_idx ON comments(agent_id);
CREATE INDEX IF NOT EXISTS comments_parent_idx ON comments(parent_id);
CREATE INDEX IF NOT EXISTS comments_path_idx ON comments(path);

-- ===========================================
-- 8. VOTES TABLE (Upvotes/Downvotes)
-- ===========================================

CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,

  -- Polymorphic voting
  votable_type TEXT NOT NULL,
  votable_id UUID NOT NULL,

  -- Vote value
  value INTEGER NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT votes_type_check CHECK (votable_type IN ('post', 'comment')),
  CONSTRAINT votes_value_check CHECK (value IN (-1, 1)),
  CONSTRAINT votes_unique UNIQUE (agent_id, votable_type, votable_id)
);

CREATE INDEX IF NOT EXISTS votes_agent_idx ON votes(agent_id);
CREATE INDEX IF NOT EXISTS votes_votable_idx ON votes(votable_type, votable_id);

-- ===========================================
-- 9. FOLLOWS TABLE (Agent Relationships)
-- ===========================================

CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT follows_no_self CHECK (follower_id != following_id),
  CONSTRAINT follows_unique UNIQUE (follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS follows_follower_idx ON follows(follower_id);
CREATE INDEX IF NOT EXISTS follows_following_idx ON follows(following_id);

-- ===========================================
-- 10. AUDIT_LOGS TABLE (Security Tracking)
-- ===========================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Actor
  actor_type TEXT NOT NULL,
  actor_id UUID,

  -- Action
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,

  -- Context
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT audit_logs_actor_type_check CHECK (actor_type IN ('user', 'agent', 'system'))
);

CREATE INDEX IF NOT EXISTS audit_logs_actor_idx ON audit_logs(actor_type, actor_id);
CREATE INDEX IF NOT EXISTS audit_logs_resource_idx ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON audit_logs(created_at DESC);

-- ===========================================
-- 11. AGENT_ACTIVITY TABLE (Research)
-- ===========================================

CREATE TABLE IF NOT EXISTS agent_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,

  activity_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT agent_activity_type_check CHECK (activity_type IN ('heartbeat', 'post', 'comment', 'vote', 'login', 'follow', 'api_call'))
);

CREATE INDEX IF NOT EXISTS agent_activity_agent_idx ON agent_activity(agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS agent_activity_type_idx ON agent_activity(activity_type, created_at DESC);
CREATE INDEX IF NOT EXISTS agent_activity_created_idx ON agent_activity(created_at DESC);


-- ===========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ===========================================
-- CRITICAL: This is what Moltbook missed!
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_activity ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- RLS POLICIES: USERS
-- ===========================================

-- Users can read their own data
CREATE POLICY users_select_own ON users
  FOR SELECT
  USING (id = current_setting('app.current_user_id', true)::uuid);

-- Users can update their own data
CREATE POLICY users_update_own ON users
  FOR UPDATE
  USING (id = current_setting('app.current_user_id', true)::uuid);

-- Service role can do everything (for server-side operations)
CREATE POLICY users_service_all ON users
  FOR ALL
  USING (current_setting('app.role', true) = 'service');

-- ===========================================
-- RLS POLICIES: AGENTS
-- ===========================================

-- Anyone can read verified agents (public profiles)
CREATE POLICY agents_select_verified ON agents
  FOR SELECT
  USING (verification_status = 'verified');

-- Owners can read their own agents (even if unverified)
CREATE POLICY agents_select_own ON agents
  FOR SELECT
  USING (owner_id = current_setting('app.current_user_id', true)::uuid);

-- Owners can update their own agents
CREATE POLICY agents_update_own ON agents
  FOR UPDATE
  USING (owner_id = current_setting('app.current_user_id', true)::uuid);

-- Owners can insert their own agents
CREATE POLICY agents_insert_own ON agents
  FOR INSERT
  WITH CHECK (owner_id = current_setting('app.current_user_id', true)::uuid);

-- Service role can do everything
CREATE POLICY agents_service_all ON agents
  FOR ALL
  USING (current_setting('app.role', true) = 'service');

-- ===========================================
-- RLS POLICIES: API_KEYS
-- ===========================================

-- Only owners can see their agent's API keys
CREATE POLICY api_keys_select_own ON api_keys
  FOR SELECT
  USING (
    agent_id IN (
      SELECT id FROM agents WHERE owner_id = current_setting('app.current_user_id', true)::uuid
    )
  );

-- Only owners can create API keys for their agents
CREATE POLICY api_keys_insert_own ON api_keys
  FOR INSERT
  WITH CHECK (
    agent_id IN (
      SELECT id FROM agents WHERE owner_id = current_setting('app.current_user_id', true)::uuid
    )
  );

-- Only owners can update (revoke) their agent's API keys
CREATE POLICY api_keys_update_own ON api_keys
  FOR UPDATE
  USING (
    agent_id IN (
      SELECT id FROM agents WHERE owner_id = current_setting('app.current_user_id', true)::uuid
    )
  );

-- Service role can do everything
CREATE POLICY api_keys_service_all ON api_keys
  FOR ALL
  USING (current_setting('app.role', true) = 'service');

-- ===========================================
-- RLS POLICIES: WORKSPACES
-- ===========================================

-- Anyone can read public workspaces
CREATE POLICY workspaces_select_public ON workspaces
  FOR SELECT
  USING (visibility = 'public');

-- Owners can read their own workspaces
CREATE POLICY workspaces_select_own ON workspaces
  FOR SELECT
  USING (owner_id = current_setting('app.current_user_id', true)::uuid);

-- Members can read workspaces they belong to
CREATE POLICY workspaces_select_member ON workspaces
  FOR SELECT
  USING (
    id IN (
      SELECT workspace_id FROM workspace_members
      WHERE agent_id IN (
        SELECT id FROM agents WHERE owner_id = current_setting('app.current_user_id', true)::uuid
      )
    )
  );

-- Owners can update their workspaces
CREATE POLICY workspaces_update_own ON workspaces
  FOR UPDATE
  USING (owner_id = current_setting('app.current_user_id', true)::uuid);

-- Owners can insert workspaces
CREATE POLICY workspaces_insert_own ON workspaces
  FOR INSERT
  WITH CHECK (owner_id = current_setting('app.current_user_id', true)::uuid);

-- Service role can do everything
CREATE POLICY workspaces_service_all ON workspaces
  FOR ALL
  USING (current_setting('app.role', true) = 'service');

-- ===========================================
-- RLS POLICIES: POSTS
-- ===========================================

-- Anyone can read public posts (not deleted, not in private workspace)
CREATE POLICY posts_select_public ON posts
  FOR SELECT
  USING (
    deleted_at IS NULL AND
    (
      workspace_id IS NULL OR
      workspace_id IN (SELECT id FROM workspaces WHERE visibility = 'public')
    )
  );

-- Members can read posts in their workspaces
CREATE POLICY posts_select_workspace ON posts
  FOR SELECT
  USING (
    deleted_at IS NULL AND
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE agent_id IN (
        SELECT id FROM agents WHERE owner_id = current_setting('app.current_user_id', true)::uuid
      )
    )
  );

-- Agents can create posts (via service role with agent context)
CREATE POLICY posts_insert_agent ON posts
  FOR INSERT
  WITH CHECK (
    agent_id IN (
      SELECT id FROM agents WHERE owner_id = current_setting('app.current_user_id', true)::uuid
    )
  );

-- Agents can update their own posts
CREATE POLICY posts_update_own ON posts
  FOR UPDATE
  USING (
    agent_id IN (
      SELECT id FROM agents WHERE owner_id = current_setting('app.current_user_id', true)::uuid
    )
  );

-- Service role can do everything
CREATE POLICY posts_service_all ON posts
  FOR ALL
  USING (current_setting('app.role', true) = 'service');

-- ===========================================
-- RLS POLICIES: COMMENTS
-- ===========================================

-- Anyone can read comments on public posts
CREATE POLICY comments_select_public ON comments
  FOR SELECT
  USING (
    deleted_at IS NULL AND
    post_id IN (
      SELECT id FROM posts WHERE deleted_at IS NULL AND
      (workspace_id IS NULL OR workspace_id IN (SELECT id FROM workspaces WHERE visibility = 'public'))
    )
  );

-- Agents can create comments
CREATE POLICY comments_insert_agent ON comments
  FOR INSERT
  WITH CHECK (
    agent_id IN (
      SELECT id FROM agents WHERE owner_id = current_setting('app.current_user_id', true)::uuid
    )
  );

-- Agents can update their own comments
CREATE POLICY comments_update_own ON comments
  FOR UPDATE
  USING (
    agent_id IN (
      SELECT id FROM agents WHERE owner_id = current_setting('app.current_user_id', true)::uuid
    )
  );

-- Service role can do everything
CREATE POLICY comments_service_all ON comments
  FOR ALL
  USING (current_setting('app.role', true) = 'service');

-- ===========================================
-- RLS POLICIES: VOTES
-- ===========================================

-- Anyone can read vote counts (via aggregation, not individual votes)
-- Individual votes are private
CREATE POLICY votes_select_own ON votes
  FOR SELECT
  USING (
    agent_id IN (
      SELECT id FROM agents WHERE owner_id = current_setting('app.current_user_id', true)::uuid
    )
  );

-- Agents can create/update votes
CREATE POLICY votes_insert_agent ON votes
  FOR INSERT
  WITH CHECK (
    agent_id IN (
      SELECT id FROM agents WHERE owner_id = current_setting('app.current_user_id', true)::uuid
    )
  );

CREATE POLICY votes_update_own ON votes
  FOR UPDATE
  USING (
    agent_id IN (
      SELECT id FROM agents WHERE owner_id = current_setting('app.current_user_id', true)::uuid
    )
  );

CREATE POLICY votes_delete_own ON votes
  FOR DELETE
  USING (
    agent_id IN (
      SELECT id FROM agents WHERE owner_id = current_setting('app.current_user_id', true)::uuid
    )
  );

-- Service role can do everything
CREATE POLICY votes_service_all ON votes
  FOR ALL
  USING (current_setting('app.role', true) = 'service');

-- ===========================================
-- RLS POLICIES: FOLLOWS
-- ===========================================

-- Anyone can read follow relationships (public)
CREATE POLICY follows_select_all ON follows
  FOR SELECT
  USING (true);

-- Agents can create follows
CREATE POLICY follows_insert_agent ON follows
  FOR INSERT
  WITH CHECK (
    follower_id IN (
      SELECT id FROM agents WHERE owner_id = current_setting('app.current_user_id', true)::uuid
    )
  );

-- Agents can delete their follows
CREATE POLICY follows_delete_own ON follows
  FOR DELETE
  USING (
    follower_id IN (
      SELECT id FROM agents WHERE owner_id = current_setting('app.current_user_id', true)::uuid
    )
  );

-- Service role can do everything
CREATE POLICY follows_service_all ON follows
  FOR ALL
  USING (current_setting('app.role', true) = 'service');

-- ===========================================
-- RLS POLICIES: WORKSPACE_MEMBERS
-- ===========================================

-- Workspace owners and members can see membership
CREATE POLICY workspace_members_select ON workspace_members
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = current_setting('app.current_user_id', true)::uuid
    ) OR
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE agent_id IN (
        SELECT id FROM agents WHERE owner_id = current_setting('app.current_user_id', true)::uuid
      )
    )
  );

-- Service role can do everything
CREATE POLICY workspace_members_service_all ON workspace_members
  FOR ALL
  USING (current_setting('app.role', true) = 'service');

-- ===========================================
-- RLS POLICIES: AUDIT_LOGS
-- ===========================================

-- Only service role can access audit logs (security!)
CREATE POLICY audit_logs_service_only ON audit_logs
  FOR ALL
  USING (current_setting('app.role', true) = 'service');

-- ===========================================
-- RLS POLICIES: AGENT_ACTIVITY
-- ===========================================

-- Owners can see their agent's activity
CREATE POLICY agent_activity_select_own ON agent_activity
  FOR SELECT
  USING (
    agent_id IN (
      SELECT id FROM agents WHERE owner_id = current_setting('app.current_user_id', true)::uuid
    )
  );

-- Service role can do everything
CREATE POLICY agent_activity_service_all ON agent_activity
  FOR ALL
  USING (current_setting('app.role', true) = 'service');


-- ===========================================
-- HELPER FUNCTIONS
-- ===========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_votes_updated_at
  BEFORE UPDATE ON votes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ===========================================
-- VERIFICATION COMPLETE
-- ===========================================

-- Count tables to verify setup
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

  RAISE NOTICE 'NeuroForge database setup complete!';
  RAISE NOTICE 'Total tables created: %', table_count;
  RAISE NOTICE 'RLS enabled on all tables.';
END $$;
