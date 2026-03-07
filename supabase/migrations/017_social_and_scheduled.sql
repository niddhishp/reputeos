-- Migration 017: Social connections + scheduled posts

-- Social OAuth connections
CREATE TABLE IF NOT EXISTS social_connections (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform          TEXT NOT NULL,                -- 'linkedin' | 'twitter'
  access_token      TEXT NOT NULL,
  refresh_token     TEXT,
  token_expires_at  TIMESTAMPTZ,
  platform_user_id  TEXT NOT NULL DEFAULT '',
  platform_username TEXT,
  platform_email    TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_social_connections" ON social_connections FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_social_connections_user_platform ON social_connections(user_id, platform);

-- Scheduled posts
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id        UUID REFERENCES clients(id) ON DELETE SET NULL,
  content_item_id  UUID REFERENCES content_items(id) ON DELETE SET NULL,
  platform         TEXT NOT NULL DEFAULT 'linkedin',
  text             TEXT NOT NULL,
  scheduled_at     TIMESTAMPTZ NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'published' | 'failed' | 'cancelled'
  published_url    TEXT,
  published_at     TIMESTAMPTZ,
  error_message    TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_scheduled_posts" ON scheduled_posts FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user   ON scheduled_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_client ON scheduled_posts(client_id);
