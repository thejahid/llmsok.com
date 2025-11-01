import helmet from 'helmet';
import type { Express } from 'express';

export function setupSecurityMiddleware(app: Express) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Use helmet for security headers
  app.use(helmet({
    // Content Security Policy - More permissive in development
    contentSecurityPolicy: isDevelopment ? false : {
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
    
    // Cross-Origin-Embedder-Policy
    crossOriginEmbedderPolicy: false, // Disable for better compatibility
    
    // Cross-Origin-Opener-Policy
    crossOriginOpenerPolicy: { policy: "same-origin" },
    
    // Cross-Origin-Resource-Policy
    crossOriginResourcePolicy: { policy: "cross-origin" },
    
    // X-DNS-Prefetch-Control
    dnsPrefetchControl: { allow: false },
    
    // X-Frame-Options
    frameguard: { action: 'deny' },
    
    // Hide X-Powered-By header
    hidePoweredBy: true,
    
    // HTTP Strict Transport Security
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    
    // X-Content-Type-Options
    noSniff: true,
    
    // Origin-Agent-Cluster
    originAgentCluster: true,
    
    // X-Permitted-Cross-Domain-Policies
    permittedCrossDomainPolicies: false,
    
    // Referrer-Policy
    referrerPolicy: { policy: "no-referrer" },
    
    // X-XSS-Protection
    xssFilter: true,
  }));

  // Additional security headers - Only apply in production
  if (!isDevelopment) {
    app.use((req, res, next) => {
      // Prevent MIME type sniffing
      res.setHeader('X-Content-Type-Options', 'nosniff');
      
      // Prevent clickjacking
      res.setHeader('X-Frame-Options', 'DENY');
      
      // XSS protection
      res.setHeader('X-XSS-Protection', '1; mode=block');
      
      // Referrer policy
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      // Permissions policy (formerly Feature Policy)
      res.setHeader('Permissions-Policy', 
        'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
      
      next();
    });
  }
}

// CORS configuration for production
export const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5000',
      'https://llm-txt-mastery.vercel.app', // Add your production domain
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // 24 hours
};