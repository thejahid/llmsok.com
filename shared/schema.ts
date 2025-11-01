import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const emailCaptures = pgTable("email_captures", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  email: text("email").notNull().unique(),
  websiteUrl: text("website_url").notNull(),
  tier: text("tier").notNull().default("starter"), // "starter", "growth", or "scale"
  createdAt: timestamp("created_at").defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  stripeCustomerId: text("stripe_customer_id").unique(),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  tier: text("tier").notNull().default("starter"), // "starter", "growth", or "scale"
  status: text("status").notNull().default("active"), // "active", "canceled", "past_due", "incomplete"
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const paymentHistory = pgTable("payment_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  subscriptionId: integer("subscription_id").references(() => subscriptions.id),
  stripePaymentIntentId: text("stripe_payment_intent_id").unique(),
  amount: integer("amount").notNull(), // Amount in cents
  currency: text("currency").notNull().default("usd"),
  status: text("status").notNull(), // "succeeded", "failed", "pending"
  createdAt: timestamp("created_at").defaultNow(),
});

export const sitemapAnalysis = pgTable("sitemap_analysis", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  url: text("url").notNull(),
  sitemapContent: jsonb("sitemap_content"),
  discoveredPages: jsonb("discovered_pages").$type<DiscoveredPage[]>(),
  status: text("status").notNull().default("pending"),
  analysisMetadata: jsonb("analysis_metadata").$type<{
    siteType: "single-page" | "multi-page" | "unknown";
    sitemapFound: boolean;
    analysisMethod: "sitemap" | "robots.txt" | "homepage-only" | "fallback-crawl";
    message: string;
    totalPagesFound: number;
    userEmail?: string;
    tier?: UserTier;
    metrics?: {
      cacheHit: boolean;
      processingTime: number;
      apiCalls: number;
      costSaved: number;
      analyzedPages?: number;
      cachedPages?: number;
      aiCallsUsed?: number;
      htmlExtractionsUsed?: number;
    };
    processingTime?: number;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const llmTextFiles = pgTable("llm_text_files", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  analysisId: integer("analysis_id").references(() => sitemapAnalysis.id),
  selectedPages: jsonb("selected_pages").$type<SelectedPage[]>(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const usageTracking = pgTable("usage_tracking", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  date: text("date").notNull(), // YYYY-MM-DD format
  analysesCount: integer("analyses_count").notNull().default(0),
  pagesProcessed: integer("pages_processed").notNull().default(0),
  aiCallsCount: integer("ai_calls_count").notNull().default(0),
  htmlExtractionsCount: integer("html_extractions_count").notNull().default(0),
  cacheHits: integer("cache_hits").notNull().default(0),
  totalCost: integer("total_cost").notNull().default(0), // Cost in cents
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const analysisCache = pgTable("analysis_cache", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  urlHash: text("url_hash").notNull().unique(),
  contentHash: text("content_hash").notNull(),
  lastModified: text("last_modified"),
  etag: text("etag"),
  analysisResult: jsonb("analysis_result").$type<DiscoveredPage[]>(),
  tier: text("tier").notNull(),
  cachedAt: timestamp("cached_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  hitCount: integer("hit_count").notNull().default(0),
});

export const oneTimeCredits = pgTable("one_time_credits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  creditsRemaining: integer("credits_remaining").notNull().default(0),
  creditsTotal: integer("credits_total").notNull().default(0),
  productType: text("product_type").notNull().default("coffee"), // "coffee", future: "pro", etc.
  priceId: text("price_id"), // Stripe price ID for the purchase
  stripePaymentIntentId: text("stripe_payment_intent_id").unique(),
  expiresAt: timestamp("expires_at"), // null = no expiration
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userProfiles = pgTable("user_profiles", {
  id: text("id").primaryKey(), // Supabase user UUID
  email: text("email").notNull(),
  tier: text("tier").notNull().default("starter"),
  stripeCustomerId: text("stripe_customer_id").unique(),
  subscriptionId: text("subscription_id"),
  subscriptionStatus: text("subscription_status"),
  creditsRemaining: integer("credits_remaining").notNull().default(0), // Current coffee credits
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export interface DiscoveredPage {
  url: string;
  title: string;
  description: string;
  qualityScore: number;
  category: string;
  lastModified?: string;
}

export interface SiteAnalysisResult {
  id: number;
  url: string;
  status: "analyzing" | "completed" | "failed" | "pending" | "processing";
  discoveredPages: DiscoveredPage[];
  siteType: "single-page" | "multi-page" | "unknown";
  sitemapFound: boolean;
  analysisMethod: "sitemap" | "robots.txt" | "homepage-only" | "fallback-crawl";
  message: string;
  totalPagesFound: number;
  metrics?: {
    cacheHit: boolean;
    processingTime: number;
    apiCalls: number;
    costSaved: number;
  };
}

export interface SelectedPage {
  url: string;
  title: string;
  description: string;
  selected: boolean;
}

export const urlAnalysisSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
});

export const insertSitemapAnalysisSchema = createInsertSchema(sitemapAnalysis).pick({
  userId: true,
  url: true,
  sitemapContent: true,
  discoveredPages: true,
  status: true,
  analysisMetadata: true,
});

export const insertLlmTextFileSchema = createInsertSchema(llmTextFiles).pick({
  userId: true,
  analysisId: true,
  selectedPages: true,
  content: true,
});

export type InsertSitemapAnalysis = z.infer<typeof insertSitemapAnalysisSchema>;
export type InsertLlmTextFile = z.infer<typeof insertLlmTextFileSchema>;
export type SitemapAnalysis = typeof sitemapAnalysis.$inferSelect;
export type LlmTextFile = typeof llmTextFiles.$inferSelect;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertEmailCaptureSchema = createInsertSchema(emailCaptures).pick({
  userId: true,
  email: true,
  websiteUrl: true,
  tier: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).pick({
  userId: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true,
  tier: true,
  status: true,
  currentPeriodStart: true,
  currentPeriodEnd: true,
  cancelAtPeriodEnd: true,
});

export const insertPaymentHistorySchema = createInsertSchema(paymentHistory).pick({
  userId: true,
  subscriptionId: true,
  stripePaymentIntentId: true,
  amount: true,
  currency: true,
  status: true,
});

export const insertUsageTrackingSchema = createInsertSchema(usageTracking).pick({
  userId: true,
  date: true,
  analysesCount: true,
  pagesProcessed: true,
  aiCallsCount: true,
  htmlExtractionsCount: true,
  cacheHits: true,
  totalCost: true,
});

export const insertAnalysisCacheSchema = createInsertSchema(analysisCache).pick({
  url: true,
  urlHash: true,
  contentHash: true,
  lastModified: true,
  etag: true,
  analysisResult: true,
  tier: true,
  expiresAt: true,
  hitCount: true,
});

export const insertOneTimeCreditSchema = createInsertSchema(oneTimeCredits).pick({
  userId: true,
  creditsRemaining: true,
  creditsTotal: true,
  productType: true,
  priceId: true,
  stripePaymentIntentId: true,
  expiresAt: true,
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).pick({
  id: true,
  email: true,
  tier: true,
  stripeCustomerId: true,
  subscriptionId: true,
  subscriptionStatus: true,
  creditsRemaining: true,
});

export const emailCaptureSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  websiteUrl: z.string().url("Please enter a valid URL"),
  tier: z.enum(["starter", "coffee", "growth", "scale"]).default("starter"),
});

export type InsertEmailCapture = z.infer<typeof insertEmailCaptureSchema>;
export type EmailCapture = typeof emailCaptures.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertPaymentHistory = z.infer<typeof insertPaymentHistorySchema>;
export type PaymentHistory = typeof paymentHistory.$inferSelect;
export type InsertUsageTracking = z.infer<typeof insertUsageTrackingSchema>;
export type UsageTrackingDb = typeof usageTracking.$inferSelect;
export type InsertAnalysisCache = z.infer<typeof insertAnalysisCacheSchema>;
export type AnalysisCacheDb = typeof analysisCache.$inferSelect;
export type InsertOneTimeCredit = z.infer<typeof insertOneTimeCreditSchema>;
export type OneTimeCredit = typeof oneTimeCredits.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UserProfile = typeof userProfiles.$inferSelect;

// Tier-based types
export type UserTier = 'starter' | 'coffee' | 'growth' | 'scale';

export interface TierLimits {
  tier: UserTier;
  dailyAnalyses: number;
  maxPagesPerAnalysis: number;
  aiPagesLimit: number;
  cacheDurationDays: number;
  features: {
    htmlExtraction: boolean;
    aiAnalysis: boolean;
    fileHistory: boolean;
    prioritySupport: boolean;
    smartCaching: boolean;
    whiteLabel?: boolean;
    apiAccess?: boolean;
  };
}

// Legacy interfaces for backward compatibility - use database types for new code
export interface CachedAnalysis {
  id: number;
  url: string;
  urlHash: string;
  contentHash: string;
  lastModified?: string;
  etag?: string;
  analysisResult: DiscoveredPage[];
  tier: UserTier;
  cachedAt: Date;
  expiresAt: Date;
  hitCount: number;
}

export interface UsageTracking {
  id: number;
  userId?: number;
  userEmail?: string;
  date: string;
  analysesCount: number;
  pagesProcessed: number;
  aiCallsCount?: number;
  htmlExtractionsCount?: number;
  cacheHits: number;
  cost?: number;
  totalCost?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
