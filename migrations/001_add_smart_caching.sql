-- Migration: Add smart caching and tier management
-- Date: 2025-01-15

-- Enhanced cache table with change detection
CREATE TABLE IF NOT EXISTS analysis_cache (
  id SERIAL PRIMARY KEY,
  url TEXT NOT NULL,
  url_hash VARCHAR(64) UNIQUE NOT NULL,
  content_hash VARCHAR(64) NOT NULL,
  last_modified TEXT,
  etag TEXT,
  analysis_result JSONB NOT NULL,
  tier VARCHAR(20) NOT NULL DEFAULT 'starter',
  cached_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  hit_count INTEGER DEFAULT 0,
  CONSTRAINT unique_url_tier UNIQUE(url_hash, tier)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cache_expires ON analysis_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_cache_url_tier ON analysis_cache(url_hash, tier);

-- Track savings from cache hits
CREATE TABLE IF NOT EXISTS cache_savings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  date DATE NOT NULL,
  cache_hits INTEGER DEFAULT 0,
  api_calls_saved INTEGER DEFAULT 0,
  cost_saved DECIMAL(10,4) DEFAULT 0,
  UNIQUE(user_id, date)
);

-- Usage limits configuration
CREATE TABLE IF NOT EXISTS usage_limits (
  tier VARCHAR(20) PRIMARY KEY,
  daily_analyses INTEGER NOT NULL,
  max_pages_per_analysis INTEGER NOT NULL,
  ai_pages_limit INTEGER NOT NULL,
  cache_duration_days INTEGER NOT NULL,
  features JSONB NOT NULL
);

-- Insert tier configurations
INSERT INTO usage_limits (tier, daily_analyses, max_pages_per_analysis, ai_pages_limit, cache_duration_days, features) VALUES
('starter', 1, 50, 0, 30, '{"html_extraction": true, "ai_analysis": false, "basic_export": true}'),
('growth', 999, 1000, 200, 7, '{"html_extraction": true, "ai_analysis": true, "file_history": true, "priority_support": true, "smart_caching": true}'),
('scale', 999, 999999, 999999, 3, '{"html_extraction": true, "ai_analysis": true, "file_history": true, "priority_support": true, "smart_caching": true, "white_label": true, "api_access": true}')
ON CONFLICT (tier) DO NOTHING;

-- Usage tracking table
CREATE TABLE IF NOT EXISTS usage_tracking (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  date DATE NOT NULL,
  analyses_count INTEGER DEFAULT 0,
  pages_processed INTEGER DEFAULT 0,
  ai_calls_count INTEGER DEFAULT 0,
  html_extractions_count INTEGER DEFAULT 0,
  cache_hits INTEGER DEFAULT 0,
  total_cost DECIMAL(10,4) DEFAULT 0,
  UNIQUE(user_id, date)
);

-- Add tier column to users table (for now, we'll track by email)
ALTER TABLE "emailCaptures" ADD COLUMN IF NOT EXISTS tier VARCHAR(20) DEFAULT 'starter';

-- Add user association to existing analyses
ALTER TABLE "sitemapAnalysis" ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE "sitemapAnalysis" ADD COLUMN IF NOT EXISTS cost_estimate DECIMAL(10,4);
ALTER TABLE "sitemapAnalysis" ADD COLUMN IF NOT EXISTS actual_cost DECIMAL(10,4);
ALTER TABLE "sitemapAnalysis" ADD COLUMN IF NOT EXISTS cache_hits INTEGER DEFAULT 0;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_sitemap_analysis_user_email ON "sitemapAnalysis"(user_email);
CREATE INDEX IF NOT EXISTS idx_email_captures_tier ON "emailCaptures"(tier);