-- Base schema for LLM.txt Mastery
-- This creates the original tables that the application expects

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS "emailCaptures" (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  "websiteUrl" TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'free',
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "sitemapAnalysis" (
  id SERIAL PRIMARY KEY,
  url TEXT NOT NULL,
  "sitemapContent" JSONB,
  "discoveredPages" JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  "analysisMetadata" JSONB,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "llmTextFiles" (
  id SERIAL PRIMARY KEY,
  "analysisId" INTEGER REFERENCES "sitemapAnalysis"(id),
  "selectedPages" JSONB,
  content TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_captures_email ON "emailCaptures"(email);
CREATE INDEX IF NOT EXISTS idx_sitemap_analysis_url ON "sitemapAnalysis"(url);
CREATE INDEX IF NOT EXISTS idx_sitemap_analysis_status ON "sitemapAnalysis"(status);
CREATE INDEX IF NOT EXISTS idx_llm_files_analysis_id ON "llmTextFiles"("analysisId");