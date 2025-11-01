import OpenAI from "openai";
import * as cheerio from "cheerio";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface ContentAnalysisResult {
  title: string;
  description: string;
  qualityScore: number;
  category: string;
  relevance: number;
}

export async function analyzePageContent(url: string, htmlContent: string, useAI: boolean = false): Promise<ContentAnalysisResult> {
  try {
    if (useAI && process.env.OPENAI_API_KEY) {
      console.log("Using AI analysis for:", url);
      return await generateAIAnalysis(url, htmlContent);
    } else {
      console.log("Using HTML extraction for:", url);
      return generateHTMLAnalysis(url, htmlContent);
    }
  } catch (error) {
    console.error("Analysis failed for:", url, error);
    
    // Simple fallback when analysis fails
    return {
      title: new URL(url).pathname.split('/').pop() || 'Page',
      description: `Content from ${new URL(url).hostname}`,
      qualityScore: 5,
      category: 'General',
      relevance: 5
    };
  }
}

function generateHTMLAnalysis(url: string, htmlContent: string): ContentAnalysisResult {
  // Basic HTML parsing to extract title and create analysis
  const $ = cheerio.load(htmlContent);
  
  // Extract title
  let title = $('title').text().trim();
  if (!title) {
    title = $('h1').first().text().trim();
  }
  if (!title) {
    const urlParts = url.split('/');
    title = urlParts[urlParts.length - 1] || 'Page';
  }
  
  // Extract description
  let description = $('meta[name="description"]').attr('content') || '';
  if (!description) {
    // Try to get meaningful content from paragraphs and lists
    const firstParagraph = $('p').first().text().trim();
    const listContent = $('ul li, ol li').map((_, el) => $(el).text().trim()).get().slice(0, 3).join(', ');
    
    if (firstParagraph && firstParagraph.length > 10) {
      description = firstParagraph;
      // If we have list items and the paragraph is just navigation text, include list info
      if (firstParagraph.toLowerCase().includes('from here you can') && listContent) {
        description = `${firstParagraph} ${listContent}`;
      }
    } else if (listContent) {
      description = `Navigation page with links to: ${listContent}`;
    } else {
      // Look for any substantial text content
      const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
      description = bodyText.substring(0, 200) || 'Content page from ' + new URL(url).hostname;
    }
  }
  
  // Calculate quality score based on content indicators
  let qualityScore = 3; // Lower base score for more realistic assessment
  
  // Extract text content for analysis
  const textContent = $('body').text().trim();
  const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;
  const paragraphCount = $('p').length;
  const listItemCount = $('li').length;
  const headingCount = $('h1, h2, h3, h4, h5, h6').length;
  const codeBlockCount = $('code, pre').length;
  const linkCount = $('a').length;
  
  // Determine category based on URL patterns and content
  let category = "General";
  const urlLower = url.toLowerCase();
  const contentLower = textContent.toLowerCase();
  
  if (urlLower.includes('/docs') || urlLower.includes('/documentation')) {
    category = "Documentation";
  } else if (urlLower.includes('/api')) {
    category = "API Reference";
  } else if (urlLower.includes('/guide') || urlLower.includes('/tutorial')) {
    category = "Tutorial";
  } else if (urlLower.includes('/blog')) {
    category = "Blog";
  } else if (urlLower.includes('/about')) {
    category = "About";
  } else if (urlLower.includes('cern.ch') && contentLower.includes('first website')) {
    category = "Historical";
    // Historical significance but should still be reasonable
    qualityScore += 0.5;
  } else if (contentLower.includes('navigation') || 
            contentLower.includes('from here you can') ||
            listItemCount > paragraphCount) {
    category = "Navigation";
  }
  
  // Content depth scoring (more stringent)
  if (wordCount > 100) qualityScore += 1;
  if (wordCount > 300) qualityScore += 1;
  if (wordCount > 500) qualityScore += 1;
  
  // Structure scoring
  if (headingCount >= 2) qualityScore += 0.5;
  if (paragraphCount >= 3) qualityScore += 0.5;
  if (codeBlockCount > 0) qualityScore += 1;
  
  // Content quality indicators
  if (title.length > 20 && !title.includes('http://') && !title.includes('https://')) {
    qualityScore += 0.5;
  }
  if (description.length > 100 && !description.includes('From here you can')) {
    qualityScore += 0.5;
  }
  
  
  // Navigation vs content pages - be more aggressive about detection
  const isNavigationPage = textContent.toLowerCase().includes('from here you can') ||
                          textContent.toLowerCase().includes('select from') ||
                          textContent.toLowerCase().includes('choose from') ||
                          (listItemCount > 2 && paragraphCount <= 2 && wordCount < 300);
  
  if (isNavigationPage) {
    // Navigation pages should score low regardless of other factors
    qualityScore = Math.max(1, Math.min(3, qualityScore - 1));
    console.log(`Detected navigation page: ${url}, reducing quality score`);
  }
  
  // Error and low-value page detection
  if (title.toLowerCase().includes('404') || 
      title.toLowerCase().includes('error') ||
      textContent.toLowerCase().includes('page not found')) {
    qualityScore = 1;
  }
  
  // Placeholder content detection
  if (textContent.toLowerCase().includes('lorem ipsum') ||
      textContent.toLowerCase().includes('coming soon') ||
      textContent.toLowerCase().includes('under construction')) {
    qualityScore = Math.max(1, qualityScore - 2);
  }
  
  // Incomplete content detection - be more aggressive
  if (description.endsWith(':') || 
      description.endsWith('can:') ||
      description.includes('From here you can:') ||
      description.includes('From here you can') ||
      description.length < 30) {
    qualityScore = Math.max(1, qualityScore - 2);
    console.log(`Detected incomplete/minimal content: ${url}, description: "${description}"`);
  }
  
  qualityScore = Math.max(1, Math.min(10, Math.round(qualityScore * 2) / 2)); // Round to nearest 0.5
  
  // Ensure description doesn't cut off mid-word
  let finalDescription = description.substring(0, 300) || "No description available";
  if (description.length > 300) {
    const lastSpace = finalDescription.lastIndexOf(' ');
    if (lastSpace > 250) { // Only truncate at word boundary if it's not too short
      finalDescription = finalDescription.substring(0, lastSpace) + '...';
    }
  }

  return {
    title: title.substring(0, 100) || "Untitled Page",
    description: finalDescription,
    qualityScore,
    category,
    relevance: qualityScore // Use quality score as relevance for fallback
  };
}

async function generateAIAnalysis(url: string, htmlContent: string): Promise<ContentAnalysisResult> {
  // First extract basic info using HTML parsing
  const htmlResult = generateHTMLAnalysis(url, htmlContent);
  
  try {
    // Extract main content for AI analysis
    const $ = cheerio.load(htmlContent);
    
    // Remove unwanted elements
    $('script, style, nav, header, footer, aside, .sidebar, .menu, .navigation').remove();
    
    // Get main content
    const mainContent = $('main, article, .content, .post, .page, body').first().text().trim();
    const contentSample = mainContent.substring(0, 2000); // Limit content for API
    
    const prompt = `Analyze this webpage content for AI/LLM accessibility and value. 

URL: ${url}
Title: ${htmlResult.title}
Meta Description: ${htmlResult.description}
Content Sample: ${contentSample}

Provide a JSON response with:
1. Enhanced description optimized for AI understanding (150-300 chars)
2. Quality score (1-10) based on content value for AI systems
3. Category (Documentation, Tutorial, API Reference, Blog, Product, About, General)
4. Relevance score (1-10) for AI training/reference

Focus on technical accuracy, information density, and AI utility.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert content analyst specializing in AI/LLM accessibility. Respond only with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
      temperature: 0.3
    });

    const aiResult = JSON.parse(response.choices[0].message.content || "{}");
    
    // Ensure description doesn't cut off mid-word
    let enhancedDescription = aiResult.description || htmlResult.description;
    if (enhancedDescription.length > 300) {
      const lastSpace = enhancedDescription.lastIndexOf(' ', 300);
      if (lastSpace > 250) {
        enhancedDescription = enhancedDescription.substring(0, lastSpace) + '...';
      }
    }
    
    return {
      title: htmlResult.title,
      description: enhancedDescription,
      qualityScore: Math.max(1, Math.min(10, parseInt(aiResult.qualityScore) || htmlResult.qualityScore)),
      category: aiResult.category || htmlResult.category,
      relevance: Math.max(1, Math.min(10, parseInt(aiResult.relevance) || htmlResult.qualityScore))
    };
    
  } catch (error) {
    console.error("AI analysis failed, falling back to HTML analysis:", error);
    return htmlResult;
  }
}

export async function batchAnalyzeContent(pages: { url: string; content: string }[], useAI: boolean = false): Promise<ContentAnalysisResult[]> {
  const results = await Promise.allSettled(
    pages.map(page => analyzePageContent(page.url, page.content, useAI))
  );

  return results.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    } else {
      return {
        title: `Error analyzing ${pages[index].url}`,
        description: "Analysis failed",
        qualityScore: 1,
        category: "Error",
        relevance: 1
      };
    }
  });
}
