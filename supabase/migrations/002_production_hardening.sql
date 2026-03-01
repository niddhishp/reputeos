-- =============================================================================
-- Migration 002: Production Hardening
-- Only adds what is genuinely missing from 001_initial_schema.sql
-- Safe to re-run (all statements use IF NOT EXISTS / DO $$ guards)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Additional indexes not already in 001
-- ---------------------------------------------------------------------------

-- clients
CREATE INDEX IF NOT EXISTS idx_clients_user_id       ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_updated_at    ON clients(updated_at DESC);

-- discover_runs
CREATE INDEX IF NOT EXISTS idx_discover_runs_client_id   ON discover_runs(client_id);
CREATE INDEX IF NOT EXISTS idx_discover_runs_created_at  ON discover_runs(created_at DESC);

-- lsi_runs
CREATE INDEX IF NOT EXISTS idx_lsi_runs_client_id   ON lsi_runs(client_id);
CREATE INDEX IF NOT EXISTS idx_lsi_runs_run_date    ON lsi_runs(run_date DESC);

-- positioning
CREATE INDEX IF NOT EXISTS idx_positioning_client_id ON positioning(client_id);

-- alerts — use is_read (actual column name, not status)
CREATE INDEX IF NOT EXISTS idx_alerts_client_id   ON alerts(client_id);
CREATE INDEX IF NOT EXISTS idx_alerts_severity    ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at  ON alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_is_read     ON alerts(is_read) WHERE is_read = FALSE;

-- competitors
CREATE INDEX IF NOT EXISTS idx_competitors_client_id ON competitors(client_id);

-- influencer_templates (may not exist yet — wrapped in DO block)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'influencer_templates') THEN
    CREATE INDEX IF NOT EXISTS idx_influencer_templates_client_id ON influencer_templates(client_id);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- RLS: competitors (001 may be missing this)
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS competitors ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='competitors' AND policyname='Users can view own competitors') THEN
    CREATE POLICY "Users can view own competitors" ON competitors FOR SELECT
      USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = competitors.client_id AND clients.user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='competitors' AND policyname='Users can insert own competitors') THEN
    CREATE POLICY "Users can insert own competitors" ON competitors FOR INSERT
      WITH CHECK (EXISTS (SELECT 1 FROM clients WHERE clients.id = competitors.client_id AND clients.user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='competitors' AND policyname='Users can update own competitors') THEN
    CREATE POLICY "Users can update own competitors" ON competitors FOR UPDATE
      USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = competitors.client_id AND clients.user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='competitors' AND policyname='Users can delete own competitors') THEN
    CREATE POLICY "Users can delete own competitors" ON competitors FOR DELETE
      USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = competitors.client_id AND clients.user_id = auth.uid()));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- user_profiles table (missing from 001 entirely — create it)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role       TEXT DEFAULT 'consultant' CHECK (role IN ('consultant', 'client_view', 'admin')),
  plan       TEXT DEFAULT 'solo'       CHECK (plan IN ('solo', 'agency', 'enterprise')),
  name       TEXT,
  company    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_profiles' AND policyname='Users can view own profile') THEN
    CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT
      USING (auth.uid() = id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_profiles' AND policyname='Users can update own profile') THEN
    CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE
      USING (auth.uid() = id);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- influencer_templates table (create only if missing)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS influencer_templates (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id          UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  influencer_name    TEXT NOT NULL,
  influencer_url     TEXT,
  structure          JSONB,
  style              JSONB,
  emotional_triggers TEXT[],
  linguistic_patterns JSONB,
  template_text      TEXT,
  posts_created      INTEGER DEFAULT 0,
  avg_engagement_rate NUMERIC,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE influencer_templates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='influencer_templates' AND policyname='Users can manage own influencer templates') THEN
    CREATE POLICY "Users can manage own influencer templates" ON influencer_templates FOR ALL
      USING (EXISTS (SELECT 1 FROM clients WHERE clients.id = influencer_templates.client_id AND clients.user_id = auth.uid()))
      WITH CHECK (EXISTS (SELECT 1 FROM clients WHERE clients.id = influencer_templates.client_id AND clients.user_id = auth.uid()));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- content_items: add ai_metadata column if missing
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='content_items' AND column_name='ai_metadata') THEN
    ALTER TABLE content_items ADD COLUMN ai_metadata JSONB;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- auto updated_at trigger function (safe to recreate)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables that have updated_at but may be missing trigger
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['clients','positioning','content_items','competitors'] LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = t AND column_name = 'updated_at'
    ) AND NOT EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_' || t || '_updated_at'
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER trigger_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
        t, t
      );
    END IF;
  END LOOP;
END $$;
