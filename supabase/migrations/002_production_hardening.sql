-- =============================================================================
-- Migration 002: Production Hardening
-- Adds missing indexes, RLS policies, and constraints
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Performance Indexes (critical for query speed at scale)
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_clients_updated_at ON clients(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_discover_runs_client_id ON discover_runs(client_id);
CREATE INDEX IF NOT EXISTS idx_discover_runs_created_at ON discover_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discover_runs_status ON discover_runs(status);

CREATE INDEX IF NOT EXISTS idx_lsi_runs_client_id ON lsi_runs(client_id);
CREATE INDEX IF NOT EXISTS idx_lsi_runs_run_date ON lsi_runs(run_date DESC);

CREATE INDEX IF NOT EXISTS idx_positioning_client_id ON positioning(client_id);

CREATE INDEX IF NOT EXISTS idx_content_items_client_id ON content_items(client_id);
CREATE INDEX IF NOT EXISTS idx_content_items_status ON content_items(status);
CREATE INDEX IF NOT EXISTS idx_content_items_created_at ON content_items(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alerts_client_id ON alerts(client_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status) WHERE status = 'new';
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_competitors_client_id ON competitors(client_id);

CREATE INDEX IF NOT EXISTS idx_influencer_templates_client_id ON influencer_templates(client_id);

-- ---------------------------------------------------------------------------
-- Enable RLS on tables that may be missing it
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS influencer_templates ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- RLS Policies: competitors
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'competitors' AND policyname = 'Users can view own competitors'
  ) THEN
    CREATE POLICY "Users can view own competitors"
      ON competitors FOR SELECT
      USING (EXISTS (
        SELECT 1 FROM clients
        WHERE clients.id = competitors.client_id
          AND clients.user_id = auth.uid()
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'competitors' AND policyname = 'Users can insert own competitors'
  ) THEN
    CREATE POLICY "Users can insert own competitors"
      ON competitors FOR INSERT
      WITH CHECK (EXISTS (
        SELECT 1 FROM clients
        WHERE clients.id = competitors.client_id
          AND clients.user_id = auth.uid()
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'competitors' AND policyname = 'Users can update own competitors'
  ) THEN
    CREATE POLICY "Users can update own competitors"
      ON competitors FOR UPDATE
      USING (EXISTS (
        SELECT 1 FROM clients
        WHERE clients.id = competitors.client_id
          AND clients.user_id = auth.uid()
      ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'competitors' AND policyname = 'Users can delete own competitors'
  ) THEN
    CREATE POLICY "Users can delete own competitors"
      ON competitors FOR DELETE
      USING (EXISTS (
        SELECT 1 FROM clients
        WHERE clients.id = competitors.client_id
          AND clients.user_id = auth.uid()
      ));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- RLS Policies: influencer_templates
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'influencer_templates' AND policyname = 'Users can manage own influencer templates'
  ) THEN
    CREATE POLICY "Users can manage own influencer templates"
      ON influencer_templates FOR ALL
      USING (EXISTS (
        SELECT 1 FROM clients
        WHERE clients.id = influencer_templates.client_id
          AND clients.user_id = auth.uid()
      ))
      WITH CHECK (EXISTS (
        SELECT 1 FROM clients
        WHERE clients.id = influencer_templates.client_id
          AND clients.user_id = auth.uid()
      ));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- RLS Policies: user_profiles (users can only see their own profile)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile"
      ON user_profiles FOR SELECT
      USING (auth.uid() = id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON user_profiles FOR UPDATE
      USING (auth.uid() = id);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Content items: add missing 'topic' column if not present
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_items' AND column_name = 'topic'
  ) THEN
    ALTER TABLE content_items ADD COLUMN topic TEXT;
  END IF;
END $$;

-- Add content column if named differently
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_items' AND column_name = 'content'
  ) THEN
    ALTER TABLE content_items ADD COLUMN content TEXT;
  END IF;
END $$;

-- Add ai_metadata column
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_items' AND column_name = 'ai_metadata'
  ) THEN
    ALTER TABLE content_items ADD COLUMN ai_metadata JSONB;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Function: auto-update updated_at timestamps
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
DO $$ 
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['clients', 'positioning', 'content_items', 'competitors'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = 'trigger_' || t || '_updated_at'
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER trigger_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
        t, t
      );
    END IF;
  END LOOP;
END $$;
