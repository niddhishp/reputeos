-- Migration 015: Performance indexes for admin tables and high-traffic queries
-- Run in Supabase SQL Editor

-- api_usage_log indexes (missing from 014)
CREATE INDEX IF NOT EXISTS idx_api_usage_user_id    ON api_usage_log(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_service    ON api_usage_log(service);
CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON api_usage_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_status     ON api_usage_log(status);
CREATE INDEX IF NOT EXISTS idx_api_usage_client_id  ON api_usage_log(client_id);

-- scan_events indexes (missing from 014)
CREATE INDEX IF NOT EXISTS idx_scan_events_user_id    ON scan_events(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_events_client_id  ON scan_events(client_id);
CREATE INDEX IF NOT EXISTS idx_scan_events_created_at ON scan_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scan_events_status     ON scan_events(status);

-- High-traffic client queries
CREATE INDEX IF NOT EXISTS idx_clients_user_id    ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_status     ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at DESC);

-- LSI runs — most frequent query is latest run per client
CREATE INDEX IF NOT EXISTS idx_lsi_runs_client_created ON lsi_runs(client_id, created_at DESC);

-- Discover runs
CREATE INDEX IF NOT EXISTS idx_discover_runs_client_created ON discover_runs(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discover_runs_status         ON discover_runs(status);

-- Content items
CREATE INDEX IF NOT EXISTS idx_content_items_client_id  ON content_items(client_id);
CREATE INDEX IF NOT EXISTS idx_content_items_status     ON content_items(status);
CREATE INDEX IF NOT EXISTS idx_content_items_platform   ON content_items(platform);
CREATE INDEX IF NOT EXISTS idx_content_items_created_at ON content_items(created_at DESC);

-- Alerts
CREATE INDEX IF NOT EXISTS idx_alerts_client_status ON alerts(client_id, status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity      ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at    ON alerts(created_at DESC);

-- system_prompts — admin fetches by module
CREATE INDEX IF NOT EXISTS idx_system_prompts_module    ON system_prompts(module);
CREATE INDEX IF NOT EXISTS idx_system_prompts_is_active ON system_prompts(is_active);
