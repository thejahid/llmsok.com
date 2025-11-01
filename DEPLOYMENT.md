# Deployment Guide

## 🚀 Quick Start for GitHub Repository

### 1. Create Repository
1. Go to [GitHub](https://github.com/TheWayWithin)
2. Click "New repository"
3. Repository name: `llm-txt-mastery`
4. Description: "A systematic web application for creating AI-optimized llms.txt files through sitemap analysis and expert-guided content curation"
5. Choose Public or Private
6. Don't initialize with README (we already have one)
7. Click "Create repository"

### 2. Connect Local Project to GitHub
```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Initial commit
git commit -m "Initial commit: LLM.txt Mastery full-stack application"

# Add remote repository
git remote add origin https://github.com/TheWayWithin/llm-txt-mastery.git

# Push to GitHub
git push -u origin main
```

### 3. Repository Setup
After pushing, your repository will have:
- ✅ Complete README with features, architecture, and usage
- ✅ MIT License
- ✅ Contributing guidelines
- ✅ Issue and PR templates
- ✅ CI/CD workflow (GitHub Actions)
- ✅ Proper .gitignore for Node.js/TypeScript

## 🌍 Environment Variables

### Required Variables
```bash
DATABASE_URL=postgresql://user:password@host:port/database
OPENAI_API_KEY=sk-your-openai-api-key
```

### Optional Variables
```bash
NODE_ENV=development
PORT=5000
```

## 🏗️ Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL database
- OpenAI API key

### Setup Commands
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your actual values

# Initialize database
npm run db:push

# Start development server
npm run dev
```

## 📦 Build Process

### Development Build
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

## 🔧 Database Management

### Schema Updates
```bash
# Apply schema changes
npm run db:push

# View database in browser
npm run db:studio
```

### Migration Strategy
- Use Drizzle ORM for all database operations
- Schema changes applied via `npm run db:push`
- No manual SQL migrations required

## 🚀 Deployment Options

### 1. Replit (Recommended)
- Already configured for Replit deployment
- PostgreSQL integration ready
- Environment variables managed through Replit Secrets
- One-click deployment

### 2. Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### 3. Railway
```bash
# Install Railway CLI
npm i -g @railway/cli

# Deploy
railway login
railway link
railway up
```

### 4. Render
1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically on push

## 📊 Monitoring

### Health Checks
- Database connection status
- API endpoint availability
- OpenAI API connectivity

### Logging
- Request/response logging
- Error tracking
- Performance metrics

## 🔐 Security

### Environment Variables
- Never commit `.env` files
- Use secure secrets management
- Rotate API keys regularly

### Database Security
- Use connection pooling
- Implement query timeout
- Validate all inputs with Zod

## 🧪 Testing

### Manual Testing
```bash
# Test sitemap discovery
curl -X POST http://localhost:5000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Check analysis status
curl http://localhost:5000/api/analysis/1

# Generate LLM.txt file
curl -X POST http://localhost:5000/api/generate-llm-file \
  -H "Content-Type: application/json" \
  -d '{"analysisId": 1, "selectedPages": [...]}'
```

### Automated Testing
- Unit tests for utility functions
- Integration tests for API endpoints
- Component tests for React components

## 📈 Performance

### Optimization Strategies
- Database query optimization
- API response caching
- Content delivery network (CDN)
- Image optimization

### Monitoring
- Response time tracking
- Error rate monitoring
- Database performance metrics

## 🔄 CI/CD Pipeline

### GitHub Actions
- Automated testing on PR
- Security audits
- TypeScript type checking
- Automated deployments

### Deployment Workflow
1. Push to main branch
2. Run tests and linting
3. Build application
4. Deploy to production
5. Run health checks

## 🐛 Troubleshooting

### Common Issues
- Database connection failures
- OpenAI API rate limits
- Sitemap parsing errors
- Memory usage optimization

### Debug Commands
```bash
# Check database connection
npm run db:studio

# View application logs
npm run dev

# Test API endpoints
curl -v http://localhost:5000/api/health
```

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/TheWayWithin/llm-txt-mastery/issues)
- **Discussions**: [GitHub Discussions](https://github.com/TheWayWithin/llm-txt-mastery/discussions)
- **Documentation**: [README.md](README.md)
- **Contributing**: [CONTRIBUTING.md](CONTRIBUTING.md)