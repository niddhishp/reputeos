-- Migration 003: Influencer discovery & content DNA system
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS influencer_profiles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id       UUID REFERENCES clients(id) ON DELETE CASCADE,

  -- Identity
  name            TEXT NOT NULL,
  linkedin_url    TEXT,
  archetype       TEXT,
  industry        TEXT,

  -- Lightweight discovery scan
  scan_status     TEXT DEFAULT 'pending' CHECK (scan_status IN ('pending','scanning','completed','failed')),
  total_mentions  INTEGER,
  sentiment_dist  JSONB,
  frame_dist      JSONB,
  top_keywords    TEXT[],

  -- Content DNA
  content_dna           JSONB,
  sample_posts          JSONB,

  -- Scoring
  archetype_fit_score   NUMERIC,
  content_quality_score NUMERIC,
  aspiration_score      NUMERIC,

  -- Adaptation for the client
  style_adaptation_notes TEXT,
  uniqueness_guardrails  TEXT[],
  content_template       TEXT,

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS influencer_content_samples (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  influencer_id     UUID REFERENCES influencer_profiles(id) ON DELETE CASCADE,

  url               TEXT NOT NULL,
  platform          TEXT,
  content_text      TEXT,

  hook              TEXT,
  structure         JSONB,
  style             JSONB,
  emotional_triggers TEXT[],
  authority_markers  TEXT[],

  estimated_engagement_rate NUMERIC,
  analyzed_at               TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_influencer_profiles_client    ON influencer_profiles(client_id);
CREATE INDEX IF NOT EXISTS idx_influencer_profiles_archetype ON influencer_profiles(archetype);
CREATE INDEX IF NOT EXISTS idx_influencer_samples_influencer ON influencer_content_samples(influencer_id);

-- RLS
ALTER TABLE influencer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_content_samples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own influencer profiles"
  ON influencer_profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = influencer_profiles.client_id
        AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users access own influencer samples"
  ON influencer_content_samples FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM influencer_profiles ip
      JOIN clients c ON c.id = ip.client_id
      WHERE ip.id = influencer_content_samples.influencer_id
        AND c.user_id = auth.uid()
    )
  );
