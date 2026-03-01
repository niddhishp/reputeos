-- Migration: Add new columns to discover_runs for 62-source scan engine
-- Run this in Supabase SQL Editor

-- Add new columns to discover_runs
ALTER TABLE discover_runs
  ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_stage TEXT,
  ADD COLUMN IF NOT EXISTS sources_total INTEGER DEFAULT 62,
  ADD COLUMN IF NOT EXISTS sources_completed INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS error_message TEXT,
  ADD COLUMN IF NOT EXISTS analysis_summary TEXT,
  ADD COLUMN IF NOT EXISTS archetype_hints TEXT[],
  ADD COLUMN IF NOT EXISTS crisis_signals TEXT[],
  ADD COLUMN IF NOT EXISTS lsi_preliminary NUMERIC,
  ADD COLUMN IF NOT EXISTS module_summary JSONB,
  ADD COLUMN IF NOT EXISTS scan_errors TEXT[],
  ADD COLUMN IF NOT EXISTS scan_duration_ms INTEGER,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add discover_run_id foreign key to lsi_runs
ALTER TABLE lsi_runs
  ADD COLUMN IF NOT EXISTS discover_run_id UUID REFERENCES discover_runs(id);

-- Index for fast polling queries
CREATE INDEX IF NOT EXISTS idx_discover_runs_client_created
  ON discover_runs(client_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_discover_runs_status
  ON discover_runs(status);

-- Index for LSI history queries
CREATE INDEX IF NOT EXISTS idx_lsi_runs_client_date
  ON lsi_runs(client_id, run_date DESC);

-- Enable realtime on discover_runs (for live progress updates)
-- Run this in Supabase Dashboard > Database > Replication if not already enabled
-- ALTER PUBLICATION supabase_realtime ADD TABLE discover_runs;

-- Verify columns added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'discover_runs'
ORDER BY ordinal_position;
