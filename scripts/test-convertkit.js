#!/usr/bin/env node

/**
 * Test script for ConvertKit integration
 * 
 * Usage: node scripts/test-convertkit.js
 * 
 * This script tests the ConvertKit integration without making real API calls
 * by checking configuration and providing setup validation.
 */

import { config } from 'dotenv';
import { getConvertKitConfig, isConvertKitConfigured } from '../server/services/convertkit.ts';

// Load environment variables
config();

console.log('🧪 Testing ConvertKit Integration\n');

// Test 1: Check if ConvertKit is configured
console.log('1. Configuration Check:');
const configured = isConvertKitConfigured();
console.log(`   ✓ ConvertKit configured: ${configured ? '✅ YES' : '❌ NO'}`);

if (!configured) {
  console.log('   ⚠️  Missing CONVERTKIT_API_KEY or CONVERTKIT_API_SECRET');
  console.log('   📝 Add these to your .env file to enable ConvertKit integration');
}

// Test 2: Check detailed configuration
console.log('\n2. Detailed Configuration:');
const kitConfig = getConvertKitConfig();

console.log(`   API Keys: ${kitConfig.configured ? '✅' : '❌'}`);
console.log(`   Forms configured:`);
console.log(`     - Starter: ${kitConfig.formsConfigured.starter ? '✅' : '❌'}`);
console.log(`     - Growth: ${kitConfig.formsConfigured.growth ? '✅' : '❌'}`);
console.log(`     - Scale: ${kitConfig.formsConfigured.scale ? '✅' : '❌'}`);

console.log(`   Sequences configured:`);
console.log(`     - Onboarding: ${kitConfig.sequencesConfigured.onboarding ? '✅' : '❌'}`);
console.log(`     - Growth upgrade: ${kitConfig.sequencesConfigured.growthUpgrade ? '✅' : '❌'}`);
console.log(`     - Scale upgrade: ${kitConfig.sequencesConfigured.scaleUpgrade ? '✅' : '❌'}`);
console.log(`     - Usage limits: ${kitConfig.sequencesConfigured.usageLimits ? '✅' : '❌'}`);

console.log(`   Tags configured:`);
console.log(`     - Starter: ${kitConfig.tagsConfigured.starter ? '✅' : '❌'}`);
console.log(`     - Growth: ${kitConfig.tagsConfigured.growth ? '✅' : '❌'}`);
console.log(`     - Scale: ${kitConfig.tagsConfigured.scale ? '✅' : '❌'}`);
console.log(`     - Analysis completed: ${kitConfig.tagsConfigured.analysisCompleted ? '✅' : '❌'}`);
console.log(`     - Limit reached: ${kitConfig.tagsConfigured.limitReached ? '✅' : '❌'}`);

// Test 3: Setup recommendations
console.log('\n3. Setup Recommendations:');
const recommendations = [];

if (!kitConfig.configured) {
  recommendations.push('Add CONVERTKIT_API_KEY and CONVERTKIT_API_SECRET to .env');
}

if (!kitConfig.formsConfigured.starter || !kitConfig.formsConfigured.growth || !kitConfig.formsConfigured.scale) {
  recommendations.push('Create forms in ConvertKit dashboard for each tier');
}

if (!kitConfig.sequencesConfigured.onboarding) {
  recommendations.push('Create onboarding sequence for new users');
}

if (!kitConfig.sequencesConfigured.growthUpgrade || !kitConfig.sequencesConfigured.scaleUpgrade) {
  recommendations.push('Create upgrade sequences for tier conversion');
}

if (!kitConfig.tagsConfigured.starter || !kitConfig.tagsConfigured.growth || !kitConfig.tagsConfigured.scale) {
  recommendations.push('Create tier tags for subscriber segmentation');
}

if (recommendations.length === 0) {
  console.log('   🎉 All configurations are complete!');
  console.log('   ✅ ConvertKit integration is ready to use');
} else {
  console.log('   📋 Setup tasks remaining:');
  recommendations.forEach((rec, i) => {
    console.log(`     ${i + 1}. ${rec}`);
  });
}

// Test 4: Environment variable check
console.log('\n4. Environment Variables:');
const envVars = [
  'CONVERTKIT_API_KEY',
  'CONVERTKIT_API_SECRET',
  'CONVERTKIT_STARTER_FORM_ID',
  'CONVERTKIT_GROWTH_FORM_ID',
  'CONVERTKIT_SCALE_FORM_ID',
  'CONVERTKIT_ONBOARDING_SEQUENCE_ID',
  'CONVERTKIT_GROWTH_UPGRADE_SEQUENCE_ID',
  'CONVERTKIT_SCALE_UPGRADE_SEQUENCE_ID',
  'CONVERTKIT_USAGE_LIMITS_SEQUENCE_ID',
  'CONVERTKIT_STARTER_TAG_ID',
  'CONVERTKIT_GROWTH_TAG_ID',
  'CONVERTKIT_SCALE_TAG_ID',
  'CONVERTKIT_ANALYSIS_COMPLETED_TAG_ID',
  'CONVERTKIT_LIMIT_REACHED_TAG_ID'
];

envVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '❌';
  const displayValue = value ? (value.length > 20 ? `${value.substring(0, 20)}...` : value) : 'Not set';
  console.log(`   ${status} ${varName}: ${displayValue}`);
});

// Test 5: Integration points
console.log('\n5. Integration Points:');
console.log('   📧 User signup: Automatic subscription to tier-specific form');
console.log('   🎯 Tier updates: Automatic tag and field updates');
console.log('   📊 Analysis completion: Automatic tracking and follow-up');
console.log('   🚨 Usage limits: Automatic upgrade sequence triggers');
console.log('   👋 Onboarding: Welcome sequence for new users');

console.log('\n📖 For detailed setup instructions, see: docs/convertkit-integration.md');
console.log('🔧 To check configuration via API: GET /api/convertkit/status');

console.log('\n✨ ConvertKit integration test completed!');