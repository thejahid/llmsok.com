# LLM.txt Quality Scoring System

## Overview

LLM.txt Mastery uses an advanced AI-powered quality scoring system to evaluate web pages and determine their relevance and value for AI/LLM understanding. Each page receives a score from 1-10 based on multiple factors.

## Scoring Criteria

### Content Relevance and Depth (30%)
- **Technical accuracy** - Is the information correct and up-to-date?
- **Content depth** - Does the page provide comprehensive information?
- **Relevance to AI** - How useful is this content for AI training or context?

### Technical Documentation Quality (25%)
- **Structure and organization** - Is the content well-organized with clear headings?
- **Code examples** - Are there practical examples and implementations?
- **API documentation** - Is technical information clearly documented?

### SEO Optimization and Structure (20%)
- **Meta information** - Quality of titles, descriptions, and meta tags
- **Content structure** - Proper use of headers, lists, and formatting
- **Internal linking** - How well the page connects to other relevant content

### Information Architecture (15%)
- **Navigation clarity** - How easy is it to understand the page's purpose?
- **Content hierarchy** - Is information presented in a logical order?
- **Categorization** - Is the content properly categorized and tagged?

### User Experience Indicators (10%)
- **Page loading** - Technical accessibility and performance
- **Content completeness** - Is the page complete or still under construction?
- **Error handling** - Are there broken links or missing content?

## Score Ranges

### 🟢 High Quality (8-10)
- Comprehensive, accurate, and highly relevant content
- Excellent technical documentation with examples
- Well-structured and optimized for both humans and AI
- **Recommendation**: Auto-selected for inclusion

### 🟡 Medium Quality (6-7)
- Good content with minor issues or gaps
- Decent structure but may lack depth or examples
- Generally useful but not exceptional
- **Recommendation**: Review for inclusion based on specific needs

### 🔴 Low Quality (1-5)
- Incomplete, outdated, or irrelevant content
- Poor structure or organization
- Limited value for AI understanding
- **Recommendation**: Typically excluded unless specifically needed

## Why Some Pages Are Excluded

Pages may be excluded from the final LLM.txt file for several reasons:

1. **Low Quality Score** - Pages scoring below 6 are usually excluded
2. **Content Duplication** - Similar content covered better elsewhere
3. **Legal/Privacy Pages** - Terms of service, privacy policies (unless specifically requested)
4. **Navigation Pages** - Menus, sitemaps, and directory listings
5. **Temporal Content** - News, events, or time-sensitive information
6. **Interactive Elements** - Pages requiring user interaction to access content

## Analysis Limitations

### Page Discovery Limits
- **Starter Tier**: Up to 50 pages analyzed
- **Growth Tier**: Up to 200 pages analyzed  
- **Scale Tier**: Up to 500 pages analyzed

### Processing Constraints
- Pages may be skipped if they're inaccessible or require authentication
- Very large websites may have only the most important pages analyzed
- Bot protection may prevent analysis of some pages

## Best Practices

### For Content Creators
1. **Use clear, descriptive titles** that indicate the page's purpose
2. **Structure content with proper headings** (H1, H2, H3)
3. **Include practical examples** and code snippets where relevant
4. **Maintain up-to-date information** and remove outdated content
5. **Use meta descriptions** that accurately summarize the page content

### for LLM.txt Users
1. **Review the quality scores** before generating your file
2. **Consider your specific use case** - sometimes lower-scored pages may be relevant
3. **Check excluded pages** to ensure nothing important was missed
4. **Update your LLM.txt file regularly** as your website content changes

## Understanding the Results

When you see "102 pages found, 99 pages analyzed" in your results:

- **Pages Found**: Total pages discovered in sitemaps and during crawling
- **Pages Analyzed**: Pages that were successfully fetched and scored
- **Pages Skipped**: The difference, usually due to access restrictions, redirects, or processing limits

The AI scoring system is designed to be conservative, favoring high-quality, relevant content that will provide maximum value for AI understanding while excluding noise and low-value pages.