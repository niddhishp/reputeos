-- =============================================================================
-- Migration 003: Security Fixes
-- Fixes mutable search_path warnings on database functions.
-- Run this in Supabase SQL Editor.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Fix 1: update_updated_at_column
-- Adds SET search_path = '' to prevent schema hijacking attacks
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Fix 2: log_activity
-- Preserves original function logic, adds SET search_path = ''
-- Uses pg_catalog.now() instead of NOW() since search_path is locked
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_activity(
  p_user_id    UUID,
  p_client_id  UUID,
  p_action     TEXT,
  p_entity_type TEXT,
  p_entity_id  UUID,
  p_metadata   JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.activity_log (user_id, client_id, action, entity_type, entity_id, metadata)
  VALUES (p_user_id, p_client_id, p_action, p_entity_type, p_entity_id, p_metadata)
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- Note on Issue 1: Leaked Password Protection
-- This cannot be fixed via SQL — enable it in the dashboard:
-- Authentication → Sign In / Up → Password Protection → Enable "Check for leaked passwords"
-- ---------------------------------------------------------------------------
