-- Migration 002: Add insight columns to positioning table
-- Run this in Supabase SQL Editor

ALTER TABLE positioning
  ADD COLUMN IF NOT EXISTS root_cause_insights JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS strategic_insights   JSONB DEFAULT '[]'::jsonb;

-- Also ensure the lsi_runs table has an inputs column (for audit trail)
ALTER TABLE lsi_runs
  ADD COLUMN IF NOT EXISTS inputs JSONB DEFAULT '{}'::jsonb;

-- Index for faster positioning lookups
CREATE INDEX IF NOT EXISTS idx_positioning_client_id ON positioning(client_id);
CREATE INDEX IF NOT EXISTS idx_lsi_runs_client_date  ON lsi_runs(client_id, run_date DESC);
