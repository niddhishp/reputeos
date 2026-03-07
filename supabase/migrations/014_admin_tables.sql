-- Migration 014: Admin infrastructure tables
-- system_prompts: editable AI prompts stored in DB
-- api_usage_log:  per-call tracking for all external API calls
-- scan_events:    lightweight log of every scan start/complete/fail

-- ─── system_prompts ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS system_prompts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key         TEXT NOT NULL UNIQUE,   -- e.g. 'discovery_agent_media'
  module      TEXT NOT NULL,          -- 'discover' | 'diagnose' | 'position' | 'express' | 'shield'
  label       TEXT NOT NULL,          -- human-readable name
  description TEXT,
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT,          -- optional template with {variables}
  model       TEXT,                   -- override model for this prompt
  temperature NUMERIC DEFAULT 0.4,
  max_tokens  INTEGER DEFAULT 4000,
  is_active   BOOLEAN DEFAULT TRUE,
  updated_by  UUID REFERENCES auth.users,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default prompts (so the editor has something to show)
INSERT INTO system_prompts (key, module, label, description, system_prompt) VALUES
  ('discovery_overview_agent', 'discover', 'Discovery — Overview Agent',
   'Generates the subject overview card in the discovery report',
   'You are a professional reputation intelligence analyst. Analyse the scan data provided and generate a factual subject overview. Ground every claim in the scan evidence. Never invent facts not supported by the data.'),
  ('discovery_media_agent', 'discover', 'Discovery — Media Framing Agent',
   'Analyses media coverage and narrative framing',
   'You are a media intelligence analyst. Analyse the scan results and identify how media frames this subject. Base your analysis strictly on found results. Distinguish between confirmed coverage and absence of coverage.'),
  ('discovery_social_agent', 'discover', 'Discovery — Social & Digital Agent',
   'Assesses social media presence and digital footprint',
   'You are a digital presence analyst. Assess the subject''s social media and digital footprint based on scan evidence. Estimate follower ranges from contextual clues. Flag unverified inferences explicitly.'),
  ('diagnose_lsi_agent', 'diagnose', 'Diagnose — LSI Scoring Agent',
   'Calculates the Leadership Sentiment Index score',
   'You are an LSI scoring analyst. Calculate the reputation score based on six components. Be conservative — only credit confirmed, verified signals. Absence of evidence is not evidence of absence, but cannot be scored positively.'),
  ('position_archetype_agent', 'position', 'Position — Archetype Assignment Agent',
   'Assigns strategic archetypes based on profile analysis',
   'You are a strategic positioning consultant. Assign the most appropriate professional archetype based on verified career evidence. Justify every recommendation with specific evidence from the profile.'),
  ('position_content_pillars_agent', 'position', 'Position — Content Pillars Agent',
   'Generates content strategy pillars',
   'You are a content strategy architect. Design content pillars that are specific to the subject''s actual expertise and verified credentials. No generic advice — every pillar must be grounded in their demonstrated domain knowledge.'),
  ('express_content_agent', 'express', 'Express — Content Generation Agent',
   'Generates thought leadership content',
   'You are a ghostwriter for C-suite executives and creative professionals. Write in the subject''s archetype voice. Every piece must pass NLP compliance: 2+ authority markers, correct frame usage, archetype-consistent tone.'),
  ('shield_legal_agent', 'shield', 'Shield Pro — Legal Analysis Agent',
   'Analyses legal scan results for risk signals',
   'You are a legal reputation intelligence analyst. Analyse search results from Indian legal databases. Report only confirmed findings. Distinguish between material legal exposure and absence of findings. Never infer guilt from ambiguous results.')
ON CONFLICT (key) DO NOTHING;

-- ─── api_usage_log ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_usage_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service     TEXT NOT NULL,          -- 'serpapi' | 'openrouter' | 'exa' | 'firecrawl' | 'apify'
  operation   TEXT NOT NULL,          -- e.g. 'google_search' | 'chat_completion' | 'neural_search'
  model       TEXT,                   -- for AI calls
  user_id     UUID REFERENCES auth.users,
  client_id   UUID REFERENCES clients(id) ON DELETE SET NULL,
  scan_type   TEXT,                   -- 'discover' | 'legal' | 'lsi' | 'content'
  tokens_in   INTEGER,
  tokens_out  INTEGER,
  cost_usd    NUMERIC(10,6),          -- estimated cost in USD
  latency_ms  INTEGER,
  status      TEXT DEFAULT 'success', -- 'success' | 'error' | 'timeout'
  error_msg   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS api_usage_log_service_idx   ON api_usage_log(service);
CREATE INDEX IF NOT EXISTS api_usage_log_user_id_idx   ON api_usage_log(user_id);
CREATE INDEX IF NOT EXISTS api_usage_log_created_at_idx ON api_usage_log(created_at DESC);
CREATE INDEX IF NOT EXISTS api_usage_log_scan_type_idx  ON api_usage_log(scan_type);

-- ─── scan_events ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scan_events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users,
  client_id   UUID REFERENCES clients(id) ON DELETE SET NULL,
  scan_type   TEXT NOT NULL,          -- 'discover' | 'lsi' | 'legal' | 'content'
  status      TEXT NOT NULL,          -- 'started' | 'completed' | 'failed'
  duration_ms INTEGER,
  total_cost_usd NUMERIC(10,4),
  sources_queried INTEGER,
  results_found   INTEGER,
  error_msg   TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS scan_events_user_id_idx    ON scan_events(user_id);
CREATE INDEX IF NOT EXISTS scan_events_created_at_idx ON scan_events(created_at DESC);
CREATE INDEX IF NOT EXISTS scan_events_scan_type_idx  ON scan_events(scan_type);

-- RLS — admin only (check user_metadata role)
ALTER TABLE system_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_log  ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_events    ENABLE ROW LEVEL SECURITY;

-- system_prompts: readable by all authenticated, writable by admins only
CREATE POLICY "Authenticated users can read prompts"
  ON system_prompts FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Admins can manage prompts"
  ON system_prompts FOR ALL
  USING ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('admin', 'superadmin'))
  WITH CHECK ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('admin', 'superadmin'));

-- api_usage_log: admins can read all; system can insert
CREATE POLICY "Admins can read usage log"
  ON api_usage_log FOR SELECT
  USING ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('admin', 'superadmin'));

CREATE POLICY "Service can insert usage"
  ON api_usage_log FOR INSERT WITH CHECK (TRUE);

-- scan_events: admins see all; users see own
CREATE POLICY "Admins can read all scan events"
  ON scan_events FOR SELECT
  USING ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('admin', 'superadmin'));

CREATE POLICY "Users can read own scan events"
  ON scan_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service can insert scan events"
  ON scan_events FOR INSERT WITH CHECK (TRUE);
