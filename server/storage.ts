import { 
  users, sitemapAnalysis, llmTextFiles, emailCaptures, subscriptions, paymentHistory, usageTracking, analysisCache, oneTimeCredits, userProfiles,
  type User, type InsertUser, type SitemapAnalysis, type LlmTextFile, type InsertSitemapAnalysis, type InsertLlmTextFile, 
  type EmailCapture, type InsertEmailCapture, type Subscription, type InsertSubscription, type PaymentHistory, type InsertPaymentHistory,
  type UsageTrackingDb, type InsertUsageTracking, type AnalysisCacheDb, type InsertAnalysisCache,
  type OneTimeCredit, type InsertOneTimeCredit, type UserProfile, type InsertUserProfile
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Analysis methods
  getAnalysisByUrl(url: string): Promise<SitemapAnalysis | undefined>;
  createAnalysis(analysis: InsertSitemapAnalysis): Promise<SitemapAnalysis>;
  getAnalysis(id: number): Promise<SitemapAnalysis | undefined>;
  updateAnalysis(id: number, updates: Partial<SitemapAnalysis>): Promise<SitemapAnalysis | undefined>;
  
  // LLM file methods
  createLlmFile(llmFile: InsertLlmTextFile): Promise<LlmTextFile>;
  getLlmFile(id: number): Promise<LlmTextFile | undefined>;
  
  // Email capture methods
  createEmailCapture(emailCapture: InsertEmailCapture): Promise<EmailCapture>;
  getEmailCapture(email: string): Promise<EmailCapture | undefined>;
  
  // Subscription methods
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  getSubscription(userId: number): Promise<Subscription | undefined>;
  getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | undefined>;
  updateSubscription(id: number, updates: Partial<Subscription>): Promise<Subscription | undefined>;
  
  // Payment history methods
  createPaymentHistory(payment: InsertPaymentHistory): Promise<PaymentHistory>;
  getPaymentHistory(userId: number): Promise<PaymentHistory[]>;
  
  // Usage tracking methods
  createOrUpdateUsage(usage: InsertUsageTracking): Promise<UsageTrackingDb>;
  getUsageByDate(userId: number, date: string): Promise<UsageTrackingDb | undefined>;
  
  // Cache methods
  createCacheEntry(cache: InsertAnalysisCache): Promise<AnalysisCacheDb>;
  getCacheEntry(urlHash: string, tier: string): Promise<AnalysisCacheDb | undefined>;
  updateCacheHitCount(id: number): Promise<void>;
  
  // User profile methods
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  getUserProfile(id: string): Promise<UserProfile | undefined>;
  updateUserProfile(id: string, updates: Partial<UserProfile>): Promise<UserProfile | undefined>;
  
  // One-time credit methods
  createOneTimeCredit(credit: InsertOneTimeCredit): Promise<OneTimeCredit>;
  getUserCredits(userId: number): Promise<OneTimeCredit[]>;
  consumeCredit(userId: number, amount?: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private analyses: Map<number, SitemapAnalysis>;
  private llmFiles: Map<number, LlmTextFile>;
  private emailCaptures: Map<string, EmailCapture>;
  private subscriptions: Map<number, Subscription>;
  private paymentHistory: Map<number, PaymentHistory>;
  private usageTracking: Map<string, UsageTrackingDb>; // key: userId:date
  private cacheEntries: Map<string, AnalysisCacheDb>; // key: urlHash
  private userProfiles: Map<string, UserProfile>; // key: userId (string for Supabase UUID)
  private oneTimeCredits: Map<number, OneTimeCredit>;
  private currentUserId: number;
  private currentAnalysisId: number;
  private currentLlmFileId: number;
  private currentEmailCaptureId: number;
  private currentSubscriptionId: number;
  private currentPaymentId: number;
  private currentUsageId: number;
  private currentCacheId: number;
  private currentCreditId: number;

  constructor() {
    this.users = new Map();
    this.analyses = new Map();
    this.llmFiles = new Map();
    this.emailCaptures = new Map();
    this.subscriptions = new Map();
    this.paymentHistory = new Map();
    this.usageTracking = new Map();
    this.cacheEntries = new Map();
    this.userProfiles = new Map();
    this.oneTimeCredits = new Map();
    this.currentUserId = 1;
    this.currentAnalysisId = 1;
    this.currentLlmFileId = 1;
    this.currentEmailCaptureId = 1;
    this.currentSubscriptionId = 1;
    this.currentPaymentId = 1;
    this.currentUsageId = 1;
    this.currentCacheId = 1;
    this.currentCreditId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    // In MemStorage, we'll find user via email capture for now
    const emailCapture = await this.getEmailCapture(email);
    if (emailCapture?.userId) {
      return this.getUser(emailCapture.userId);
    }
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Analysis methods
  async getAnalysisByUrl(url: string): Promise<SitemapAnalysis | undefined> {
    return Array.from(this.analyses.values()).find(
      (analysis) => analysis.url === url,
    );
  }

  async createAnalysis(insertAnalysis: InsertSitemapAnalysis): Promise<SitemapAnalysis> {
    const id = this.currentAnalysisId++;
    const analysis: SitemapAnalysis = {
      id,
      userId: insertAnalysis.userId || null,
      url: insertAnalysis.url,
      status: insertAnalysis.status || "pending",
      sitemapContent: insertAnalysis.sitemapContent || null,
      discoveredPages: insertAnalysis.discoveredPages || null,
      analysisMetadata: insertAnalysis.analysisMetadata || null,
      createdAt: new Date(),
    };
    this.analyses.set(id, analysis);
    return analysis;
  }

  async getAnalysis(id: number): Promise<SitemapAnalysis | undefined> {
    return this.analyses.get(id);
  }

  async updateAnalysis(id: number, updates: Partial<SitemapAnalysis>): Promise<SitemapAnalysis | undefined> {
    const existing = this.analyses.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.analyses.set(id, updated);
    return updated;
  }

  // LLM file methods
  async createLlmFile(insertLlmFile: InsertLlmTextFile): Promise<LlmTextFile> {
    const id = this.currentLlmFileId++;
    const llmFile: LlmTextFile = {
      id,
      userId: insertLlmFile.userId || null,
      analysisId: insertLlmFile.analysisId || null,
      selectedPages: insertLlmFile.selectedPages || null,
      content: insertLlmFile.content,
      createdAt: new Date(),
    };
    this.llmFiles.set(id, llmFile);
    return llmFile;
  }

  async getLlmFile(id: number): Promise<LlmTextFile | undefined> {
    return this.llmFiles.get(id);
  }

  // Email capture methods
  async createEmailCapture(insertEmailCapture: InsertEmailCapture): Promise<EmailCapture> {
    const id = this.currentEmailCaptureId++;
    const emailCapture: EmailCapture = {
      id,
      userId: insertEmailCapture.userId || null,
      email: insertEmailCapture.email,
      websiteUrl: insertEmailCapture.websiteUrl,
      tier: insertEmailCapture.tier || "starter",
      createdAt: new Date(),
    };
    this.emailCaptures.set(insertEmailCapture.email, emailCapture);
    return emailCapture;
  }

  async getEmailCapture(email: string): Promise<EmailCapture | undefined> {
    return this.emailCaptures.get(email);
  }

  // Subscription methods
  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const id = this.currentSubscriptionId++;
    const subscription: Subscription = {
      id,
      userId: insertSubscription.userId,
      stripeCustomerId: insertSubscription.stripeCustomerId || null,
      stripeSubscriptionId: insertSubscription.stripeSubscriptionId || null,
      tier: insertSubscription.tier || "starter",
      status: insertSubscription.status || "active",
      currentPeriodStart: insertSubscription.currentPeriodStart || null,
      currentPeriodEnd: insertSubscription.currentPeriodEnd || null,
      cancelAtPeriodEnd: insertSubscription.cancelAtPeriodEnd || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.subscriptions.set(id, subscription);
    return subscription;
  }

  async getSubscription(userId: number): Promise<Subscription | undefined> {
    return Array.from(this.subscriptions.values()).find(
      (subscription) => subscription.userId === userId,
    );
  }

  async getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | undefined> {
    return Array.from(this.subscriptions.values()).find(
      (subscription) => subscription.stripeSubscriptionId === stripeSubscriptionId,
    );
  }

  async updateSubscription(id: number, updates: Partial<Subscription>): Promise<Subscription | undefined> {
    const existing = this.subscriptions.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    this.subscriptions.set(id, updated);
    return updated;
  }

  // Payment history methods
  async createPaymentHistory(insertPayment: InsertPaymentHistory): Promise<PaymentHistory> {
    const id = this.currentPaymentId++;
    const payment: PaymentHistory = {
      id,
      userId: insertPayment.userId,
      subscriptionId: insertPayment.subscriptionId || null,
      stripePaymentIntentId: insertPayment.stripePaymentIntentId || null,
      amount: insertPayment.amount,
      currency: insertPayment.currency || "usd",
      status: insertPayment.status,
      createdAt: new Date(),
    };
    this.paymentHistory.set(id, payment);
    return payment;
  }

  async getPaymentHistory(userId: number): Promise<PaymentHistory[]> {
    return Array.from(this.paymentHistory.values()).filter(
      (payment) => payment.userId === userId,
    );
  }

  // Usage tracking methods
  async createOrUpdateUsage(insertUsage: InsertUsageTracking): Promise<UsageTrackingDb> {
    const key = `${insertUsage.userId}:${insertUsage.date}`;
    const existing = this.usageTracking.get(key);
    
    if (existing) {
      const updated: UsageTrackingDb = {
        ...existing,
        analysesCount: existing.analysesCount + (insertUsage.analysesCount || 0),
        pagesProcessed: existing.pagesProcessed + (insertUsage.pagesProcessed || 0),
        aiCallsCount: existing.aiCallsCount + (insertUsage.aiCallsCount || 0),
        htmlExtractionsCount: existing.htmlExtractionsCount + (insertUsage.htmlExtractionsCount || 0),
        cacheHits: existing.cacheHits + (insertUsage.cacheHits || 0),
        totalCost: existing.totalCost + (insertUsage.totalCost || 0),
        updatedAt: new Date(),
      };
      this.usageTracking.set(key, updated);
      return updated;
    } else {
      const id = this.currentUsageId++;
      const usage: UsageTrackingDb = {
        id,
        userId: insertUsage.userId,
        date: insertUsage.date,
        analysesCount: insertUsage.analysesCount || 0,
        pagesProcessed: insertUsage.pagesProcessed || 0,
        aiCallsCount: insertUsage.aiCallsCount || 0,
        htmlExtractionsCount: insertUsage.htmlExtractionsCount || 0,
        cacheHits: insertUsage.cacheHits || 0,
        totalCost: insertUsage.totalCost || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.usageTracking.set(key, usage);
      return usage;
    }
  }

  async getUsageByDate(userId: number, date: string): Promise<UsageTrackingDb | undefined> {
    const key = `${userId}:${date}`;
    return this.usageTracking.get(key);
  }

  // Cache methods
  async createCacheEntry(insertCache: InsertAnalysisCache): Promise<AnalysisCacheDb> {
    const id = this.currentCacheId++;
    const cache: AnalysisCacheDb = {
      id,
      url: insertCache.url,
      urlHash: insertCache.urlHash,
      contentHash: insertCache.contentHash,
      lastModified: insertCache.lastModified || null,
      etag: insertCache.etag || null,
      analysisResult: insertCache.analysisResult || null,
      tier: insertCache.tier,
      cachedAt: new Date(),
      expiresAt: insertCache.expiresAt,
      hitCount: insertCache.hitCount || 0,
    };
    this.cacheEntries.set(insertCache.urlHash, cache);
    return cache;
  }

  async getCacheEntry(urlHash: string, tier: string): Promise<AnalysisCacheDb | undefined> {
    const entry = this.cacheEntries.get(urlHash);
    if (entry && entry.tier === tier) {
      return entry;
    }
    return undefined;
  }

  async updateCacheHitCount(id: number): Promise<void> {
    const entry = Array.from(this.cacheEntries.values()).find(e => e.id === id);
    if (entry) {
      entry.hitCount++;
      this.cacheEntries.set(entry.urlHash, entry);
    }
  }

  // User profile methods
  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const newProfile: UserProfile = {
      ...profile,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.userProfiles.set(profile.id, newProfile);
    return newProfile;
  }

  async getUserProfile(id: string): Promise<UserProfile | undefined> {
    return this.userProfiles.get(id);
  }

  async updateUserProfile(id: string, updates: Partial<UserProfile>): Promise<UserProfile | undefined> {
    const existing = this.userProfiles.get(id);
    if (existing) {
      const updated = { ...existing, ...updates, updatedAt: new Date() };
      this.userProfiles.set(id, updated);
      return updated;
    }
    return undefined;
  }

  // One-time credit methods
  async createOneTimeCredit(credit: InsertOneTimeCredit): Promise<OneTimeCredit> {
    const id = this.currentCreditId++;
    const newCredit: OneTimeCredit = {
      id,
      ...credit,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.oneTimeCredits.set(id, newCredit);
    return newCredit;
  }

  async getUserCredits(userId: number): Promise<OneTimeCredit[]> {
    return Array.from(this.oneTimeCredits.values())
      .filter(credit => credit.userId === userId);
  }

  async consumeCredit(userId: number, amount = 1): Promise<boolean> {
    const userCredits = await this.getUserCredits(userId);
    const availableCredit = userCredits.find(credit => credit.creditsRemaining > 0);
    
    if (availableCredit && availableCredit.creditsRemaining >= amount) {
      availableCredit.creditsRemaining -= amount;
      availableCredit.updatedAt = new Date();
      this.oneTimeCredits.set(availableCredit.id, availableCredit);
      
      // Update user profile credits
      const profile = await this.getUserProfile(userId.toString());
      if (profile) {
        await this.updateUserProfile(userId.toString(), {
          creditsRemaining: (profile.creditsRemaining || 0) - amount
        });
      }
      
      return true;
    }
    return false;
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    // Join with emailCaptures to find user by email
    const result = await db
      .select({ user: users })
      .from(users)
      .innerJoin(emailCaptures, eq(users.id, emailCaptures.userId))
      .where(eq(emailCaptures.email, email))
      .limit(1);
    
    return result[0]?.user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAnalysisByUrl(url: string): Promise<SitemapAnalysis | undefined> {
    const [analysis] = await db
      .select()
      .from(sitemapAnalysis)
      .where(eq(sitemapAnalysis.url, url))
      .orderBy(desc(sitemapAnalysis.id));
    return analysis || undefined;
  }

  async createAnalysis(insertAnalysis: InsertSitemapAnalysis): Promise<SitemapAnalysis> {
    const [analysis] = await db
      .insert(sitemapAnalysis)
      .values({
        userId: insertAnalysis.userId,
        url: insertAnalysis.url,
        status: insertAnalysis.status,
        sitemapContent: insertAnalysis.sitemapContent,
        discoveredPages: insertAnalysis.discoveredPages,
        analysisMetadata: insertAnalysis.analysisMetadata
      })
      .returning();
    return analysis;
  }

  async getAnalysis(id: number): Promise<SitemapAnalysis | undefined> {
    const [analysis] = await db
      .select()
      .from(sitemapAnalysis)
      .where(eq(sitemapAnalysis.id, id));
    return analysis || undefined;
  }

  async updateAnalysis(id: number, updates: Partial<SitemapAnalysis>): Promise<SitemapAnalysis | undefined> {
    const [analysis] = await db
      .update(sitemapAnalysis)
      .set(updates)
      .where(eq(sitemapAnalysis.id, id))
      .returning();
    return analysis || undefined;
  }

  async createLlmFile(insertLlmFile: InsertLlmTextFile): Promise<LlmTextFile> {
    const [llmFile] = await db
      .insert(llmTextFiles)
      .values({
        userId: insertLlmFile.userId,
        analysisId: insertLlmFile.analysisId,
        selectedPages: insertLlmFile.selectedPages,
        content: insertLlmFile.content
      })
      .returning();
    return llmFile;
  }

  async getLlmFile(id: number): Promise<LlmTextFile | undefined> {
    const [llmFile] = await db
      .select()
      .from(llmTextFiles)
      .where(eq(llmTextFiles.id, id));
    return llmFile || undefined;
  }

  // Email capture methods
  async createEmailCapture(insertEmailCapture: InsertEmailCapture): Promise<EmailCapture> {
    const [emailCapture] = await db
      .insert(emailCaptures)
      .values({
        userId: insertEmailCapture.userId,
        email: insertEmailCapture.email,
        websiteUrl: insertEmailCapture.websiteUrl,
        tier: insertEmailCapture.tier || "starter"
      })
      .returning();
    return emailCapture;
  }

  async getEmailCapture(email: string): Promise<EmailCapture | undefined> {
    const [emailCapture] = await db
      .select()
      .from(emailCaptures)
      .where(eq(emailCaptures.email, email));
    return emailCapture || undefined;
  }

  // Subscription methods
  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const [subscription] = await db
      .insert(subscriptions)
      .values(insertSubscription)
      .returning();
    return subscription;
  }

  async getSubscription(userId: number): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);
    return subscription || undefined;
  }

  async getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));
    return subscription || undefined;
  }

  async updateSubscription(id: number, updates: Partial<Subscription>): Promise<Subscription | undefined> {
    const [subscription] = await db
      .update(subscriptions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(subscriptions.id, id))
      .returning();
    return subscription || undefined;
  }

  // Payment history methods
  async createPaymentHistory(insertPayment: InsertPaymentHistory): Promise<PaymentHistory> {
    const [payment] = await db
      .insert(paymentHistory)
      .values(insertPayment)
      .returning();
    return payment;
  }

  async getPaymentHistory(userId: number): Promise<PaymentHistory[]> {
    const payments = await db
      .select()
      .from(paymentHistory)
      .where(eq(paymentHistory.userId, userId))
      .orderBy(desc(paymentHistory.createdAt));
    return payments;
  }

  // Usage tracking methods
  async createOrUpdateUsage(insertUsage: InsertUsageTracking): Promise<UsageTrackingDb> {
    // For PostgreSQL, we'll implement upsert manually
    const existing = await this.getUsageByDate(insertUsage.userId, insertUsage.date);
    
    if (existing) {
      const [usage] = await db
        .update(usageTracking)
        .set({
          analysesCount: existing.analysesCount + (insertUsage.analysesCount || 0),
          pagesProcessed: existing.pagesProcessed + (insertUsage.pagesProcessed || 0),
          aiCallsCount: existing.aiCallsCount + (insertUsage.aiCallsCount || 0),
          htmlExtractionsCount: existing.htmlExtractionsCount + (insertUsage.htmlExtractionsCount || 0),
          cacheHits: existing.cacheHits + (insertUsage.cacheHits || 0),
          totalCost: existing.totalCost + (insertUsage.totalCost || 0),
          updatedAt: new Date(),
        })
        .where(eq(usageTracking.id, existing.id))
        .returning();
      return usage;
    } else {
      const [usage] = await db
        .insert(usageTracking)
        .values(insertUsage)
        .returning();
      return usage;
    }
  }

  async getUsageByDate(userId: number, date: string): Promise<UsageTrackingDb | undefined> {
    const [usage] = await db
      .select()
      .from(usageTracking)
      .where(and(eq(usageTracking.userId, userId), eq(usageTracking.date, date)));
    return usage || undefined;
  }

  // Cache methods
  async createCacheEntry(insertCache: InsertAnalysisCache): Promise<AnalysisCacheDb> {
    const [cache] = await db
      .insert(analysisCache)
      .values(insertCache)
      .returning();
    return cache;
  }

  async getCacheEntry(urlHash: string, tier: string): Promise<AnalysisCacheDb | undefined> {
    const [cache] = await db
      .select()
      .from(analysisCache)
      .where(and(eq(analysisCache.urlHash, urlHash), eq(analysisCache.tier, tier)))
      .limit(1);
    return cache || undefined;
  }

  async updateCacheHitCount(id: number): Promise<void> {
    await db
      .update(analysisCache)
      .set({ hitCount: sql`${analysisCache.hitCount} + 1` })
      .where(eq(analysisCache.id, id));
  }
}

// Use in-memory storage if DATABASE_URL is not properly configured
export const storage = process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("localhost:5432/test") 
  ? new DatabaseStorage() 
  : new MemStorage();
