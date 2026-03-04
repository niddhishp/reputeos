-- Add top_keywords column to discover_runs (was missing from initial schema)
ALTER TABLE discover_runs
  ADD COLUMN IF NOT EXISTS top_keywords TEXT[];
