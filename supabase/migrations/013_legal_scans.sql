-- Migration 013: Shield Pro legal_scans table
-- Run in Supabase SQL editor

CREATE TABLE IF NOT EXISTS legal_scans (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed')),
  result      JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS legal_scans_client_id_idx ON legal_scans(client_id);
CREATE INDEX IF NOT EXISTS legal_scans_created_at_idx ON legal_scans(created_at DESC);

-- RLS
ALTER TABLE legal_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own legal scans"
  ON legal_scans
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = legal_scans.client_id
        AND clients.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = legal_scans.client_id
        AND clients.user_id = auth.uid()
    )
  );
