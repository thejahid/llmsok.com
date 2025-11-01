import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { urlAnalysisSchema, insertSitemapAnalysisSchema, insertLlmTextFileSchema, emailCaptureSchema, DiscoveredPage, SelectedPage } from "@shared/schema";
import { fetchSitemap, analyzeDiscoveredPages } from "./services/sitemap";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Email capture endpoint for freemium model
  app.post("/api/email-capture", async (req, res) => {
    try {
      const emailData = emailCaptureSchema.parse(req.body);
      
      // Check if email already exists
      const existingCapture = await storage.getEmailCapture(emailData.email);
      if (existingCapture) {
        return res.json({ message: "Email already captured", capture: existingCapture });
      }
      
      // Create new email capture
      const capture = await storage.createEmailCapture(emailData);
      res.json({ message: "Email captured successfully", capture });
    } catch (error) {
      console.error("Email capture error:", error);
      res.status(400).json({ 
        message: "Failed to capture email", 
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Demo endpoint for testing without OpenAI
  app.post("/api/demo", async (req, res) => {
    try {
      const { url } = urlAnalysisSchema.parse(req.body);
      
      // Normalize URL
      const normalizedUrl = url.endsWith('/') ? url.slice(0, -1) : url;
      
      // Create demo analysis with sample data
      const demoPages: DiscoveredPage[] = [
        {
          url: `${normalizedUrl}/docs`,
          title: "Documentation",
          description: "Complete documentation for the platform",
          qualityScore: 9,
          category: "Documentation",
          lastModified: "2024-01-15"
        },
        {
          url: `${normalizedUrl}/api`,
          title: "API Reference",
          description: "Comprehensive API documentation and examples",
          qualityScore: 8,
          category: "API Reference",
          lastModified: "2024-01-10"
        },
        {
          url: `${normalizedUrl}/guides`,
          title: "Getting Started Guide",
          description: "Step-by-step guide to get started quickly",
          qualityScore: 8,
          category: "Tutorial",
          lastModified: "2024-01-12"
        },
        {
          url: `${normalizedUrl}/about`,
          title: "About Us",
          description: "Learn about our mission and team",
          qualityScore: 7,
          category: "About",
          lastModified: "2024-01-08"
        }
      ];

      const analysis = await storage.createAnalysis({
        url: normalizedUrl,
        status: "completed",
        sitemapContent: null,
        discoveredPages: demoPages
      });

      res.json({ 
        analysisId: analysis.id,
        status: "completed",
        discoveredPages: demoPages
      });
    } catch (error) {
      console.error("Demo error:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to create demo"
      });
    }
  });

  // Analyze website URL and discover content
  app.post("/api/analyze", async (req, res) => {
    try {
      const { url, force = false, useAI = false } = z.object({
        url: z.string(),
        force: z.boolean().optional().default(false),
        useAI: z.boolean().optional().default(false)
      }).parse(req.body);
      
      // Normalize URL
      const normalizedUrl = url.endsWith('/') ? url.slice(0, -1) : url;
      
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
        return res.json({ 
          analysisId: existingAnalysis.id,
          status: "completed",
          discoveredPages: existingAnalysis.discoveredPages 
        });
      }

      // Create new analysis record
      const analysis = await storage.createAnalysis({
        url: normalizedUrl,
        status: "analyzing",
        sitemapContent: null,
        discoveredPages: []
      });

      // Start analysis process (async)
      analyzeWebsite(analysis.id, normalizedUrl, useAI);

      res.json({ 
        analysisId: analysis.id,
        status: "analyzing"
      });
    } catch (error) {
      console.error("Analysis error:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to analyze website"
      });
    }
  });

  // Get analysis status and results
  app.get("/api/analysis/:id", async (req, res) => {
    try {
      const analysisId = parseInt(req.params.id);
      const analysis = await storage.getAnalysis(analysisId);
      
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }

      res.json({
        id: analysis.id,
        url: analysis.url,
        status: analysis.status,
        discoveredPages: analysis.discoveredPages || [],
        siteType: analysis.analysisMetadata?.siteType || "unknown",
        sitemapFound: analysis.analysisMetadata?.sitemapFound || false,
        analysisMethod: analysis.analysisMetadata?.analysisMethod || "unknown",
        message: analysis.analysisMetadata?.message || "Analysis completed",
        totalPagesFound: analysis.analysisMetadata?.totalPagesFound || 0
      });
    } catch (error) {
      console.error("Get analysis error:", error);
      res.status(500).json({ message: "Failed to get analysis" });
    }
  });

  // Generate LLM.txt file from selected pages
  app.post("/api/generate-llm-file", async (req, res) => {
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
  app.get("/api/llm-file/:id", async (req, res) => {
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
  app.get("/api/download/:id", async (req, res) => {
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

async function analyzeWebsite(analysisId: number, url: string, useAI: boolean = false) {
  try {
    // Fetch and parse sitemap with enhanced detection
    const sitemapResult = await fetchSitemap(url);
    
    // Determine site type based on results
    const siteType = determineSiteType(sitemapResult);
    
    // Update analysis with sitemap data
    await storage.updateAnalysis(analysisId, {
      sitemapContent: sitemapResult.entries,
      status: "processing"
    });

    // Analyze discovered pages with AI flag
    const discoveredPages = await analyzeDiscoveredPages(sitemapResult.entries, useAI);
    
    // Update analysis with results including site analysis metadata
    await storage.updateAnalysis(analysisId, {
      discoveredPages,
      status: "completed",
      // Store analysis metadata in the analysis record
      analysisMetadata: {
        siteType,
        sitemapFound: sitemapResult.sitemapFound,
        analysisMethod: sitemapResult.analysisMethod,
        message: sitemapResult.message,
        totalPagesFound: sitemapResult.entries.length
      }
    });

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
