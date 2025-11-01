# Test URLs for LLM.txt Tool

## Good Test Websites (Various Complexity Levels)

### **Simple Sites (Good for Initial Testing)**
- `https://example.com` - Basic single page
- `https://jamielynnwatters.com` - Personal site with blog
- `https://anthropic.com` - Clean corporate site

### **Medium Complexity Sites**
- `https://docs.anthropic.com` - Documentation site with sitemap
- `https://github.com/anthropics` - GitHub organization
- `https://stripe.com` - Well-structured corporate site

### **Complex Sites (Advanced Testing)**
- `https://news.ycombinator.com` - Dynamic content site
- `https://reddit.com` - Large site with complex structure
- `https://wikipedia.org` - Massive site (will hit page limits)

## API Testing Commands

### 1. Start Analysis
```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "email": "test@example.com"}'
```

### 2. Check Analysis Status
```bash
curl http://localhost:3000/api/analysis/1
```

### 3. Generate LLM File
```bash
curl -X POST http://localhost:3000/api/generate-llm-file \
  -H "Content-Type: application/json" \
  -d '{
    "analysisId": 1,
    "selectedPages": [
      {"url": "https://example.com", "title": "Example", "description": "Test", "selected": true}
    ]
  }'
```

### 4. Download Generated File
```bash
curl http://localhost:3000/api/download/1 -o llm.txt
```

## Testing Features by Tier

### **Starter Tier (Free)**
- 1 analysis per day
- Up to 50 pages
- HTML extraction only
- Test with: `https://example.com`

### **Growth Tier**
- Unlimited analyses
- Up to 1000 pages (AI analysis limited to 200)
- AI-enhanced descriptions
- Test with: `https://docs.anthropic.com`

### **Scale Tier**
- Unlimited everything
- Full AI analysis
- API access
- Test with: `https://stripe.com`