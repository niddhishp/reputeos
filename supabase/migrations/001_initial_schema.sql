-- =============================================================================
-- REPUTEOS - Initial Database Schema
-- =============================================================================
-- This migration creates the core database schema for the ReputeOS platform.
-- Run this in your Supabase SQL Editor to set up the database.
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- USERS TABLE (handled by Supabase Auth, but we reference it)
-- =============================================================================
-- Supabase Auth manages the auth.users table automatically

-- =============================================================================
-- CLIENTS TABLE
-- =============================================================================
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    title TEXT,
    company TEXT,
    industry TEXT,
    bio TEXT,
    linkedin_url TEXT,
    twitter_url TEXT,
    website_url TEXT,
    avatar_url TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'paused')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own clients" ON clients
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create clients" ON clients
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients" ON clients
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients" ON clients
    FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_created_at ON clients(created_at DESC);

-- =============================================================================
-- POSITIONING TABLE
-- =============================================================================
CREATE TABLE positioning (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    personal_archetype TEXT,
    content_pillars JSONB DEFAULT '[]'::jsonb,
    voice_characteristics JSONB DEFAULT '{}'::jsonb,
    target_audience JSONB DEFAULT '{}'::jsonb,
    key_messages JSONB DEFAULT '[]'::jsonb,
    competitive_position TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(client_id)
);

-- Enable RLS
ALTER TABLE positioning ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users access through their clients)
CREATE POLICY "Users can view positioning for own clients" ON positioning
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = positioning.client_id 
            AND clients.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage positioning for own clients" ON positioning
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = positioning.client_id 
            AND clients.user_id = auth.uid()
        )
    );

-- Indexes
CREATE INDEX idx_positioning_client_id ON positioning(client_id);

-- =============================================================================
-- LSI RUNS TABLE
-- =============================================================================
CREATE TABLE lsi_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    run_date TIMESTAMPTZ DEFAULT NOW(),
    total_score NUMERIC(5,2) NOT NULL CHECK (total_score >= 0 AND total_score <= 100),
    components JSONB NOT NULL DEFAULT '{}'::jsonb,
    stats JSONB DEFAULT '{}'::jsonb,
    gaps JSONB DEFAULT '[]'::jsonb,
    recommendations JSONB DEFAULT '[]'::jsonb,
    source_run_id UUID REFERENCES lsi_runs(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE lsi_runs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view LSI runs for own clients" ON lsi_runs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = lsi_runs.client_id 
            AND clients.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create LSI runs for own clients" ON lsi_runs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = lsi_runs.client_id 
            AND clients.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update LSI runs for own clients" ON lsi_runs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = lsi_runs.client_id 
            AND clients.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete LSI runs for own clients" ON lsi_runs
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = lsi_runs.client_id 
            AND clients.user_id = auth.uid()
        )
    );

-- Indexes
CREATE INDEX idx_lsi_runs_client_id ON lsi_runs(client_id);
CREATE INDEX idx_lsi_runs_run_date ON lsi_runs(run_date DESC);
CREATE INDEX idx_lsi_runs_total_score ON lsi_runs(total_score);

-- =============================================================================
-- DISCOVER RUNS TABLE
-- =============================================================================
CREATE TABLE discover_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    sources_searched JSONB DEFAULT '[]'::jsonb,
    total_mentions INTEGER DEFAULT 0,
    sentiment_summary JSONB DEFAULT '{}'::jsonb,
    frame_distribution JSONB DEFAULT '{}'::jsonb,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE discover_runs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view discover runs for own clients" ON discover_runs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = discover_runs.client_id 
            AND clients.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage discover runs for own clients" ON discover_runs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = discover_runs.client_id 
            AND clients.user_id = auth.uid()
        )
    );

-- Indexes
CREATE INDEX idx_discover_runs_client_id ON discover_runs(client_id);
CREATE INDEX idx_discover_runs_status ON discover_runs(status);
CREATE INDEX idx_discover_runs_created_at ON discover_runs(created_at DESC);

-- =============================================================================
-- MENTIONS TABLE (extracted from discover_runs JSONB for better performance)
-- =============================================================================
CREATE TABLE mentions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    discover_run_id UUID NOT NULL REFERENCES discover_runs(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    source TEXT NOT NULL,
    source_type TEXT CHECK (source_type IN ('news', 'social', 'blog', 'forum', 'review', 'other')),
    url TEXT,
    title TEXT,
    snippet TEXT,
    content TEXT,
    sentiment NUMERIC(3,2) CHECK (sentiment >= -1 AND sentiment <= 1),
    sentiment_label TEXT CHECK (sentiment_label IN ('positive', 'neutral', 'negative')),
    frame TEXT CHECK (frame IN ('family', 'expert', 'founder', 'crisis', 'innovator', 'other')),
    author TEXT,
    author_followers INTEGER,
    engagement_score NUMERIC(5,2),
    mention_date TIMESTAMPTZ,
    is_responded BOOLEAN DEFAULT FALSE,
    response_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE mentions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view mentions for own clients" ON mentions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = mentions.client_id 
            AND clients.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage mentions for own clients" ON mentions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = mentions.client_id 
            AND clients.user_id = auth.uid()
        )
    );

-- Indexes
CREATE INDEX idx_mentions_run_id ON mentions(discover_run_id);
CREATE INDEX idx_mentions_client_id ON mentions(client_id);
CREATE INDEX idx_mentions_sentiment ON mentions(sentiment);
CREATE INDEX idx_mentions_frame ON mentions(frame);
CREATE INDEX idx_mentions_mention_date ON mentions(mention_date DESC);
CREATE INDEX idx_mentions_source_type ON mentions(source_type);

-- =============================================================================
-- CONTENT ITEMS TABLE
-- =============================================================================
CREATE TABLE content_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'twitter', 'medium', 'op_ed', 'keynote', 'other')),
    topic TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'published', 'archived')),
    scheduled_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    published_url TEXT,
    ai_metadata JSONB DEFAULT '{}'::jsonb,
    nlp_compliance JSONB DEFAULT '{}'::jsonb,
    performance_metrics JSONB DEFAULT '{}'::jsonb,
    template_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view content for own clients" ON content_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = content_items.client_id 
            AND clients.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage content for own clients" ON content_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = content_items.client_id 
            AND clients.user_id = auth.uid()
        )
    );

-- Indexes
CREATE INDEX idx_content_items_client_id ON content_items(client_id);
CREATE INDEX idx_content_items_status ON content_items(status);
CREATE INDEX idx_content_items_platform ON content_items(platform);
CREATE INDEX idx_content_items_created_at ON content_items(created_at DESC);
CREATE INDEX idx_content_items_client_platform ON content_items(client_id, platform);

-- =============================================================================
-- ALERTS TABLE (SHIELD Module)
-- =============================================================================
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('mention_spike', 'sentiment_drop', 'negative_mention', 'crisis_detected', 'opportunity', 'system')),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title TEXT NOT NULL,
    description TEXT,
    source_mention_id UUID REFERENCES mentions(id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT FALSE,
    is_actioned BOOLEAN DEFAULT FALSE,
    action_taken TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view alerts for own clients" ON alerts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = alerts.client_id 
            AND clients.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage alerts for own clients" ON alerts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = alerts.client_id 
            AND clients.user_id = auth.uid()
        )
    );

-- Indexes
CREATE INDEX idx_alerts_client_id ON alerts(client_id);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_is_read ON alerts(is_read);
CREATE INDEX idx_alerts_created_at ON alerts(created_at DESC);
CREATE INDEX idx_alerts_client_severity ON alerts(client_id, severity);

-- =============================================================================
-- COMPETITORS TABLE
-- =============================================================================
CREATE TABLE competitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    company TEXT,
    linkedin_url TEXT,
    twitter_url TEXT,
    website_url TEXT,
    lsi_score NUMERIC(5,2),
    lsi_components JSONB DEFAULT '{}'::jsonb,
    strengths JSONB DEFAULT '[]'::jsonb,
    weaknesses JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view competitors for own clients" ON competitors
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = competitors.client_id 
            AND clients.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage competitors for own clients" ON competitors
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM clients 
            WHERE clients.id = competitors.client_id 
            AND clients.user_id = auth.uid()
        )
    );

-- Indexes
CREATE INDEX idx_competitors_client_id ON competitors(client_id);
CREATE INDEX idx_competitors_is_active ON competitors(is_active);

-- =============================================================================
-- TEMPLATES TABLE
-- =============================================================================
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'twitter', 'medium', 'op_ed', 'keynote', 'other')),
    structure JSONB NOT NULL DEFAULT '{}'::jsonb,
    example_content TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    is_public BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own templates" ON templates
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public templates" ON templates
    FOR SELECT USING (is_public = TRUE);

CREATE POLICY "Users can manage own templates" ON templates
    FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_templates_user_id ON templates(user_id);
CREATE INDEX idx_templates_platform ON templates(platform);
CREATE INDEX idx_templates_is_public ON templates(is_public);

-- =============================================================================
-- USER SETTINGS TABLE
-- =============================================================================
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT TRUE,
    alert_notifications BOOLEAN DEFAULT TRUE,
    weekly_reports BOOLEAN DEFAULT TRUE,
    default_client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    timezone TEXT DEFAULT 'UTC',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own settings" ON user_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own settings" ON user_settings
    FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- =============================================================================
-- ACTIVITY LOG TABLE (for audit trail)
-- =============================================================================
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only see their own activity)
CREATE POLICY "Users can view own activity" ON activity_log
    FOR SELECT USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX idx_activity_log_client_id ON activity_log(client_id);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX idx_activity_log_action ON activity_log(action);

-- =============================================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================================

-- Update updated_at timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all tables with updated_at column
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_positioning_updated_at BEFORE UPDATE ON positioning
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_items_updated_at BEFORE UPDATE ON content_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_competitors_updated_at BEFORE UPDATE ON competitors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to log activity
CREATE OR REPLACE FUNCTION log_activity(
    p_user_id UUID,
    p_client_id UUID,
    p_action TEXT,
    p_entity_type TEXT,
    p_entity_id UUID,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO activity_log (user_id, client_id, action, entity_type, entity_id, metadata)
    VALUES (p_user_id, p_client_id, p_action, p_entity_type, p_entity_id, p_metadata)
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- REALTIME SUBSCRIPTIONS SETUP
-- =============================================================================
-- Enable realtime for specific tables
ALTER PUBLICATION supabase_realtime ADD TABLE discover_runs;
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE mentions;

-- =============================================================================
-- INITIAL DATA (Optional)
-- =============================================================================
-- Add any default templates or data here

-- Example template (optional, can be removed)
-- INSERT INTO templates (user_id, name, description, platform, structure, is_public)
-- VALUES (
--     '00000000-0000-0000-0000-000000000000', -- Replace with actual admin user_id
--     'Leadership Insight',
--     'A template for sharing leadership lessons and insights',
--     'linkedin',
--     '{"opening": "Hook with a challenge or observation", "body": "Share the lesson or insight", "closing": "Call to action or question"}'::jsonb,
--     TRUE
-- );
