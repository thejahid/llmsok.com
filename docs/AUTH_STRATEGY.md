# Authentication & Access Management Strategy

## Overview
LLM.txt Mastery implements a sophisticated tier-based access control system that seamlessly integrates authentication, subscription management, and the coffee tier credit system.

## User Tiers & Access Levels

### Free/Starter Tier
- **Access**: 20 pages per analysis, HTML extraction only
- **Authentication**: Optional (email capture for tracking)
- **Limitations**: Daily limits, no AI analysis
- **Upgrade Path**: Coffee tier ($4.95) or Growth tier ($25/month)

### Coffee Tier ($4.95 one-time)
- **Access**: 200 pages per analysis with AI enhancement
- **Authentication**: Required (account needed for credit tracking)
- **Credit System**: 1 credit = 1 analysis, no expiration
- **Features**: Full AI analysis, quality scoring, priority processing

### Growth Tier ($25/month)
- **Access**: 1000 pages per analysis, unlimited daily analyses
- **Authentication**: Required (subscription management)
- **Features**: File history, priority support, smart caching
- **Billing**: Monthly recurring via Stripe

### Scale Tier ($99/month)
- **Access**: Unlimited pages and analyses
- **Authentication**: Required (enterprise features)
- **Features**: API access, white-label options, dedicated support
- **Billing**: Monthly recurring via Stripe

## Authentication Flow Design

### 1. Guest User Flow
```
Visit Site → Try Free Analysis → Email Capture → 20 Page Analysis
→ Hit Limit → Upgrade Prompt (Coffee/Growth)
```

### 2. Coffee Tier Purchase Flow
```
Hit Free Limit → Coffee Tier CTA → Supabase Sign Up → Stripe Payment 
→ Credit Added → Account Dashboard → Use Credits for Analysis
```

### 3. Subscription Upgrade Flow
```
Need More Features → Growth/Scale CTA → Account Login → Stripe Checkout
→ Subscription Created → Enhanced Features Unlocked
```

## Access Control Implementation

### Middleware Stack
```typescript
// Route protection levels
app.post('/api/analyze', 
  analysisLimiter,           // Rate limiting
  optionalAuth,              // Extract user if available
  checkTierLimits,           // Enforce tier-based limits
  async (req, res) => {      // Process request
    // Analysis logic with tier-appropriate features
  }
);

app.post('/api/stripe/create-coffee-checkout',
  requireAuth,               // Must be authenticated
  apiLimiter,               // Standard rate limiting
  async (req, res) => {     // Coffee purchase
    // Payment processing
  }
);
```

### Tier Limit Enforcement
```typescript
interface TierLimits {
  dailyAnalyses: number;
  maxPagesPerAnalysis: number;
  aiPagesLimit: number;
  features: {
    htmlExtraction: boolean;
    aiAnalysis: boolean;
    fileHistory: boolean;
    prioritySupport: boolean;
    smartCaching: boolean;
  };
}

const TIER_LIMITS = {
  starter: {
    dailyAnalyses: 1,
    maxPagesPerAnalysis: 20,
    aiPagesLimit: 0,
    features: { htmlExtraction: true, aiAnalysis: false }
  },
  coffee: {
    dailyAnalyses: 999, // Credit-based, not daily limited
    maxPagesPerAnalysis: 200,
    aiPagesLimit: 200,
    features: { htmlExtraction: true, aiAnalysis: true }
  },
  growth: {
    dailyAnalyses: 999,
    maxPagesPerAnalysis: 1000,
    aiPagesLimit: 1000,
    features: { htmlExtraction: true, aiAnalysis: true, fileHistory: true }
  }
};
```

## Credit System Integration

### Coffee Tier Credit Management
```typescript
interface CreditSystemFlow {
  purchase: {
    user: AuthenticatedUser;
    payment: StripePayment;
    creditsAdded: 1;
    cost: 495; // $4.95 in cents
  };
  
  consumption: {
    analysisRequest: WebsiteAnalysis;
    creditCheck: boolean;
    creditDeduction: 1;
    remainingCredits: number;
  };
  
  tracking: {
    userId: string;
    creditBalance: number;
    purchaseHistory: CoffeePurchase[];
    usageHistory: CreditUsage[];
  };
}
```

### Database Schema for Credits
```sql
-- One-time credits (coffee tier purchases)
CREATE TABLE one_time_credits (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  stripe_payment_intent_id TEXT UNIQUE,
  credits_purchased INTEGER DEFAULT 1,
  credits_remaining INTEGER DEFAULT 1,
  purchase_amount INTEGER, -- in cents
  created_at TIMESTAMP DEFAULT NOW()
);

-- Credit usage tracking
CREATE TABLE credit_usage (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  credit_id INTEGER REFERENCES one_time_credits(id),
  analysis_id INTEGER REFERENCES sitemap_analysis(id),
  credits_used INTEGER DEFAULT 1,
  used_at TIMESTAMP DEFAULT NOW()
);
```

## User State Management

### Frontend Authentication Context
```typescript
interface AuthContext {
  user: User | null;
  tier: UserTier;
  creditBalance: number;
  subscriptionStatus: SubscriptionStatus;
  isLoading: boolean;
  
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkAccess: (operation: string) => AccessResult;
}

interface AccessResult {
  allowed: boolean;
  reason?: string;
  upgradeRequired?: UserTier;
  creditsNeeded?: number;
}
```

### Real-time Tier Updates
```typescript
// Listen for subscription changes via Stripe webhooks
app.post('/api/stripe/webhook', async (req, res) => {
  const event = validateWebhookSignature(req.body, req.headers['stripe-signature']);
  
  switch (event.type) {
    case 'customer.subscription.created':
      await updateUserTier(userId, 'growth');
      break;
    case 'checkout.session.completed':
      if (isCoffeeTierPurchase(event.data.object)) {
        await addCoffeeCredit(userId);
      }
      break;
  }
});
```

## Security Considerations

### Access Control Matrix
| Operation | Guest | Starter | Coffee | Growth | Scale |
|-----------|-------|---------|--------|--------|-------|
| Basic Analysis (≤20 pages) | ✅ | ✅ | ✅ | ✅ | ✅ |
| AI Analysis | ❌ | ❌ | ✅ | ✅ | ✅ |
| Large Analysis (200+ pages) | ❌ | ❌ | ✅ | ✅ | ✅ |
| File History | ❌ | ❌ | ❌ | ✅ | ✅ |
| API Access | ❌ | ❌ | ❌ | ❌ | ✅ |
| Coffee Purchase | ❌ | ✅ | ✅ | ✅ | ✅ |
| Subscription Management | ❌ | ✅ | ✅ | ✅ | ✅ |

### JWT Token Security
- **Bearer token authentication** with Supabase
- **Token expiration** and refresh handling
- **Scope-based permissions** tied to tier level
- **Rate limiting** per authentication level

### Data Isolation
- **User-scoped queries** prevent data leakage
- **Tier-based feature flags** in database
- **Subscription validation** on every protected request
- **Credit balance verification** before analysis

## Migration Strategy

### Phase 1: Authentication Foundation (Week 1)
1. Set up Supabase project and configure auth
2. Update tier enums to include coffee tier
3. Implement user registration/login flows
4. Create user profile management

### Phase 2: Coffee Tier Integration (Week 2)
1. Connect coffee purchases to user accounts
2. Implement credit balance tracking
3. Update analysis flow to consume credits
4. Add credit display to user dashboard

### Phase 3: Subscription Management (Week 3)
1. Link Stripe subscriptions to user accounts
2. Implement tier upgrade/downgrade flows
3. Add subscription management UI
4. Test end-to-end payment flows

### Phase 4: Advanced Features (Week 4)
1. Implement file history for growth+ tiers
2. Add usage analytics and limits dashboard
3. Create admin panel for user management
4. Performance optimization and monitoring

## Success Metrics

### Conversion Funnel
- **Free → Coffee**: Measure conversion rate at 20-page limit
- **Coffee → Growth**: Track when users exhaust credits
- **Growth → Scale**: Monitor usage patterns and upgrade triggers

### User Engagement
- **Authentication adoption**: % of users who create accounts
- **Credit utilization**: Average time to use coffee tier credit
- **Subscription retention**: Monthly churn rates by tier

### Technical Performance
- **Authentication latency**: Sub-100ms token verification
- **Tier check performance**: Database query optimization
- **Credit system accuracy**: 100% transaction integrity