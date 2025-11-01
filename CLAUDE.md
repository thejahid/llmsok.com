# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Development and Build
- `npm run dev` - Start development server (runs both frontend and backend on port 5000)
- `npm run build` - Build for production (builds frontend with Vite and backend with ESBuild)
- `npm start` - Start production server
- `npm run check` - Run TypeScript type checking

### Database Management
- `npm run db:push` - Push database schema changes using Drizzle Kit

## Project Architecture

### Overview
LLM.txt Mastery is a full-stack TypeScript application that analyzes websites and generates optimized `llms.txt` files for AI systems. The application uses a monorepo structure with shared schemas and follows a freemium model with AI-enhanced analysis for premium users.

### Core Architecture
- **Frontend**: React 18 with TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: Express.js with TypeScript, PostgreSQL with Drizzle ORM
- **Shared**: Common schemas and types in `shared/schema.ts`
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations

### Key Directories
- `client/` - React frontend application
- `server/` - Express.js backend with API routes and services
- `shared/` - Shared TypeScript schemas and types
- `server/services/` - Business logic (OpenAI integration, sitemap parsing)

### Main Application Flow
1. **URL Input**: User enters website URL for analysis
2. **Email Capture**: Freemium model with tier selection (free vs premium)
3. **Website Analysis**: Multi-strategy sitemap discovery and content analysis
4. **Content Review**: AI-powered quality scoring and page selection
5. **File Generation**: Standards-compliant LLM.txt file creation

### Database Schema
- `sitemapAnalysis` - Stores website analysis results and discovered pages
- `llmTextFiles` - Generated LLM.txt files with selected pages
- `emailCaptures` - User email captures for freemium model
- `users` - User authentication (minimal implementation)

### Key Services
- **Sitemap Service** (`server/services/sitemap.ts`): Multi-strategy sitemap discovery with 7+ fallback methods
- **OpenAI Service** (`server/services/openai.ts`): AI-powered content analysis and quality scoring
- **Storage Service** (`server/storage.ts`): Database operations using Drizzle ORM

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - OpenAI API key for AI-enhanced analysis

### Important Technical Details
- Uses Drizzle ORM with PostgreSQL for type-safe database operations
- Implements comprehensive sitemap discovery with fallback strategies
- Supports both HTML extraction (free) and AI-enhanced analysis (premium)
- Limits analysis to 200 pages for performance optimization
- Uses batch processing for content analysis to avoid rate limits
- Implements bot protection detection with consecutive failure tracking

### API Endpoints
- `POST /api/analyze` - Analyze website and discover pages
- `GET /api/analysis/:id` - Get analysis status and results
- `POST /api/generate-llm-file` - Generate LLM.txt file from selected pages
- `GET /api/download/:id` - Download generated LLM.txt file
- `POST /api/email-capture` - Capture user email for freemium model

### Development Notes
- The application runs on port 5000 for both development and production
- Frontend and backend are served from the same Express server
- Uses Vite for frontend development with hot reloading
- TypeScript is used throughout with strict type checking
- Database migrations are handled through Drizzle Kit