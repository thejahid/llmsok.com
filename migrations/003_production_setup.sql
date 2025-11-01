-- Production Database Setup
-- Date: 2025-01-19
-- Description: Essential tables for production deployment

-- Create user profiles table for extended user data
CREATE TABLE IF NOT EXISTS "user_profiles" (
  "id" TEXT PRIMARY KEY, -- Supabase user ID
  "email" TEXT NOT NULL UNIQUE,
  "tier" TEXT NOT NULL DEFAULT 'starter',
  "credits_remaining" INTEGER NOT NULL DEFAULT 0,
  "stripe_customer_id" TEXT UNIQUE,
  "subscription_id" TEXT,
  "subscription_status" TEXT,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

-- Create one-time credits table for coffee tier
CREATE TABLE IF NOT EXISTS "one_time_credits" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "credits_remaining" INTEGER NOT NULL DEFAULT 0,
  "credits_total" INTEGER NOT NULL DEFAULT 0,
  "product_type" TEXT NOT NULL DEFAULT 'coffee',
  "price_id" TEXT,
  "stripe_payment_intent_id" TEXT,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

-- Create payment history table for Stripe integration
CREATE TABLE IF NOT EXISTS "payment_history" (
  "id" SERIAL PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "stripe_subscription_id" TEXT,
  "amount" INTEGER NOT NULL, -- Amount in cents
  "currency" TEXT NOT NULL DEFAULT 'usd',
  "status" TEXT NOT NULL,
  "tier" TEXT NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_user_profiles_email" ON "user_profiles"("email");
CREATE INDEX IF NOT EXISTS "idx_user_profiles_stripe_customer_id" ON "user_profiles"("stripe_customer_id");
CREATE INDEX IF NOT EXISTS "idx_one_time_credits_user_id" ON "one_time_credits"("user_id");
CREATE INDEX IF NOT EXISTS "idx_payment_history_user_id" ON "payment_history"("user_id");

-- Comments
COMMENT ON TABLE "user_profiles" IS 'Extended user data linked to Supabase auth';
COMMENT ON TABLE "one_time_credits" IS 'Coffee tier credits and one-time purchases';
COMMENT ON TABLE "payment_history" IS 'Payment transaction history for Stripe';