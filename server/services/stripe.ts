import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is required');
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    });
  }
  return stripeInstance;
}

export const stripe = getStripe;

// Tier pricing configuration
export const TIER_PRICES = {
  coffee: {
    priceId: process.env.STRIPE_LLM_TXT_COFFEE_PRICE_ID || 'price_llm_txt_coffee_onetime',
    amount: 495, // $4.95 in cents
    currency: 'usd',
    interval: 'one_time' // One-time payment
  },
  growth: {
    priceId: process.env.STRIPE_LLM_TXT_GROWTH_PRICE_ID || 'price_llm_txt_growth_monthly',
    amount: 2500, // $25.00 in cents
    currency: 'usd',
    interval: 'month'
  },
  scale: {
    priceId: process.env.STRIPE_LLM_TXT_SCALE_PRICE_ID || 'price_llm_txt_scale_monthly', 
    amount: 9900, // $99.00 in cents
    currency: 'usd',
    interval: 'month'
  }
} as const;

export interface CreateCustomerParams {
  email: string;
  name?: string;
  userId: string;
}

export interface CreateSubscriptionParams {
  customerId: string;
  priceId: string;
  userId: string;
}

/**
 * Create a Stripe customer
 */
export async function createStripeCustomer(params: CreateCustomerParams): Promise<Stripe.Customer> {
  try {
    const customer = await stripe().customers.create({
      email: params.email,
      name: params.name,
      metadata: {
        userId: params.userId,
        source: 'llm-txt-mastery'
      }
    });

    console.log(`Created Stripe customer: ${customer.id} for user: ${params.userId}`);
    return customer;
  } catch (error) {
    console.error('Failed to create Stripe customer:', error);
    throw new Error(`Failed to create customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create a subscription for a customer
 */
export async function createSubscription(params: CreateSubscriptionParams): Promise<Stripe.Subscription> {
  try {
    const subscription = await stripe().subscriptions.create({
      customer: params.customerId,
      items: [{ price: params.priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        userId: params.userId
      }
    });

    console.log(`Created subscription: ${subscription.id} for customer: ${params.customerId}`);
    return subscription;
  } catch (error) {
    console.error('Failed to create subscription:', error);
    throw new Error(`Failed to create subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create a checkout session for subscription
 */
export async function createCheckoutSession(params: {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  userId: string;
}): Promise<Stripe.Checkout.Session> {
  try {
    const session = await stripe().checkout.sessions.create({
      customer: params.customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: params.priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: {
        userId: params.userId
      }
    });

    console.log(`Created checkout session: ${session.id} for customer: ${params.customerId}`);
    return session;
  } catch (error) {
    console.error('Failed to create checkout session:', error);
    throw new Error(`Failed to create checkout session: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create a one-time payment checkout session (for coffee tier)
 */
export async function createOneTimeCheckoutSession(params: {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  userId: string;
  productType?: string;
}): Promise<Stripe.Checkout.Session> {
  try {
    const session = await stripe().checkout.sessions.create({
      customer: params.customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: params.priceId,
          quantity: 1,
        },
      ],
      mode: 'payment', // One-time payment mode
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: {
        userId: params.userId,
        productType: params.productType || 'coffee',
        paymentType: 'one_time'
      }
    });

    console.log(`Created one-time checkout session: ${session.id} for customer: ${params.customerId}`);
    return session;
  } catch (error) {
    console.error('Failed to create one-time checkout session:', error);
    throw new Error(`Failed to create one-time checkout session: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get customer by ID
 */
export async function getStripeCustomer(customerId: string): Promise<Stripe.Customer | null> {
  try {
    const customer = await stripe().customers.retrieve(customerId);
    return customer.deleted ? null : customer as Stripe.Customer;
  } catch (error) {
    console.error('Failed to get Stripe customer:', error);
    return null;
  }
}

/**
 * Get customer's active subscriptions
 */
export async function getCustomerSubscriptions(customerId: string): Promise<Stripe.Subscription[]> {
  try {
    const subscriptions = await stripe().subscriptions.list({
      customer: customerId,
      status: 'active'
    });
    return subscriptions.data;
  } catch (error) {
    console.error('Failed to get customer subscriptions:', error);
    return [];
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  try {
    const subscription = await stripe().subscriptions.cancel(subscriptionId);
    console.log(`Cancelled subscription: ${subscriptionId}`);
    return subscription;
  } catch (error) {
    console.error('Failed to cancel subscription:', error);
    throw new Error(`Failed to cancel subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create customer portal session for subscription management
 */
export async function createPortalSession(customerId: string, returnUrl: string): Promise<Stripe.BillingPortal.Session> {
  try {
    const session = await stripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
    return session;
  } catch (error) {
    console.error('Failed to create portal session:', error);
    throw new Error(`Failed to create portal session: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate webhook signature
 */
export function validateWebhookSignature(payload: string, signature: string): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is required');
  }

  try {
    return stripe().webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.error('Webhook signature validation failed:', error);
    throw new Error(`Webhook signature validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get tier from price ID
 */
export function getTierFromPriceId(priceId: string): 'coffee' | 'growth' | 'scale' | null {
  if (priceId === TIER_PRICES.coffee.priceId) return 'coffee';
  if (priceId === TIER_PRICES.growth.priceId) return 'growth';
  if (priceId === TIER_PRICES.scale.priceId) return 'scale';
  return null;
}