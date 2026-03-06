-- Migration 011: Store enriched scan results for report generation
-- The generate-report route needs the actual scan data, not just aggregated stats

ALTER TABLE discover_runs
  ADD COLUMN IF NOT EXISTS enriched_results JSONB;   -- top 200 results with URL, title, snippet, sentiment, frame

-- Index for the generate-report query
CREATE INDEX IF NOT EXISTS idx_discover_runs_enriched_results
  ON discover_runs USING GIN (enriched_results);

COMMENT ON COLUMN discover_runs.enriched_results IS
  'Top 200 enriched scan results: [{source, category, url, title, snippet, sentiment, frame, relevance_score}]';
