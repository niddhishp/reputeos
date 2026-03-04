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


-- Auto-create user_profiles row on signup (prevents dashboard crash for new users)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_profiles (id, role, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'consultant'),
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Backfill: create profile rows for existing users who don't have one
INSERT INTO public.user_profiles (id, role, name)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'role', 'consultant'),
  COALESCE(au.raw_user_meta_data->>'name', au.email)
FROM auth.users au
LEFT JOIN public.user_profiles up ON up.id = au.id
WHERE up.id IS NULL
ON CONFLICT (id) DO NOTHING;
