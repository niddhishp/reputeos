/**
 * Database Types for ReputeOS
 * 
 * This file contains TypeScript type definitions for all database tables.
 * These types are derived from the Supabase schema.
 */

// =============================================================================
// Enums
// =============================================================================

export type ClientStatus = 'active' | 'archived' | 'paused';

export type ContentPlatform = 'linkedin' | 'twitter' | 'medium' | 'op_ed' | 'keynote' | 'other';

export type ContentStatus = 'draft' | 'review' | 'approved' | 'published' | 'archived';

export type DiscoverStatus = 'pending' | 'running' | 'completed' | 'failed';

export type MentionSourceType = 'news' | 'social' | 'blog' | 'forum' | 'review' | 'other';

export type SentimentLabel = 'positive' | 'neutral' | 'negative';

export type FrameType = 'family' | 'expert' | 'founder' | 'crisis' | 'innovator' | 'other';

export type AlertType = 'mention_spike' | 'sentiment_drop' | 'negative_mention' | 'crisis_detected' | 'opportunity' | 'system';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export type Theme = 'light' | 'dark' | 'system';

// =============================================================================
// Core Tables
// =============================================================================

export interface Client {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  title: string | null;
  company: string | null;
  industry: string | null;
  bio: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  website_url: string | null;
  avatar_url: string | null;
  status: ClientStatus;
  created_at: string;
  updated_at: string;
}

export interface Positioning {
  id: string;
  client_id: string;
  personal_archetype: string | null;
  content_pillars: ContentPillar[];
  voice_characteristics: VoiceCharacteristics;
  target_audience: TargetAudience | null;
  key_messages: string[];
  competitive_position: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentPillar {
  id?: string;
  name: string;
  description?: string;
}

export interface VoiceCharacteristics {
  tone?: string;
  formality?: string;
  sentenceStyle?: string;
  vocabularyLevel?: string;
}

export interface TargetAudience {
  primary?: string;
  secondary?: string;
  demographics?: Record<string, unknown>;
}

// =============================================================================
// LSI Tables
// =============================================================================

export interface LSIComponents {
  c1: number; // Search Reputation (0-20)
  c2: number; // Media Framing (0-20)
  c3: number; // Social Backlash (0-20)
  c4: number; // Elite Discourse (0-15)
  c5: number; // Third-Party Validation (0-15)
  c6: number; // Crisis Moat (0-10)
}

export interface LSIStats {
  mean: number;
  stddev: number;
  ucl: number;
  lcl: number;
}

export interface LSIGap {
  component: string;
  gap: number;
  priority: number;
}

export interface LSIRun {
  id: string;
  client_id: string;
  run_date: string;
  total_score: number;
  components: LSIComponents;
  stats: LSIStats;
  gaps: LSIGap[];
  recommendations: LSIRecommendation[];
  source_run_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface LSIRecommendation {
  component: string;
  action: string;
  timeline: string;
  expectedImpact: string;
}

// =============================================================================
// Discover Tables
// =============================================================================

export interface DiscoverRun {
  id: string;
  client_id: string;
  status: DiscoverStatus;
  progress: number;
  sources_searched: string[];
  total_mentions: number;
  sentiment_summary: SentimentSummary;
  frame_distribution: FrameDistribution;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  created_at: string;
}

export interface SentimentSummary {
  positive: number;
  neutral: number;
  negative: number;
  average: number;
}

export interface FrameDistribution {
  family?: number;
  expert?: number;
  founder?: number;
  crisis?: number;
  innovator?: number;
  other?: number;
}

export interface Mention {
  id: string;
  discover_run_id: string;
  client_id: string;
  source: string;
  source_type: MentionSourceType;
  url: string | null;
  title: string | null;
  snippet: string | null;
  content: string | null;
  sentiment: number | null;
  sentiment_label: SentimentLabel | null;
  frame: FrameType | null;
  author: string | null;
  author_followers: number | null;
  engagement_score: number | null;
  mention_date: string | null;
  is_responded: boolean;
  response_text: string | null;
  created_at: string;
}

// =============================================================================
// Content Tables
// =============================================================================

export interface ContentItem {
  id: string;
  client_id: string;
  platform: ContentPlatform;
  topic: string;
  content: string;
  status: ContentStatus;
  scheduled_at: string | null;
  published_at: string | null;
  published_url: string | null;
  ai_metadata: AIMetadata;
  nlp_compliance: NLPCompliance | null;
  performance_metrics: PerformanceMetrics | null;
  template_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AIMetadata {
  model?: string;
  tokens_used?: number;
  finish_reason?: string;
  generation_time_ms?: number;
}

export interface NLPCompliance {
  score: number;
  violations: NLPViolation[];
  strengths: string[];
  improvements: string[];
}

export interface NLPViolation {
  type: string;
  text: string;
  suggestion: string;
  severity: 'low' | 'medium' | 'high';
}

export interface PerformanceMetrics {
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  click_through_rate?: number;
  engagement_rate?: number;
}

// =============================================================================
// Shield Tables
// =============================================================================

export interface Alert {
  id: string;
  client_id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string | null;
  source_mention_id: string | null;
  is_read: boolean;
  is_actioned: boolean;
  action_taken: string | null;
  created_at: string;
}

// =============================================================================
// Competitor Tables
// =============================================================================

export interface Competitor {
  id: string;
  client_id: string;
  name: string;
  company: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  website_url: string | null;
  lsi_score: number | null;
  lsi_components: Partial<LSIComponents> | null;
  strengths: string[];
  weaknesses: string[];
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// Template Tables
// =============================================================================

export interface Template {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  platform: ContentPlatform;
  structure: TemplateStructure;
  example_content: string | null;
  tags: string[];
  is_public: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface TemplateStructure {
  opening?: string;
  body?: string;
  closing?: string;
  sections?: Array<{ name: string; description: string }>;
}

// =============================================================================
// User Tables
// =============================================================================

export interface UserSettings {
  id: string;
  user_id: string;
  email_notifications: boolean;
  alert_notifications: boolean;
  weekly_reports: boolean;
  default_client_id: string | null;
  theme: Theme;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  client_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// =============================================================================
// API Types
// =============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ApiError {
  error: string;
  message: string;
  details?: unknown;
  code?: string;
}

// =============================================================================
// Utility Types
// =============================================================================

export type Insert<T> = Omit<T, 'id' | 'created_at' | 'updated_at'>;

export type Update<T> = Partial<Insert<T>>;

export type WithId<T> = T & { id: string };
