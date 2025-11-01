import { parseStringPromise } from "xml2js";
import fetch from "node-fetch";
import * as cheerio from "cheerio";
import { DiscoveredPage } from "@shared/schema";
import { analyzePageContent } from "./openai";

export interface SitemapEntry {
  url: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

export interface SitemapResult {
  entries: SitemapEntry[];
  sitemapFound: boolean;
  analysisMethod: "sitemap" | "robots.txt" | "homepage-only" | "fallback-crawl";
  message: string;
}

export async function fetchSitemap(baseUrl: string): Promise<SitemapResult> {
  // Extract root domain for sitemap discovery
  const urlObj = new URL(baseUrl);
  const rootDomain = `${urlObj.protocol}//${urlObj.hostname}`;
  
  console.log(`Searching for sitemap for baseUrl: ${baseUrl}, rootDomain: ${rootDomain}`);
  
  // Check if we need to handle redirects first
  let redirectPath = '';
  try {
    const rootResponse = await fetch(`${rootDomain}/sitemap.xml`, {
      method: 'HEAD',
      headers: { 'User-Agent': 'LLM.txt Mastery Bot 1.0' },
      timeout: 5000
    });
    
    if (!rootResponse.ok) {
      // Try to detect redirect pattern by checking the homepage
      const homepageResponse = await fetch(rootDomain, {
        headers: { 'User-Agent': 'LLM.txt Mastery Bot 1.0' },
        timeout: 5000
      });
      
      if (homepageResponse.ok) {
        const html = await homepageResponse.text();
        const redirectMatch = html.match(/window\.location\.href\s*=\s*["']([^"']+)["']/);
        if (redirectMatch) {
          redirectPath = redirectMatch[1];
          console.log(`Detected redirect pattern to: ${redirectPath}`);
        }
      }
    }
  } catch (error) {
    console.log('Error checking for redirects:', error.message);
  }
  
  const sitemapUrls = [
    `${rootDomain}/sitemap.xml`,
    `${rootDomain}/sitemap_index.xml`,
    `${rootDomain}/sitemap/sitemap.xml`,
    `${rootDomain}/sitemaps/sitemap.xml`,
    `${rootDomain}/wp-sitemap.xml`,
    `${rootDomain}/sitemap-index.xml`,
    `${rootDomain}/post-sitemap.xml`
  ];
  
  // Add redirect-based sitemap URLs if we found a redirect
  if (redirectPath) {
    const redirectBase = redirectPath.startsWith('/') ? `${rootDomain}${redirectPath}` : `${rootDomain}/${redirectPath}`;
    sitemapUrls.unshift(
      `${redirectBase}/sitemap.xml`,
      `${redirectBase}/sitemap_index.xml`,
      `${redirectBase}/sitemap/sitemap.xml`,
      `${redirectBase}/sitemaps/sitemap.xml`
    );
  }

  for (const sitemapUrl of sitemapUrls) {
    try {
      console.log(`Trying sitemap URL: ${sitemapUrl}`);
      const response = await fetch(sitemapUrl, {
        headers: {
          'User-Agent': 'LLM.txt Mastery Bot 1.0'
        },
        timeout: 10000
      });

      if (response.ok) {
        console.log(`Successfully fetched sitemap from: ${sitemapUrl}`);
        const xml = await response.text();
        
        // Log first 200 characters to debug content
        console.log(`Sitemap content preview: ${xml.substring(0, 200)}...`);
        
        const entries = await parseSitemap(xml);
        console.log(`Parsed ${entries.length} entries from sitemap`);
        
        // If we got 0 entries from a successful response, something is wrong
        if (entries.length === 0) {
          console.log(`Warning: Sitemap returned 0 entries, likely HTML redirect or invalid XML`);
          // Continue to try other sitemap locations
        } else {
          return {
            entries,
            sitemapFound: true,
            analysisMethod: "sitemap",
            message: `Found sitemap with ${entries.length} pages`
          };
        }
      } else {
        console.log(`HTTP ${response.status} for ${sitemapUrl}`);
      }
    } catch (error) {
      console.log(`Failed to fetch ${sitemapUrl}:`, error.message);
    }
  }

  // Fallback: try to discover pages from robots.txt
  try {
    const robotsResponse = await fetch(`${rootDomain}/robots.txt`);
    if (robotsResponse.ok) {
      const robotsText = await robotsResponse.text();
      const sitemapMatch = robotsText.match(/Sitemap:\s*(.+)/i);
      if (sitemapMatch) {
        const sitemapUrl = sitemapMatch[1].trim();
        console.log(`Found sitemap in robots.txt: ${sitemapUrl}`);
        const response = await fetch(sitemapUrl, {
          headers: {
            'User-Agent': 'LLM.txt Mastery Bot 1.0'
          },
          timeout: 10000
        });
        if (response.ok) {
          const xml = await response.text();
          const entries = await parseSitemap(xml);
          console.log(`Successfully parsed sitemap from robots.txt: ${entries.length} entries`);
          return {
            entries,
            sitemapFound: true,
            analysisMethod: "robots.txt",
            message: `Found sitemap via robots.txt with ${entries.length} pages`
          };
        }
      }
    }
  } catch (error) {
    console.log("Robots.txt fallback failed:", error.message);
  }

  // Check if this is a single-page site by analyzing the homepage
  const homepageAnalysis = await analyzeHomepage(baseUrl);
  if (homepageAnalysis.isSinglePage) {
    console.log("Detected single-page site, analyzing homepage only");
    return {
      entries: [{ url: baseUrl, lastmod: new Date().toISOString() }],
      sitemapFound: false,
      analysisMethod: "homepage-only",
      message: "No sitemap found. This appears to be a single-page site. Analysis includes homepage only."
    };
  }

  // Final fallback: basic page crawling for multi-page sites
  console.log("No sitemap found, using basic crawling fallback");
  const fallbackEntries = await basicCrawlFallback(rootDomain);
  return {
    entries: fallbackEntries,
    sitemapFound: false,
    analysisMethod: "fallback-crawl",
    message: `No sitemap found. Discovered ${fallbackEntries.length} pages through basic crawling. Some pages may be missing.`
  };
}

async function analyzeHomepage(url: string): Promise<{ isSinglePage: boolean, indicators: string[] }> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'LLM.txt Mastery Bot 1.0'
      },
      timeout: 10000
    });

    if (!response.ok) {
      return { isSinglePage: false, indicators: ['failed-to-fetch'] };
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    const indicators: string[] = [];
    let singlePageScore = 0;
    
    // Check for single-page app indicators
    const reactIndicators = $('#root, [data-reactroot], .react-app').length;
    const vueIndicators = $('#app, [data-v-], .vue-app').length;
    const angularIndicators = $('[ng-app], [data-ng-app], .angular-app').length;
    const nextjsIndicators = $('#__next, [data-nextjs-page]').length;
    
    if (reactIndicators > 0) {
      indicators.push('react-app');
      singlePageScore += 2;
    }
    if (vueIndicators > 0) {
      indicators.push('vue-app');
      singlePageScore += 2;
    }
    if (angularIndicators > 0) {
      indicators.push('angular-app');
      singlePageScore += 2;
    }
    if (nextjsIndicators > 0) {
      indicators.push('nextjs-app');
      singlePageScore += 1; // Next.js can be multi-page
    }
    
    // Check for navigation complexity
    const navLinks = $('nav a, .nav a, .navigation a, header a').length;
    const footerLinks = $('footer a, .footer a').length;
    const internalLinks = $('a[href^="/"], a[href^="./"], a[href^="../"]').length;
    
    if (navLinks <= 3) {
      indicators.push('minimal-navigation');
      singlePageScore += 1;
    }
    if (internalLinks <= 5) {
      indicators.push('few-internal-links');
      singlePageScore += 1;
    }
    
    // Check for traditional multi-page indicators
    const breadcrumbs = $('.breadcrumb, .breadcrumbs, nav[aria-label="breadcrumb"]').length;
    const pagination = $('.pagination, .pager, .page-numbers').length;
    
    if (breadcrumbs > 0) {
      indicators.push('has-breadcrumbs');
      singlePageScore -= 1;
    }
    if (pagination > 0) {
      indicators.push('has-pagination');
      singlePageScore -= 1;
    }
    
    // Check meta tags and title for SPA indicators
    const title = $('title').text().toLowerCase();
    const description = $('meta[name="description"]').attr('content')?.toLowerCase() || '';
    
    if (title.includes('app') || description.includes('app')) {
      indicators.push('app-terminology');
      singlePageScore += 1;
    }
    
    console.log(`Homepage analysis for ${url}: score=${singlePageScore}, indicators=[${indicators.join(', ')}]`);
    
    return {
      isSinglePage: singlePageScore >= 3,
      indicators
    };
    
  } catch (error) {
    console.log(`Homepage analysis failed for ${url}:`, error.message);
    return { isSinglePage: false, indicators: ['analysis-failed'] };
  }
}

async function basicCrawlFallback(baseUrl: string): Promise<SitemapEntry[]> {
  console.log(`Starting enhanced crawling fallback for ${baseUrl}`);
  
  const discoveredUrls = new Set<string>();
  const pages: SitemapEntry[] = [];
  
  // Step 1: Extract root domain for consistent URL handling
  const urlObj = new URL(baseUrl);
  const rootDomain = `${urlObj.protocol}//${urlObj.hostname}`;
  
  // Step 2: Crawl the homepage first to discover internal links
  try {
    const homepageUrls = await crawlPageForLinks(baseUrl, rootDomain);
    homepageUrls.forEach(url => discoveredUrls.add(url));
    console.log(`Discovered ${homepageUrls.length} links from homepage`);
  } catch (error) {
    console.log(`Homepage crawling failed: ${error.message}`);
  }
  
  // Step 3: Try common paths
  const commonPaths = [
    '/',
    '/docs', '/documentation', '/doc',
    '/api', '/api-docs', '/api/docs',
    '/guides', '/guide', '/tutorials', '/tutorial',
    '/help', '/support', '/faq',
    '/about', '/about-us',
    '/getting-started', '/quickstart', '/start',
    '/reference', '/refs',
    '/examples', '/example', '/demos', '/demo',
    '/blog', '/posts', '/articles',
    '/news', '/updates',
    '/changelog', '/releases',
    '/roadmap', '/plans',
    '/contact', '/contacts',
    '/team', '/company',
    '/pricing', '/plans',
    '/features', '/capabilities',
    '/download', '/downloads'
  ];

  for (const path of commonPaths) {
    const url = `${rootDomain}${path}`;
    if (!discoveredUrls.has(url)) {
      discoveredUrls.add(url);
    }
  }
  
  console.log(`Total URLs to check: ${discoveredUrls.size}`);
  
  // Step 4: Validate discovered URLs
  const validationPromises = Array.from(discoveredUrls).slice(0, 50).map(async (url) => {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'LLM.txt Mastery Bot 1.0'
        },
        timeout: 5000
      });

      if (response.ok) {
        return {
          url: url,
          lastmod: response.headers.get('last-modified') || undefined,
          changefreq: 'weekly',
          priority: url === baseUrl || url === rootDomain || url === `${rootDomain}/` ? '1.0' : '0.8'
        };
      }
    } catch (error) {
      // Ignore errors for individual pages
    }
    return null;
  });

  const validationResults = await Promise.all(validationPromises);
  const validPages = validationResults.filter(page => page !== null);
  pages.push(...validPages);

  console.log(`Enhanced crawling found ${pages.length} valid pages`);

  if (pages.length === 0) {
    // At minimum, include the original URL
    pages.push({
      url: baseUrl,
      lastmod: new Date().toISOString(),
      changefreq: 'weekly',
      priority: '1.0'
    });
  }

  return pages;
}

async function crawlPageForLinks(url: string, rootDomain: string): Promise<string[]> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'LLM.txt Mastery Bot 1.0'
      },
      timeout: 10000
    });

    if (!response.ok) {
      return [];
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const links: string[] = [];

    // Extract all internal links
    $('a[href]').each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        try {
          let fullUrl: string;
          
          if (href.startsWith('http')) {
            // Absolute URL - only include if same domain
            const linkUrl = new URL(href);
            if (linkUrl.hostname === new URL(rootDomain).hostname) {
              fullUrl = href;
            } else {
              return; // Skip external links
            }
          } else if (href.startsWith('/')) {
            // Relative to root
            fullUrl = `${rootDomain}${href}`;
          } else if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
            // Skip anchors and non-HTTP links
            return;
          } else {
            // Relative to current page
            const baseUrl = new URL(url);
            fullUrl = new URL(href, baseUrl.href).href;
          }
          
          // Clean up URL (remove fragments, normalize)
          const cleanUrl = new URL(fullUrl);
          cleanUrl.hash = '';
          const finalUrl = cleanUrl.href;
          
          // Filter out unwanted file types and paths
          if (!finalUrl.match(/\.(jpg|jpeg|png|gif|pdf|zip|doc|docx|xls|xlsx|ppt|pptx|mp3|mp4|avi|mov)$/i) &&
              !finalUrl.includes('/wp-admin/') &&
              !finalUrl.includes('/admin/') &&
              !finalUrl.includes('/login') &&
              !finalUrl.includes('/logout')) {
            links.push(finalUrl);
          }
        } catch (error) {
          // Skip malformed URLs
        }
      }
    });

    return [...new Set(links)]; // Remove duplicates
  } catch (error) {
    console.log(`Failed to crawl ${url} for links: ${error.message}`);
    return [];
  }
}

export async function parseSitemap(xml: string): Promise<SitemapEntry[]> {
  try {
    // Check if the response is HTML instead of XML (common redirect pattern)
    if (xml.trim().startsWith('<!DOCTYPE html') || xml.trim().startsWith('<html')) {
      console.log('Received HTML instead of XML sitemap, likely a redirect');
      return [];
    }
    
    const result = await parseStringPromise(xml);
    const entries: SitemapEntry[] = [];

    // Handle sitemap index
    if (result.sitemapindex && result.sitemapindex.sitemap) {
      const sitemaps = Array.isArray(result.sitemapindex.sitemap) 
        ? result.sitemapindex.sitemap 
        : [result.sitemapindex.sitemap];

      for (const sitemap of sitemaps) {
        const sitemapUrl = sitemap.loc[0];
        try {
          const response = await fetch(sitemapUrl);
          if (response.ok) {
            const sitemapXml = await response.text();
            const subEntries = await parseSitemap(sitemapXml);
            entries.push(...subEntries);
          }
        } catch (error) {
          console.log(`Failed to fetch sub-sitemap ${sitemapUrl}:`, error.message);
        }
      }
    }

    // Handle regular sitemap
    if (result.urlset && result.urlset.url) {
      const urls = Array.isArray(result.urlset.url) 
        ? result.urlset.url 
        : [result.urlset.url];

      for (const url of urls) {
        entries.push({
          url: url.loc[0],
          lastmod: url.lastmod?.[0],
          changefreq: url.changefreq?.[0],
          priority: url.priority?.[0]
        });
      }
    }

    return entries;
  } catch (error) {
    throw new Error(`Failed to parse sitemap: ${error.message}`);
  }
}

export async function fetchPageContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    throw new Error(`Failed to fetch ${url}: ${error.message}`);
  }
}

export function filterRelevantPages(entries: SitemapEntry[]): SitemapEntry[] {
  const excludePatterns = [
    /\.(jpg|jpeg|png|gif|pdf|zip|xml|json|css|js|woff|woff2|ttf|eot|ico|svg)$/i,
    /\/wp-admin\//i,
    /\/admin\//i,
    /\/login/i,
    /\/register/i,
    /\/cart/i,
    /\/checkout/i,
    /\/account/i,
    /\/dashboard/i,
    /\/search/i,
    /\/tag\//i,
    /\/category\//i,
    /\/page\/\d+/i,
    /\/\d{4}\/\d{2}\/\d{2}\//i, // Date-based URLs
    /\/author\//i,
    /\/user\//i,
    /\/profile\//i,
    /\/wp-content\//i,
    /\/assets\//i,
    /\/static\//i,
    /\/images\//i,
    /\/css\//i,
    /\/js\//i,
    /\/fonts\//i,
    /\/media\//i
  ];

  const highPriorityPatterns = [
    /\/docs?\//i,
    /\/documentation/i,
    /\/guide/i,
    /\/tutorial/i,
    /\/help/i,
    /\/api/i,
    /\/reference/i,
    /\/manual/i,
    /\/faq/i,
    /\/about/i,
    /\/support/i,
    /\/getting-started/i,
    /\/best-practices/i,
    /\/troubleshooting/i,
    /\/changelog/i,
    /\/roadmap/i,
    /\/features/i,
    /\/pricing/i,
    /\/contact/i,
    /\/learn/i,
    /\/how-to/i,
    /\/examples?/i,
    /\/resources?/i,
    /\/templates?/i,
    /\/integrations?/i,
    /\/tools?/i,
    /\/sdk/i,
    /\/cli/i,
    /\/quickstart/i,
    /\/overview/i,
    /\/introduction/i
  ];

  const mediumPriorityPatterns = [
    /\/blog/i,
    /\/articles?/i,
    /\/news/i,
    /\/updates/i,
    /\/release-notes/i,
    /\/announcements/i,
    /\/case-studies/i,
    /\/stories/i,
    /\/solutions/i,
    /\/products?/i,
    /\/services?/i,
    /\/platform/i,
    /\/security/i,
    /\/privacy/i,
    /\/legal/i,
    /\/terms/i,
    /\/compliance/i,
    /\/enterprise/i,
    /\/business/i,
    /\/developers?/i,
    /\/community/i,
    /\/partners?/i,
    /\/careers?/i,
    /\/company/i,
    /\/team/i,
    /\/mission/i,
    /\/vision/i,
    /\/values/i
  ];

  const filtered = entries.filter(entry => {
    const url = entry.url.toLowerCase();
    
    // Exclude unwanted patterns
    if (excludePatterns.some(pattern => pattern.test(url))) {
      return false;
    }

    // Skip URLs with query parameters or fragments
    if (url.includes('?') || url.includes('#')) {
      return false;
    }

    return true;
  });

  // Sort by priority: high priority first, then medium, then others
  const prioritized = filtered.sort((a, b) => {
    const urlA = a.url.toLowerCase();
    const urlB = b.url.toLowerCase();
    
    const isHighPriorityA = highPriorityPatterns.some(pattern => pattern.test(urlA));
    const isHighPriorityB = highPriorityPatterns.some(pattern => pattern.test(urlB));
    
    if (isHighPriorityA && !isHighPriorityB) return -1;
    if (!isHighPriorityA && isHighPriorityB) return 1;
    
    const isMediumPriorityA = mediumPriorityPatterns.some(pattern => pattern.test(urlA));
    const isMediumPriorityB = mediumPriorityPatterns.some(pattern => pattern.test(urlB));
    
    if (isMediumPriorityA && !isMediumPriorityB) return -1;
    if (!isMediumPriorityA && isMediumPriorityB) return 1;
    
    // Homepage always comes first
    if (urlA.endsWith('/') && urlA.split('/').length <= 4) return -1;
    if (urlB.endsWith('/') && urlB.split('/').length <= 4) return 1;
    
    return 0;
  });

  return prioritized;
}

export async function analyzeDiscoveredPages(
  entries: SitemapEntry[], 
  useAI: boolean = false,
  maxPagesLimit: number = 200
): Promise<DiscoveredPage[]> {
  const relevantPages = filterRelevantPages(entries);
  const pages: DiscoveredPage[] = [];

  // Use tier-based limit instead of hardcoded 200
  const maxPages = Math.min(maxPagesLimit, relevantPages.length);
  const pagesToAnalyze = relevantPages.slice(0, maxPages);

  console.log(`Analyzing ${pagesToAnalyze.length} pages from ${entries.length} discovered pages`);

  // Track consecutive failures to detect bot protection
  let consecutiveFailures = 0;
  const MAX_CONSECUTIVE_FAILURES = 10;

  // Process pages in larger batches for better performance
  const batchSize = 20;
  for (let i = 0; i < pagesToAnalyze.length; i += batchSize) {
    const batch = pagesToAnalyze.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (entry) => {
      try {
        const content = await fetchPageContent(entry.url);
        const analysis = await analyzePageContent(entry.url, content, useAI);
        
        return {
          url: entry.url,
          title: analysis.title,
          description: analysis.description,
          qualityScore: analysis.qualityScore,
          category: analysis.category,
          lastModified: entry.lastmod,
          success: true
        };
      } catch (error) {
        console.log(`Failed to analyze ${entry.url}:`, error.message);
        return {
          url: entry.url,
          title: "Analysis Failed",
          description: "Unable to analyze this page",
          qualityScore: 1,
          category: "Error",
          lastModified: entry.lastmod,
          success: false
        };
      }
    });

    const batchResults = await Promise.allSettled(batchPromises);
    
    let batchFailures = 0;
    batchResults.forEach((result) => {
      if (result.status === "fulfilled") {
        const { success, ...pageData } = result.value;
        pages.push(pageData);
        
        if (!success) {
          batchFailures++;
          consecutiveFailures++;
        } else {
          consecutiveFailures = 0; // Reset on success
        }
      }
    });

    // Early exit if we detect bot protection (all pages failing)
    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      console.log(`Detected potential bot protection (${consecutiveFailures} consecutive failures). Stopping analysis.`);
      break;
    }

    // Reduced delay between batches
    if (i + batchSize < pagesToAnalyze.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return pages.sort((a, b) => b.qualityScore - a.qualityScore);
}
