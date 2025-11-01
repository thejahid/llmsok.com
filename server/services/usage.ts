import { storage } from "../storage";
import { UserTier, UsageTracking } from "@shared/schema";
import { TIER_LIMITS } from "./cache";

export interface UsageCheckResult {
  allowed: boolean;
  reason?: string;
  currentUsage: {
    analysesToday: number;
    pagesProcessedToday: number;
  };
  limits: {
    dailyAnalyses: number;
    maxPagesPerAnalysis: number;
    aiPagesLimit: number;
  };
  suggestedUpgrade?: UserTier;
}

// Get user's current tier
export async function getUserTier(userEmail: string): Promise<UserTier> {
  try {
    const emailCapture = await storage.getEmailCapture(userEmail);
    return emailCapture?.tier || 'starter';
  } catch (error) {
    console.error('Error getting user tier:', error);
    return 'starter';
  }
}

// Simple in-memory usage tracking for testing
const usageTracking = new Map<string, UsageTracking>();

// Get today's usage for a user
export async function getTodayUsage(userEmail: string): Promise<UsageTracking | null> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const key = `${userEmail}:${today}`;
    
    return usageTracking.get(key) || null;
  } catch (error) {
    console.error('Error getting today usage:', error);
    return null;
  }
}

// Update usage tracking
export async function updateUsageTracking(
  userEmail: string, 
  analysesCount: number, 
  pagesProcessed: number, 
  cost: number
): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const key = `${userEmail}:${today}`;
    
    const existing = usageTracking.get(key);
    const updated: UsageTracking = {
      id: existing?.id || Date.now(),
      userId: existing?.userId || 1,
      date: today,
      analysesCount: (existing?.analysesCount || 0) + analysesCount,
      pagesProcessed: (existing?.pagesProcessed || 0) + pagesProcessed,
      cacheHits: existing?.cacheHits || 0,
      cost: (existing?.cost || 0) + cost,
      createdAt: existing?.createdAt || new Date(),
      updatedAt: new Date()
    };
    
    usageTracking.set(key, updated);
  } catch (error) {
    console.error('Error updating usage tracking:', error);
  }
}

// Check if user can perform analysis
export async function checkUsageLimits(
  userEmail: string, 
  requestedPages: number
): Promise<UsageCheckResult> {
  // Development bypass - skip all limits in development mode
  if (process.env.NODE_ENV === 'development') {
    const tier = await getUserTier(userEmail);
    const limits = TIER_LIMITS[tier];
    
    console.log(`🚀 [DEV MODE] Bypassing usage limits for ${userEmail} (${tier} tier) - ${requestedPages} pages`);
    
    return {
      allowed: true,
      reason: undefined,
      currentUsage: { analysesToday: 0, pagesProcessedToday: 0 },
      limits: {
        dailyAnalyses: limits.dailyAnalyses,
        maxPagesPerAnalysis: limits.maxPagesPerAnalysis,
        aiPagesLimit: limits.aiPagesLimit
      }
    };
  }

  try {
    const tier = await getUserTier(userEmail);
    const limits = TIER_LIMITS[tier];
    const todayUsage = await getTodayUsage(userEmail);
    
    const analysesToday = todayUsage?.analysesCount || 0;
    const pagesProcessedToday = todayUsage?.pagesProcessed || 0;
    
    // Check daily analysis limit
    if (analysesToday >= limits.dailyAnalyses) {
      const suggestedUpgrade = tier === 'starter' ? 'growth' : 'scale';
      return {
        allowed: false,
        reason: `Daily limit reached. ${tier} tier allows ${limits.dailyAnalyses} analysis${limits.dailyAnalyses > 1 ? 'es' : ''} per day.`,
        currentUsage: { analysesToday, pagesProcessedToday },
        limits: {
          dailyAnalyses: limits.dailyAnalyses,
          maxPagesPerAnalysis: limits.maxPagesPerAnalysis,
          aiPagesLimit: limits.aiPagesLimit
        },
        suggestedUpgrade
      };
    }
    
    // Check pages per analysis limit
    if (requestedPages > limits.maxPagesPerAnalysis) {
      const suggestedUpgrade = tier === 'starter' ? 'growth' : 'scale';
      return {
        allowed: false,
        reason: `Too many pages requested. ${tier} tier allows maximum ${limits.maxPagesPerAnalysis} pages per analysis.`,
        currentUsage: { analysesToday, pagesProcessedToday },
        limits: {
          dailyAnalyses: limits.dailyAnalyses,
          maxPagesPerAnalysis: limits.maxPagesPerAnalysis,
          aiPagesLimit: limits.aiPagesLimit
        },
        suggestedUpgrade
      };
    }
    
    return {
      allowed: true,
      currentUsage: { analysesToday, pagesProcessedToday },
      limits: {
        dailyAnalyses: limits.dailyAnalyses,
        maxPagesPerAnalysis: limits.maxPagesPerAnalysis,
        aiPagesLimit: limits.aiPagesLimit
      }
    };
    
  } catch (error) {
    console.error('Error checking usage limits:', error);
    // Default to allowing on error to not block users
    return {
      allowed: true,
      currentUsage: { analysesToday: 0, pagesProcessedToday: 0 },
      limits: {
        dailyAnalyses: 1,
        maxPagesPerAnalysis: 50,
        aiPagesLimit: 0
      }
    };
  }
}

// Track usage for a completed analysis
export async function trackUsage(
  userEmail: string,
  pagesProcessed: number,
  aiCallsCount: number,
  htmlExtractionsCount: number,
  cacheHits: number,
  estimatedCost: number
): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get user ID from email
    const userResult = await db.execute<{ id: number }>(`
      SELECT id FROM "emailCaptures" WHERE email = $1 LIMIT 1
    `, [userEmail]);
    
    const userId = userResult.rows?.[0]?.id;
    if (!userId) return;
    
    await db.execute(`
      INSERT INTO usage_tracking (
        user_id, date, analyses_count, pages_processed, 
        ai_calls_count, html_extractions_count, cache_hits, total_cost
      ) VALUES ($1, $2, 1, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id, date) 
      DO UPDATE SET
        analyses_count = usage_tracking.analyses_count + 1,
        pages_processed = usage_tracking.pages_processed + $3,
        ai_calls_count = usage_tracking.ai_calls_count + $4,
        html_extractions_count = usage_tracking.html_extractions_count + $5,
        cache_hits = usage_tracking.cache_hits + $6,
        total_cost = usage_tracking.total_cost + $7
    `, [userId, today, pagesProcessed, aiCallsCount, htmlExtractionsCount, cacheHits, estimatedCost]);
    
    console.log(`Tracked usage for ${userEmail}: ${pagesProcessed} pages, ${aiCallsCount} AI calls, ${cacheHits} cache hits`);
    
  } catch (error) {
    console.error('Error tracking usage:', error);
  }
}

// Coffee tier credit management
export async function checkCoffeeCredits(userId: string): Promise<{ hasCredits: boolean; creditsRemaining: number }> {
  try {
    const userProfile = await storage.getUserProfile(userId);
    const creditsRemaining = userProfile?.creditsRemaining || 0;
    
    return {
      hasCredits: creditsRemaining > 0,
      creditsRemaining
    };
  } catch (error) {
    console.error('Error checking coffee credits:', error);
    return { hasCredits: false, creditsRemaining: 0 };
  }
}

export async function consumeCoffeeCredit(userId: string): Promise<boolean> {
  try {
    const userProfile = await storage.getUserProfile(userId);
    if (!userProfile || userProfile.creditsRemaining <= 0) {
      return false;
    }
    
    // Consume one credit
    await storage.updateUserProfile(userId, {
      creditsRemaining: userProfile.creditsRemaining - 1
    });
    
    console.log(`Consumed 1 coffee credit for user: ${userId}. Remaining: ${userProfile.creditsRemaining - 1}`);
    return true;
  } catch (error) {
    console.error('Error consuming coffee credit:', error);
    return false;
  }
}

export async function getUserTierFromAuth(user: { id: string; email: string; tier: UserTier } | undefined, email?: string): Promise<UserTier> {
  if (user) {
    // Get tier from authenticated user profile
    const userProfile = await storage.getUserProfile(user.id);
    return userProfile?.tier || user.tier || 'starter';
  } else if (email) {
    // Fallback to email-based tier lookup for backward compatibility
    return await getUserTier(email);
  } else {
    return 'starter';
  }
}

// Get usage statistics for a user
export async function getUserUsageStats(userEmail: string, days: number = 30): Promise<any> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const result = await db.execute(`
      SELECT 
        COUNT(*) as days_active,
        SUM(analyses_count) as total_analyses,
        SUM(pages_processed) as total_pages,
        SUM(ai_calls_count) as total_ai_calls,
        SUM(cache_hits) as total_cache_hits,
        SUM(total_cost) as total_cost,
        AVG(analyses_count) as avg_analyses_per_day,
        AVG(pages_processed) as avg_pages_per_day
      FROM usage_tracking 
      WHERE user_id = (SELECT id FROM "emailCaptures" WHERE email = $1 LIMIT 1)
      AND date >= $2
    `, [userEmail, startDate.toISOString().split('T')[0]]);
    
    return result.rows?.[0] || {
      days_active: 0,
      total_analyses: 0,
      total_pages: 0,
      total_ai_calls: 0,
      total_cache_hits: 0,
      total_cost: 0,
      avg_analyses_per_day: 0,
      avg_pages_per_day: 0
    };
    
  } catch (error) {
    console.error('Error getting user usage stats:', error);
    return null;
  }
}

// Estimate cost for an analysis
export function estimateAnalysisCost(
  pagesCount: number,
  tier: UserTier,
  cacheHits: number = 0
): number {
  const limits = TIER_LIMITS[tier];
  const uncachedPages = Math.max(0, pagesCount - cacheHits);
  
  // Calculate how many pages will use AI
  const aiPages = tier === 'starter' ? 0 : Math.min(uncachedPages, limits.aiPagesLimit);
  const htmlPages = uncachedPages - aiPages;
  
  // Cost estimates
  const aiCostPerPage = 0.03; // GPT-4 approximate cost
  const htmlCostPerPage = 0.001; // Basic processing cost
  
  return (aiPages * aiCostPerPage) + (htmlPages * htmlCostPerPage);
}

// Get next tier suggestion
export function getNextTier(currentTier: UserTier): UserTier | null {
  switch (currentTier) {
    case 'starter':
      return 'growth';
    case 'growth':
      return 'scale';
    case 'scale':
      return null;
    default:
      return 'growth';
  }
}