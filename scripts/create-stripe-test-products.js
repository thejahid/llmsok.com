#!/usr/bin/env node
import dotenv from 'dotenv';

// Load test environment
dotenv.config({ path: '.env.test' });

async function createStripeTestProducts() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  
  console.log('🛍️ Creating Stripe Test Products...');
  console.log('🔑 Using test key:', stripeSecretKey?.substring(0, 20) + '...');
  
  if (!stripeSecretKey) {
    console.error('❌ STRIPE_SECRET_KEY not found');
    process.exit(1);
  }
  
  try {
    // Coffee Analysis Product (One-time)
    console.log('\n☕ Creating Coffee Analysis Product...');
    const coffeeProduct = await fetch('https://api.stripe.com/v1/products', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        name: 'Coffee Analysis',
        description: '1 premium website analysis with AI enhancement (up to 200 pages)',
        type: 'service'
      })
    });
    
    if (!coffeeProduct.ok) {
      throw new Error(`Failed to create coffee product: ${await coffeeProduct.text()}`);
    }
    
    const coffeeProductData = await coffeeProduct.json();
    console.log('✅ Coffee product created:', coffeeProductData.id);
    
    // Coffee Price (One-time $4.95)
    const coffeePrice = await fetch('https://api.stripe.com/v1/prices', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        product: coffeeProductData.id,
        unit_amount: '495', // $4.95 in cents
        currency: 'usd',
        nickname: 'Coffee Analysis'
      })
    });
    
    if (!coffeePrice.ok) {
      throw new Error(`Failed to create coffee price: ${await coffeePrice.text()}`);
    }
    
    const coffeePriceData = await coffeePrice.json();
    console.log('✅ Coffee price created:', coffeePriceData.id);
    
    // Growth Subscription Product
    console.log('\n📈 Creating Growth Subscription Product...');
    const growthProduct = await fetch('https://api.stripe.com/v1/products', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        name: 'Growth Plan',
        description: 'Unlimited analyses, 1,000 pages per analysis, AI-enhanced analysis',
        type: 'service'
      })
    });
    
    if (!growthProduct.ok) {
      throw new Error(`Failed to create growth product: ${await growthProduct.text()}`);
    }
    
    const growthProductData = await growthProduct.json();
    console.log('✅ Growth product created:', growthProductData.id);
    
    // Growth Price ($25/month)
    const growthPrice = await fetch('https://api.stripe.com/v1/prices', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        product: growthProductData.id,
        unit_amount: '2500', // $25 in cents
        currency: 'usd',
'recurring[interval]': 'month',
        nickname: 'Growth Monthly'
      })
    });
    
    if (!growthPrice.ok) {
      throw new Error(`Failed to create growth price: ${await growthPrice.text()}`);
    }
    
    const growthPriceData = await growthPrice.json();
    console.log('✅ Growth price created:', growthPriceData.id);
    
    // Scale Subscription Product
    console.log('\n🚀 Creating Scale Subscription Product...');
    const scaleProduct = await fetch('https://api.stripe.com/v1/products', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        name: 'Scale Plan',
        description: 'Unlimited everything, full AI analysis, API access, white-label options',
        type: 'service'
      })
    });
    
    if (!scaleProduct.ok) {
      throw new Error(`Failed to create scale product: ${await scaleProduct.text()}`);
    }
    
    const scaleProductData = await scaleProduct.json();
    console.log('✅ Scale product created:', scaleProductData.id);
    
    // Scale Price ($99/month)
    const scalePrice = await fetch('https://api.stripe.com/v1/prices', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        product: scaleProductData.id,
        unit_amount: '9900', // $99 in cents
        currency: 'usd',
'recurring[interval]': 'month',
        nickname: 'Scale Monthly'
      })
    });
    
    if (!scalePrice.ok) {
      throw new Error(`Failed to create scale price: ${await scalePrice.text()}`);
    }
    
    const scalePriceData = await scalePrice.json();
    console.log('✅ Scale price created:', scalePriceData.id);
    
    // Output the price IDs for .env.test
    console.log('\n🎉 All products created successfully!');
    console.log('\n📋 Add these to your .env.test file:');
    console.log(`STRIPE_LLM_TXT_COFFEE_PRICE_ID=${coffeePriceData.id}`);
    console.log(`STRIPE_LLM_TXT_GROWTH_PRICE_ID=${growthPriceData.id}`);
    console.log(`STRIPE_LLM_TXT_SCALE_PRICE_ID=${scalePriceData.id}`);
    
    return {
      coffee: coffeePriceData.id,
      growth: growthPriceData.id,
      scale: scalePriceData.id
    };
    
  } catch (error) {
    console.error('❌ Failed to create products:', error.message);
    process.exit(1);
  }
}

createStripeTestProducts();