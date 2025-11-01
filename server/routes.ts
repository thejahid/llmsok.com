import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { urlAnalysisSchema, insertSitemapAnalysisSchema, insertLlmTextFileSchema, emailCaptureSchema, DiscoveredPage, SelectedPage, UserTier } from "@shared/schema";
import { fetchSitemap } from "./services/sitemap";
import { analyzeDiscoveredPagesWithCache } from "./services/sitemap-enhanced";
import { storage } from "./storage";
import { checkUsageLimits, trackUsage, getUserTier, estimateAnalysisCost } from "./services/usage";
import { TIER_LIMITS } from "./services/cache";
import { requireAuth, optionalAuth } from "./middleware/auth";
import authRoutes from "./routes/auth";
import { trackAnalysisCompleted, triggerUpgradeSequence, isConvertKitConfigured, getConvertKitConfig } from "./services/convertkit";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication routes
  app.use('/api/auth', authRoutes);
  
  // ConvertKit configuration status endpoint
  app.get("/api/convertkit/status", async (req, res) => {
    try {
      const config = getConvertKitConfig();
      res.json({
        status: "success",
        config
      });
    } catch (error) {
      console.error("ConvertKit status error:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to get ConvertKit configuration"
      });
    }
  });
  
  // Email capture endpoint for freemium model
  app.post("/api/email-capture", async (req, res) => {
    try {
      const emailData = emailCaptureSchema.parse(req.body);
      
      // Check if email already exists
      const existingCapture = await storage.getEmailCapture(emailData.email);
      if (existingCapture) {
        return res.json({ 
          message: "Email already captured", 
          capture: existingCapture,
          tier: existingCapture.tier || 'starter'
        });
      }
      
      // Create new email capture with selected tier
      const capture = await storage.createEmailCapture({
        ...emailData,
        tier: emailData.tier as any // Use the selected tier
      });
      
      res.json({ 
        message: "Email captured successfully", 
        capture,
        tier: emailData.tier
      });
    } catch (error) {
      console.error("Email capture error:", error);
      res.status(400).json({ 
        message: "Failed to capture email", 
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Check usage limits before analysis
  app.post("/api/check-limits", async (req, res) => {
    try {
      const { email, url } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email required" });
      }
      
      // Fetch sitemap to count pages
      const sitemapResult = await fetchSitemap(url);
      const pageCount = Math.min(sitemapResult.entries.length, 1000);
      
      // Check usage limits
      const usageCheck = await checkUsageLimits(email, pageCount);
      const tier = await getUserTier(email);
      const tierLimits = TIER_LIMITS[tier];
      
      // Estimate cost
      const estimatedCost = estimateAnalysisCost(pageCount, tier);
      
      res.json({
        allowed: usageCheck.allowed,
        reason: usageCheck.reason,
        pageCount,
        tier,
        limits: usageCheck.limits,
        currentUsage: usageCheck.currentUsage,
        estimatedCost,
        suggestedUpgrade: usageCheck.suggestedUpgrade
      });
    } catch (error) {
      console.error("Limit check error:", error);
      res.status(500).json({ message: "Failed to check limits" });
    }
  });
  
  // Enhanced analyze endpoint with caching and tier support
  app.post("/api/analyze", requireAuth, async (req, res) => {
    try {
      const { url, force = false } = z.object({
        url: z.string(),
        force: z.boolean().optional().default(false)
      }).parse(req.body);
      
      // Use authenticated user information
      const userEmail = req.user!.email;
      const tier = req.user!.tier;
      
      // Normalize URL
      const normalizedUrl = url.endsWith('/') ? url.slice(0, -1) : url;
      
      // Quick page count check
      const sitemapResult = await fetchSitemap(normalizedUrl);
      const pageCount = sitemapResult.entries.length;
      
      // Check usage limits
      const usageCheck = await checkUsageLimits(userEmail, pageCount);
      if (!usageCheck.allowed) {
        // Trigger upgrade sequence in ConvertKit if configured
        if (isConvertKitConfigured()) {
          try {
            let limitType: 'daily_analyses' | 'page_limit' | 'ai_limit' = 'page_limit';
            if (usageCheck.reason.includes('daily')) limitType = 'daily_analyses';
            if (usageCheck.reason.includes('AI')) limitType = 'ai_limit';
            
            await triggerUpgradeSequence(userEmail, tier, limitType);
          } catch (error) {
            console.error('ConvertKit upgrade sequence failed:', error);
          }
        }
        
        return res.status(403).json({
          message: usageCheck.reason,
          currentUsage: usageCheck.currentUsage,
          limits: usageCheck.limits,
          suggestedUpgrade: usageCheck.suggestedUpgrade
        });
      }
      
      // Check if already analyzing (to prevent duplicate analysis)
      const existingAnalysis = await storage.getAnalysisByUrl(normalizedUrl);
      if (existingAnalysis && existingAnalysis.status === "analyzing") {
        return res.json({ 
          analysisId: existingAnalysis.id,
          status: "analyzing"
        });
      }

      // If force flag is not set and we have a completed analysis, return it
      if (!force && existingAnalysis && existingAnalysis.status === "completed") {
        // Check if it's recent enough based on tier cache duration
        const analysisAge = Date.now() - new Date(existingAnalysis.createdAt).getTime();
        const maxAge = TIER_LIMITS[tier].cacheDurationDays * 24 * 60 * 60 * 1000;
        
        if (analysisAge < maxAge) {
          return res.json({ 
            analysisId: existingAnalysis.id,
            status: "completed",
            discoveredPages: existingAnalysis.discoveredPages,
            fromCache: true
          });
        }
      }

      // Create new analysis record
      const analysis = await storage.createAnalysis({
        url: normalizedUrl,
        status: "analyzing",
        sitemapContent: null,
        discoveredPages: [],
        // Store user email for tracking
        analysisMetadata: { userEmail: userEmail } as any
      });

      // Start analysis process (async)
      analyzeWebsiteEnhanced(analysis.id, normalizedUrl, userEmail, tier);

      res.json({ 
        analysisId: analysis.id,
        status: "analyzing",
        estimatedDuration: Math.min(300, pageCount * 0.5), // 0.5 seconds per page estimate
        pageCount: Math.min(pageCount, TIER_LIMITS[tier].maxPagesPerAnalysis)
      });
    } catch (error) {
      console.error("Analysis error:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to analyze website"
      });
    }
  });

  // Get analysis status and results with metrics
  app.get("/api/analysis/:id", async (req, res) => {
    try {
      const analysisId = parseInt(req.params.id);
      const analysis = await storage.getAnalysis(analysisId);
      
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }

      const response: any = {
        id: analysis.id,
        url: analysis.url,
        status: analysis.status,
        discoveredPages: analysis.discoveredPages || [],
        siteType: analysis.analysisMetadata?.siteType || "unknown",
        sitemapFound: analysis.analysisMetadata?.sitemapFound || false,
        analysisMethod: analysis.analysisMetadata?.analysisMethod || "unknown",
        message: analysis.analysisMetadata?.message || "Analysis completed",
        totalPagesFound: analysis.analysisMetadata?.totalPagesFound || 0
      };
      
      // Include metrics if available
      if (analysis.analysisMetadata?.metrics) {
        response.metrics = analysis.analysisMetadata.metrics;
      }
      
      res.json(response);
    } catch (error) {
      console.error("Get analysis error:", error);
      res.status(500).json({ message: "Failed to get analysis" });
    }
  });

  // Usage statistics endpoint
  app.get("/api/usage/:email", async (req, res) => {
    try {
      const email = req.params.email;
      const tier = await getUserTier(email);
      const todayUsage = await getTodayUsage(email);
      const limits = TIER_LIMITS[tier];
      
      res.json({
        tier,
        usage: {
          analysesToday: todayUsage?.analysesCount || 0,
          pagesProcessedToday: todayUsage?.pagesProcessed || 0,
          cacheHitsToday: todayUsage?.cacheHits || 0,
          costToday: todayUsage?.totalCost || 0
        },
        limits: {
          dailyAnalyses: limits.dailyAnalyses,
          maxPagesPerAnalysis: limits.maxPagesPerAnalysis,
          aiPagesLimit: limits.aiPagesLimit
        },
        features: limits.features
      });
    } catch (error) {
      console.error("Get usage error:", error);
      res.status(500).json({ message: "Failed to get usage data" });
    }
  });

  // Keep existing endpoints
  app.post("/api/generate-llm-file", requireAuth, async (req, res) => {
    try {
      const { analysisId, selectedPages } = z.object({
        analysisId: z.number(),
        selectedPages: z.array(z.object({
          url: z.string(),
          title: z.string(),
          description: z.string(),
          selected: z.boolean()
        }))
      }).parse(req.body);

      const analysis = await storage.getAnalysis(analysisId);
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }

      // Filter only selected pages
      const selectedOnly = selectedPages.filter(page => page.selected);
      
      // Generate LLM.txt content
      const llmContent = generateLlmTxtContent(analysis.url, selectedOnly);

      // Save generated file
      const llmFile = await storage.createLlmFile({
        analysisId,
        selectedPages: selectedOnly,
        content: llmContent
      });

      res.json({
        id: llmFile.id,
        content: llmContent,
        pageCount: selectedOnly.length,
        fileSize: Buffer.byteLength(llmContent, 'utf8')
      });
    } catch (error) {
      console.error("Generate file error:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to generate LLM.txt file"
      });
    }
  });

  // Get LLM file data
  app.get("/api/llm-file/:id", requireAuth, async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const llmFile = await storage.getLlmFile(fileId);
      
      if (!llmFile) {
        return res.status(404).json({ message: "File not found" });
      }

      res.json({
        id: llmFile.id,
        content: llmFile.content,
        pageCount: llmFile.selectedPages?.length || 0,
        fileSize: Buffer.byteLength(llmFile.content, 'utf8')
      });
    } catch (error) {
      console.error("Get file error:", error);
      res.status(500).json({ message: "Failed to get file data" });
    }
  });

  // Download LLM.txt file
  app.get("/api/download/:id", requireAuth, async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const llmFile = await storage.getLlmFile(fileId);
      
      if (!llmFile) {
        return res.status(404).json({ message: "File not found" });
      }

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', 'attachment; filename="llms.txt"');
      res.send(llmFile.content);
    } catch (error) {
      console.error("Download error:", error);
      res.status(500).json({ message: "Failed to download file" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Enhanced website analysis with caching and tier support
async function analyzeWebsiteEnhanced(
  analysisId: number, 
  url: string, 
  userEmail: string,
  tier: UserTier
) {
  try {
    const startTime = Date.now();
    
    // Fetch and parse sitemap
    const sitemapResult = await fetchSitemap(url);
    
    // Determine site type
    const siteType = determineSiteType(sitemapResult);
    
    // Update analysis with sitemap data
    await storage.updateAnalysis(analysisId, {
      sitemapContent: sitemapResult.entries,
      status: "processing"
    });

    // Analyze pages with smart caching
    const { pages, metrics } = await analyzeDiscoveredPagesWithCache(
      sitemapResult.entries,
      userEmail,
      tier
    );
    
    // Track usage
    await trackUsage(
      userEmail,
      metrics.analyzedPages + metrics.cachedPages,
      metrics.aiCallsUsed,
      metrics.htmlExtractionsUsed,
      metrics.cachedPages,
      metrics.estimatedCost
    );
    
    // Track analysis completion in ConvertKit if configured
    if (isConvertKitConfigured()) {
      try {
        await trackAnalysisCompleted(userEmail, {
          url,
          pageCount: metrics.totalPages,
          tier,
          cacheHits: metrics.cachedPages,
          analysisTime: (Date.now() - startTime) / 1000
        });
      } catch (error) {
        console.error('ConvertKit analysis tracking failed:', error);
      }
    }
    
    // Update analysis with results and metrics
    await storage.updateAnalysis(analysisId, {
      discoveredPages: pages,
      status: "completed",
      analysisMetadata: {
        siteType,
        sitemapFound: sitemapResult.sitemapFound,
        analysisMethod: sitemapResult.analysisMethod,
        message: sitemapResult.message,
        totalPagesFound: sitemapResult.entries.length,
        userEmail,
        tier,
        metrics,
        processingTime: (Date.now() - startTime) / 1000
      }
    });

    console.log(`Analysis completed for ${url}: ${metrics.totalPages} pages (${metrics.cachedPages} cached, ${metrics.analyzedPages} analyzed)`);

  } catch (error) {
    console.error("Website analysis failed:", error);
    await storage.updateAnalysis(analysisId, {
      status: "failed",
      discoveredPages: []
    });
  }
}

function determineSiteType(sitemapResult: any): "single-page" | "multi-page" | "unknown" {
  if (sitemapResult.analysisMethod === "homepage-only") {
    return "single-page";
  }
  if (sitemapResult.entries.length === 1) {
    return "single-page";
  }
  if (sitemapResult.entries.length > 1) {
    return "multi-page";
  }
  return "unknown";
}

function generateLlmTxtContent(baseUrl: string, selectedPages: SelectedPage[]): string {
  const header = `# LLM.txt File for ${baseUrl}
# Generated by LLM.txt Mastery
# Created: ${new Date().toISOString().split('T')[0]}
# Total Pages: ${selectedPages.length}

`;

  const content = selectedPages
    .map(page => `${page.url}: ${page.title} - ${page.description}`)
    .join('\n\n');

  return header + content;
}

// Helper function to get today's usage (imported from usage service)
import { getTodayUsage } from "./services/usage";