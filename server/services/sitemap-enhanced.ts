import { DiscoveredPage, UserTier } from "@shared/schema";
import { fetchPageContent, filterRelevantPages, SitemapEntry } from "./sitemap";
import { analyzePageContent } from "./openai";
import { 
  getCachedAnalysis, 
  hasPageChanged, 
  cacheAnalysis, 
  generateContentHash,
  trackCacheSavings,
  TIER_LIMITS
} from "./cache";
import * as cheerio from "cheerio";


export interface AnalysisMetrics {
  totalPages: number;
  cachedPages: number;
  analyzedPages: number;
  aiCallsUsed: number;
  htmlExtractionsUsed: number;
  estimatedCost: number;
  timeSaved: number; // in seconds
  cacheHit: boolean;
  processingTime: number;
  apiCalls: number;
  costSaved: number;
}

export async function analyzeDiscoveredPagesWithCache(
  entries: SitemapEntry[],
  userEmail: string,
  tier: UserTier
): Promise<{ pages: DiscoveredPage[], metrics: AnalysisMetrics }> {
  const relevantPages = filterRelevantPages(entries);
  const tierLimits = TIER_LIMITS[tier];
  
  // Apply tier-based page limit (bypass in development)
  let pagesToAnalyze: SitemapEntry[];
  
  if (process.env.NODE_ENV === 'development') {
    // Development mode: analyze all relevant pages (no tier limits)
    pagesToAnalyze = relevantPages;
    console.log(`🚀 [DEV MODE] Analyzing ALL ${pagesToAnalyze.length} pages for ${userEmail} (tier: ${tier}) - bypassing tier limit of ${tierLimits.maxPagesPerAnalysis}`);
  } else {
    // Production mode: respect tier limits
    const maxPages = Math.min(tierLimits.maxPagesPerAnalysis, relevantPages.length);
    pagesToAnalyze = relevantPages.slice(0, maxPages);
    console.log(`Analyzing ${pagesToAnalyze.length} pages for ${userEmail} (tier: ${tier})`);
  }
  
  const pages: DiscoveredPage[] = [];
  const startTime = Date.now();
  const metrics: AnalysisMetrics = {
    totalPages: pagesToAnalyze.length,
    cachedPages: 0,
    analyzedPages: 0,
    aiCallsUsed: 0,
    htmlExtractionsUsed: 0,
    estimatedCost: 0,
    timeSaved: 0,
    cacheHit: false,
    processingTime: 0,
    apiCalls: 0,
    costSaved: 0
  };
  
  // Track consecutive failures for bot protection
  let consecutiveFailures = 0;
  const MAX_CONSECUTIVE_FAILURES = 10;
  
  // Process pages in batches
  const BATCH_SIZE = 20;
  const CONCURRENT_BATCHES = 2;
  
  for (let i = 0; i < pagesToAnalyze.length; i += BATCH_SIZE * CONCURRENT_BATCHES) {
    const batchPromises = [];
    
    // Create concurrent batches
    for (let j = 0; j < CONCURRENT_BATCHES && i + j * BATCH_SIZE < pagesToAnalyze.length; j++) {
      const batchStart = i + j * BATCH_SIZE;
      const batchEnd = Math.min(batchStart + BATCH_SIZE, pagesToAnalyze.length);
      const batch = pagesToAnalyze.slice(batchStart, batchEnd);
      
      batchPromises.push(processBatchWithCache(batch, userEmail, tier, tierLimits.aiPagesLimit, metrics));
    }
    
    // Wait for all concurrent batches to complete
    const batchResults = await Promise.all(batchPromises);
    
    // Collect results and check for failures
    for (const batchResult of batchResults) {
      for (const result of batchResult) {
        if (result.success) {
          pages.push(result.page);
          consecutiveFailures = 0;
        } else {
          consecutiveFailures++;
        }
      }
    }
    
    // Early exit if bot protection detected
    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      console.log(`Detected potential bot protection (${consecutiveFailures} consecutive failures). Stopping analysis.`);
      break;
    }
    
    // Brief delay between batch groups
    if (i + BATCH_SIZE * CONCURRENT_BATCHES < pagesToAnalyze.length) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
  
  // Track cache savings
  if (metrics.cachedPages > 0) {
    await trackCacheSavings(userEmail, metrics.cachedPages, tier);
  }
  
  // Sort by quality score
  pages.sort((a, b) => b.qualityScore - a.qualityScore);
  
  // Update final metrics
  metrics.processingTime = (Date.now() - startTime) / 1000;
  metrics.cacheHit = metrics.cachedPages > 0;
  metrics.apiCalls = metrics.aiCallsUsed + metrics.htmlExtractionsUsed;
  metrics.costSaved = metrics.timeSaved * 0.01; // Rough estimate
  
  return { pages, metrics };
}

async function processBatchWithCache(
  batch: SitemapEntry[],
  userEmail: string,
  tier: UserTier,
  aiPagesLimit: number,
  metrics: AnalysisMetrics
): Promise<Array<{ page: DiscoveredPage, success: boolean }>> {
  const results = [];
  
  for (const entry of batch) {
    try {
      const startTime = Date.now();
      
      // Check cache first
      const cached = await getCachedAnalysis(entry.url, tier);
      
      if (cached && cached.expiresAt > new Date()) {
        // Check if content has changed
        const changed = await hasPageChanged(entry.url, cached);
        
        if (!changed) {
          // Use cached result
          const analysisResult = JSON.parse(cached.analysisResult as any);
          results.push({
            page: {
              ...analysisResult,
              url: entry.url,
              lastModified: entry.lastmod,
              cached: true
            },
            success: true
          });
          
          metrics.cachedPages++;
          metrics.timeSaved += 3; // Average 3 seconds saved per cached page
          continue;
        }
      }
      
      // Fetch and analyze content
      const content = await fetchPageContent(entry.url);
      const contentHash = generateContentHash(content);
      
      // Extract HTTP caching headers
      const $ = cheerio.load(content);
      const lastModified = $('meta[http-equiv="last-modified"]').attr('content');
      const etag = $('meta[name="etag"]').attr('content');
      
      // Determine if we should use AI based on tier and current usage
      const shouldUseAI = tier !== 'starter' && metrics.aiCallsUsed < aiPagesLimit;
      
      // Analyze the page
      const analysis = await analyzePageContent(entry.url, content, shouldUseAI);
      
      // Update metrics
      metrics.analyzedPages++;
      if (shouldUseAI) {
        metrics.aiCallsUsed++;
        metrics.estimatedCost += 0.03; // Approximate GPT-4 cost
      } else {
        metrics.htmlExtractionsUsed++;
        metrics.estimatedCost += 0.001; // Basic processing cost
      }
      
      const page: DiscoveredPage = {
        url: entry.url,
        title: analysis.title,
        description: analysis.description,
        qualityScore: analysis.qualityScore,
        category: analysis.category,
        lastModified: entry.lastmod
      };
      
      // Cache the result
      await cacheAnalysis(
        entry.url,
        [page],
        tier,
        contentHash,
        lastModified,
        etag
      );
      
      results.push({ page, success: true });
      
    } catch (error) {
      console.log(`Failed to analyze ${entry.url}:`, error.message);
      results.push({
        page: {
          url: entry.url,
          title: "Analysis Failed",
          description: "Unable to analyze this page",
          qualityScore: 1,
          category: "Error",
          lastModified: entry.lastmod
        },
        success: false
      });
    }
  }
  
  return results;
}

// Export the db import for cache cleanup
import { db } from "../db";

// Periodic cache cleanup job
export async function runCacheCleanup(): Promise<void> {
  try {
    const result = await db.execute(`
      DELETE FROM analysis_cache 
      WHERE expires_at < NOW()
      RETURNING id, url
    `);
    
    if (result.rows && result.rows.length > 0) {
      console.log(`Cleaned up ${result.rows.length} expired cache entries`);
    }
  } catch (error) {
    console.error('Cache cleanup error:', error);
  }
}