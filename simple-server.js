#!/usr/bin/env node
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || "3000", 10);

console.log('🚀 Starting LLM.txt Mastery Server...');
console.log('📂 Current directory:', __dirname);
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
console.log('🔑 Database URL exists:', !!process.env.DATABASE_URL);
console.log('🔑 Supabase URL exists:', !!process.env.SUPABASE_URL);
console.log('🔑 Stripe keys exist:', !!process.env.STRIPE_SECRET_KEY);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'", "https://checkout.stripe.com"],
      frameAncestors: ["'none'"],
      frameSrc: ["'self'", "https://checkout.stripe.com", "https://js.stripe.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.openai.com", "https://*.supabase.co", "https://api.stripe.com"],
    },
  },
  crossOriginOpenerPolicy: { policy: "same-origin" },
}));

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files
const publicPath = path.join(__dirname, 'dist/public');
console.log('📁 Looking for static files at:', publicPath);

if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
  console.log('✅ Static files found and configured');
} else {
  console.log('❌ Static files directory not found');
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: !!process.env.DATABASE_URL,
    supabase: !!process.env.SUPABASE_URL,
    stripe: !!process.env.STRIPE_SECRET_KEY
  });
});

// Test route for coffee tier
app.get('/api/test-coffee', (req, res) => {
  res.json({
    message: 'Coffee tier endpoint working!',
    priceId: process.env.STRIPE_LLM_TXT_COFFEE_PRICE_ID,
    testMode: process.env.STRIPE_SECRET_KEY?.includes('test') || false
  });
});

// Catch-all handler for SPA
app.get('*', (req, res) => {
  const indexPath = path.join(publicPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Frontend build not found. Run: npm run build');
  }
});

// Import fs at the top
import fs from 'fs';

// Start server
app.listen(port, '127.0.0.1', () => {
  console.log('');
  console.log('🎉 Server started successfully!');
  console.log(`📡 Server URL: http://localhost:${port}`);
  console.log(`🩺 Health check: http://localhost:${port}/api/health`);
  console.log(`☕ Coffee test: http://localhost:${port}/api/test-coffee`);
  console.log('');
  console.log('Ready to test coffee tier! 🚀');
});