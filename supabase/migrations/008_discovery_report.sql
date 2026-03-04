-- Migration 008: Rich discovery report column
-- Stores the full AI-generated narrative discovery report

ALTER TABLE discover_runs
  ADD COLUMN IF NOT EXISTS discovery_report JSONB;

-- Index for fast retrieval
CREATE INDEX IF NOT EXISTS idx_discover_runs_discovery_report
  ON discover_runs USING GIN (discovery_report);

COMMENT ON COLUMN discover_runs.discovery_report IS
  'Full AI-generated SRE narrative discovery report: profile, social standing, search identity, media framing, risk layers, diagnosis';
