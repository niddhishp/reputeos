-- Migration 009: Extended client profile
-- Adds social_links, keywords, role, target_lsi, and bio columns that the edit form needs

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS role         TEXT,
  ADD COLUMN IF NOT EXISTS keywords     TEXT[],
  ADD COLUMN IF NOT EXISTS target_lsi   NUMERIC DEFAULT 75,
  ADD COLUMN IF NOT EXISTS baseline_lsi NUMERIC,
  ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS bio          TEXT;

-- Index for keyword search
CREATE INDEX IF NOT EXISTS idx_clients_keywords ON clients USING GIN(keywords);
