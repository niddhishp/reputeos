-- Add narrative fields to lsi_runs for the explanatory layer
ALTER TABLE lsi_runs
  ADD COLUMN IF NOT EXISTS component_rationale   JSONB,   -- per-component: what's driving score + gaps
  ADD COLUMN IF NOT EXISTS risk_heatmap          JSONB,   -- identity dimension risk matrix
  ADD COLUMN IF NOT EXISTS identified_strengths  JSONB,   -- key strengths with evidence
  ADD COLUMN IF NOT EXISTS risk_factors          JSONB,   -- reputation risks with specifics
  ADD COLUMN IF NOT EXISTS peer_comparison       JSONB,   -- named peer benchmarks
  ADD COLUMN IF NOT EXISTS target_state          JSONB,   -- 12-month target metrics
  ADD COLUMN IF NOT EXISTS intervention_plan     JSONB;   -- 0-3, 3-9, 9-12 month actions

-- Also store search query analysis on discover_runs
ALTER TABLE discover_runs
  ADD COLUMN IF NOT EXISTS search_query_analysis JSONB,   -- per-query score + rationale
  ADD COLUMN IF NOT EXISTS platform_assessment   JSONB;   -- LinkedIn/X/other platform breakdown
