import type { Express } from "express";
import { z } from "zod";
import { 
  createStripeCustomer, 
  createCheckoutSession,
  createOneTimeCheckoutSession, 
  createPortalSession,
  getStripeCustomer,
  getCustomerSubscriptions,
  validateWebhookSignature,
  getTierFromPriceId,
  TIER_PRICES
} from "../services/stripe";
import { storage } from "../storage";
import { requireAuth } from "../middleware/auth";
import { apiLimiter } from "../middleware/rate-limit";

export function registerStripeRoutes(app: Express) {
  
  // Create checkout session for subscription
  app.post("/api/stripe/create-checkout", requireAuth, apiLimiter, async (req, res) => {
    try {
      const { tier } = z.object({
        tier: z.enum(['growth', 'scale'])
      }).parse(req.body);

      const userId = req.user?.id;
      const userEmail = req.user?.email;

      if (!userId || !userEmail) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Get or create user profile
      let userProfile = await storage.getUserProfile(userId);
      if (!userProfile) {
        userProfile = await storage.createUserProfile({
          id: userId,
          email: userEmail,
          tier: 'starter',
          stripeCustomerId: null,
          subscriptionId: null,
          subscriptionStatus: null
        });
      }

      // Get or create Stripe customer
      let stripeCustomer;
      if (userProfile.stripeCustomerId) {
        stripeCustomer = await getStripeCustomer(userProfile.stripeCustomerId);
      }
      
      if (!stripeCustomer) {
        stripeCustomer = await createStripeCustomer({
          email: userEmail,
          userId: userId
        });
        
        // Update user profile with Stripe customer ID
        await storage.updateUserProfile(userId, {
          stripeCustomerId: stripeCustomer.id
        });
      }

      // Create checkout session
      const priceId = TIER_PRICES[tier].priceId;
      const session = await createCheckoutSession({
        customerId: stripeCustomer.id,
        priceId,
        successUrl: `${req.headers.origin}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${req.headers.origin}/subscription-cancel`,
        userId
      });

      res.json({ 
        sessionId: session.id,
        url: session.url 
      });

    } catch (error) {
      console.error("Checkout session creation failed:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to create checkout session"
      });
    }
  });

  // Create one-time checkout session for coffee tier
  app.post("/api/stripe/create-coffee-checkout", requireAuth, apiLimiter, async (req, res) => {
    try {
      const userId = req.user?.id;
      const userEmail = req.user?.email;

      if (!userId || !userEmail) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Get or create user profile
      let userProfile = await storage.getUserProfile(userId);
      if (!userProfile) {
        userProfile = await storage.createUserProfile({
          id: userId,
          email: userEmail,
          tier: 'starter',
          stripeCustomerId: null,
          subscriptionId: null,
          subscriptionStatus: null,
          creditsRemaining: 0
        });
      }

      // Get or create Stripe customer
      let stripeCustomer;
      if (userProfile.stripeCustomerId) {
        stripeCustomer = await getStripeCustomer(userProfile.stripeCustomerId);
      }
      
      if (!stripeCustomer) {
        stripeCustomer = await createStripeCustomer({
          email: userEmail,
          userId: userId
        });
        
        // Update user profile with Stripe customer ID
        await storage.updateUserProfile(userId, {
          stripeCustomerId: stripeCustomer.id
        });
      }

      // Create one-time payment checkout session
      const priceId = TIER_PRICES.coffee.priceId;
      const session = await createOneTimeCheckoutSession({
        customerId: stripeCustomer.id,
        priceId,
        successUrl: `${req.headers.origin}/coffee-success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${req.headers.origin}/coffee-cancel`,
        userId,
        productType: 'coffee'
      });

      res.json({ 
        sessionId: session.id,
        url: session.url 
      });

    } catch (error) {
      console.error("Coffee checkout session creation failed:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to create coffee checkout session"
      });
    }
  });

  // Create customer portal session
  app.post("/api/stripe/create-portal", requireAuth, apiLimiter, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const userProfile = await storage.getUserProfile(userId);
      if (!userProfile?.stripeCustomerId) {
        return res.status(400).json({ message: "No Stripe customer found" });
      }

      const session = await createPortalSession(
        userProfile.stripeCustomerId,
        `${req.headers.origin}/dashboard`
      );

      res.json({ url: session.url });

    } catch (error) {
      console.error("Portal session creation failed:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to create portal session"
      });
    }
  });

  // Get subscription status
  app.get("/api/stripe/subscription-status", requireAuth, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const userProfile = await storage.getUserProfile(userId);
      if (!userProfile) {
        return res.json({ 
          tier: 'starter', 
          subscriptionStatus: null,
          hasActiveSubscription: false 
        });
      }

      let hasActiveSubscription = false;
      let subscriptions = [];

      if (userProfile.stripeCustomerId) {
        subscriptions = await getCustomerSubscriptions(userProfile.stripeCustomerId);
        hasActiveSubscription = subscriptions.length > 0;
      }

      res.json({
        tier: userProfile.tier,
        subscriptionStatus: userProfile.subscriptionStatus,
        hasActiveSubscription,
        subscriptions: subscriptions.map(sub => ({
          id: sub.id,
          status: sub.status,
          currentPeriodEnd: sub.current_period_end,
          priceId: sub.items.data[0]?.price.id
        }))
      });

    } catch (error) {
      console.error("Failed to get subscription status:", error);
      res.status(500).json({ message: "Failed to get subscription status" });
    }
  });

  // Stripe webhook handler
  app.post("/api/stripe/webhook", async (req, res) => {
    try {
      const signature = req.headers['stripe-signature'] as string;
      const payload = req.body;

      if (!signature) {
        return res.status(400).json({ message: "Missing stripe signature" });
      }

      // Validate webhook signature
      const event = validateWebhookSignature(payload, signature);

      console.log(`Processing Stripe webhook: ${event.type}`);

      // Handle different event types
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as any;
          await handleCheckoutCompleted(session);
          break;
        }
        
        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const subscription = event.data.object as any;
          await handleSubscriptionUpdate(subscription);
          break;
        }
        
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as any;
          await handleSubscriptionCancelled(subscription);
          break;
        }
        
        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as any;
          await handlePaymentSucceeded(invoice);
          break;
        }
        
        case 'invoice.payment_failed': {
          const invoice = event.data.object as any;
          await handlePaymentFailed(invoice);
          break;
        }
        
        default:
          console.log(`Unhandled webhook event: ${event.type}`);
      }

      res.json({ received: true });

    } catch (error) {
      console.error("Webhook processing failed:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Webhook processing failed"
      });
    }
  });
}

// Webhook event handlers
async function handleCheckoutCompleted(session: any) {
  try {
    const userId = session.metadata?.userId;
    const paymentType = session.metadata?.paymentType;
    const productType = session.metadata?.productType;
    
    if (!userId) {
      console.error("No userId in checkout session metadata");
      return;
    }

    console.log(`Checkout completed for user: ${userId}, payment type: ${paymentType || 'subscription'}`);
    
    if (paymentType === 'one_time' && productType === 'coffee') {
      // Handle one-time coffee purchase
      console.log(`Processing coffee purchase for user: ${userId}`);
      
      // Create credit record
      await storage.createOneTimeCredit({
        userId: parseInt(userId), // Convert to number for database
        creditsRemaining: 1, // Coffee tier gives 1 analysis credit
        creditsTotal: 1,
        productType: 'coffee',
        priceId: session.metadata?.priceId,
        stripePaymentIntentId: session.payment_intent
      });
      
      // Update user profile with credits
      const currentProfile = await storage.getUserProfile(userId);
      const currentCredits = currentProfile?.creditsRemaining || 0;
      
      await storage.updateUserProfile(userId, {
        creditsRemaining: currentCredits + 1,
        tier: 'coffee' // Update tier to coffee
      });
      
      console.log(`Added 1 coffee credit to user: ${userId}`);
      
    } else if (session.subscription) {
      // Handle subscription signup
      await storage.updateUserProfile(userId, {
        subscriptionId: session.subscription,
        subscriptionStatus: 'active'
      });
    }
  } catch (error) {
    console.error("Failed to handle checkout completion:", error);
  }
}

async function handleSubscriptionUpdate(subscription: any) {
  try {
    const userId = subscription.metadata?.userId;
    if (!userId) {
      console.error("No userId in subscription metadata");
      return;
    }

    const priceId = subscription.items?.data[0]?.price?.id;
    const tier = getTierFromPriceId(priceId) || 'starter';

    console.log(`Subscription updated for user: ${userId}, tier: ${tier}, status: ${subscription.status}`);

    await storage.updateUserProfile(userId, {
      tier: tier as any,
      subscriptionId: subscription.id,
      subscriptionStatus: subscription.status
    });

    // Record payment history if subscription is active
    if (subscription.status === 'active') {
      await storage.createPaymentHistory({
        userId,
        stripeSubscriptionId: subscription.id,
        amount: subscription.items?.data[0]?.price?.unit_amount || 0,
        currency: subscription.items?.data[0]?.price?.currency || 'usd',
        status: 'paid',
        tier: tier as any
      });
    }

  } catch (error) {
    console.error("Failed to handle subscription update:", error);
  }
}

async function handleSubscriptionCancelled(subscription: any) {
  try {
    const userId = subscription.metadata?.userId;
    if (!userId) {
      console.error("No userId in subscription metadata");
      return;
    }

    console.log(`Subscription cancelled for user: ${userId}`);

    await storage.updateUserProfile(userId, {
      tier: 'starter',
      subscriptionStatus: 'cancelled'
    });

  } catch (error) {
    console.error("Failed to handle subscription cancellation:", error);
  }
}

async function handlePaymentSucceeded(invoice: any) {
  try {
    const subscriptionId = invoice.subscription;
    if (!subscriptionId) return;

    console.log(`Payment succeeded for subscription: ${subscriptionId}`);
    
    // Could add payment history tracking here
    
  } catch (error) {
    console.error("Failed to handle payment success:", error);
  }
}

async function handlePaymentFailed(invoice: any) {
  try {
    const subscriptionId = invoice.subscription;
    if (!subscriptionId) return;

    console.log(`Payment failed for subscription: ${subscriptionId}`);
    
    // Could add failed payment handling here (e.g., notifications, grace period)
    
  } catch (error) {
    console.error("Failed to handle payment failure:", error);
  }
}