-- Migration 016: Stripe billing integration
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Stripe identifiers
  stripe_customer_id      TEXT UNIQUE,
  stripe_subscription_id  TEXT,

  -- Plan state
  plan_id                 TEXT,                            -- 'solo' | 'agency' | 'enterprise' | null
  add_ons                 TEXT[]       DEFAULT '{}',       -- ['shield_pro', 'discover_only']
  subscription_status     TEXT         DEFAULT 'none',     -- 'active' | 'trialing' | 'past_due' | 'cancelled' | 'pending' | 'none'

  -- Scan credits
  scan_credits            INTEGER      DEFAULT 0,
  scans_used_this_month   INTEGER      DEFAULT 0,
  scans_reset_at          TIMESTAMPTZ,

  -- Trial
  is_trial                BOOLEAN      DEFAULT FALSE,
  trial_ends_at           TIMESTAMPTZ,

  -- Timestamps
  created_at              TIMESTAMPTZ  DEFAULT NOW(),
  updated_at              TIMESTAMPTZ  DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_user_subscriptions_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_user_subscriptions_updated_at();

-- RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscription
CREATE POLICY "users_read_own_subscription"
  ON user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can write (webhook handler uses service role)
CREATE POLICY "service_role_write_subscriptions"
  ON user_subscriptions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_subs_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subs_stripe_customer ON user_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_subs_plan ON user_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_subs_status ON user_subscriptions(subscription_status);

-- Give all existing users a 14-day trial on solo plan
INSERT INTO user_subscriptions (user_id, plan_id, subscription_status, is_trial, trial_ends_at, scan_credits)
SELECT
  id,
  'solo',
  'trialing',
  TRUE,
  NOW() + INTERVAL '14 days',
  30
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
