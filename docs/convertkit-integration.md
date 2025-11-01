# ConvertKit (Kit) Email Integration

## Overview

LLM.txt Mastery integrates with ConvertKit to provide automated email marketing and user engagement. This enables sophisticated email sequences for onboarding, usage tracking, and upgrade campaigns.

## Features

### 🎯 **Automated Email Sequences**
- **Onboarding**: Welcome sequence for new users
- **Usage Limits**: Triggered when users hit tier limits
- **Upgrade Campaigns**: Targeted campaigns based on tier and usage
- **Analysis Tracking**: Follow-up emails after analysis completion

### 📊 **User Segmentation**
- **Tier-based Tags**: Automatic tagging by user tier (starter/growth/scale)
- **Usage Tracking**: Track analyses, page counts, and engagement
- **Behavioral Triggers**: Sequences based on user actions

### 🔄 **Automated Workflows**
- **Signup Integration**: Automatic subscription on user registration
- **Tier Updates**: Sync tier changes with ConvertKit
- **Limit Notifications**: Alert users when approaching limits
- **Re-engagement**: Target inactive users

## Setup Instructions

### 1. ConvertKit Account Setup
1. Sign up for ConvertKit at [convertkit.com](https://convertkit.com)
2. Get your API credentials from Settings > Account > API
3. Note your API Key and API Secret

### 2. Environment Variables
Add these to your `.env` file:

```env
# ConvertKit API Credentials
CONVERTKIT_API_KEY=your-api-key
CONVERTKIT_API_SECRET=your-api-secret

# Form IDs (create forms in ConvertKit dashboard)
CONVERTKIT_STARTER_FORM_ID=123456
CONVERTKIT_GROWTH_FORM_ID=123457
CONVERTKIT_SCALE_FORM_ID=123458

# Sequence IDs (create sequences in ConvertKit dashboard)
CONVERTKIT_ONBOARDING_SEQUENCE_ID=123459
CONVERTKIT_GROWTH_UPGRADE_SEQUENCE_ID=123460
CONVERTKIT_SCALE_UPGRADE_SEQUENCE_ID=123461
CONVERTKIT_USAGE_LIMITS_SEQUENCE_ID=123462

# Tag IDs (create tags in ConvertKit dashboard)
CONVERTKIT_STARTER_TAG_ID=123463
CONVERTKIT_GROWTH_TAG_ID=123464
CONVERTKIT_SCALE_TAG_ID=123465
CONVERTKIT_ANALYSIS_COMPLETED_TAG_ID=123466
CONVERTKIT_LIMIT_REACHED_TAG_ID=123467
```

### 3. ConvertKit Dashboard Setup

#### Create Forms
Create separate forms for each tier:
- **Starter Form**: Free tier signup
- **Growth Form**: Paid tier signup
- **Scale Form**: Enterprise tier signup

#### Create Sequences
Set up automated email sequences:
- **Onboarding Sequence**: Welcome emails with getting started guide
- **Growth Upgrade Sequence**: Upgrade campaign for starter users
- **Scale Upgrade Sequence**: Enterprise upgrade campaign
- **Usage Limits Sequence**: Limit notification emails

#### Create Tags
Set up tags for subscriber segmentation:
- **Tier Tags**: `starter`, `growth`, `scale`
- **Activity Tags**: `analysis-completed`, `limit-reached`
- **Engagement Tags**: `active-user`, `power-user`

### 4. Email Templates

#### Onboarding Sequence Templates
1. **Welcome Email**: Introduction and getting started
2. **First Analysis Guide**: How to analyze your first website
3. **Tips & Tricks**: Advanced features and best practices
4. **Community**: Join Discord/community resources

#### Upgrade Sequence Templates
1. **Limit Notification**: You've reached your limit
2. **Feature Showcase**: What you get with upgrade
3. **Social Proof**: Testimonials and case studies
4. **Limited Time Offer**: Urgency and scarcity

#### Usage Limit Templates
1. **Soft Limit Warning**: You're approaching your limit
2. **Hard Limit Reached**: Upgrade or wait until reset
3. **Feature Comparison**: See what higher tiers offer
4. **Upgrade Incentive**: Special offer for immediate upgrade

## Integration Points

### 1. User Registration
When users sign up, they're automatically:
- Subscribed to tier-specific form
- Tagged with tier tag
- Added to onboarding sequence

```typescript
// Automatic on signup
await subscribeToTier(email, tier);
await triggerOnboardingSequence(email, tier);
```

### 2. Tier Updates
When users change tiers:
- Old tier tags removed
- New tier tags added
- Tier field updated in subscriber profile

```typescript
// Automatic on tier change
await updateSubscriberTier(email, newTier);
```

### 3. Analysis Completion
After each analysis:
- Analysis data tracked in subscriber profile
- "Analysis completed" tag added
- Follow-up sequence triggered

```typescript
// Automatic after analysis
await trackAnalysisCompleted(email, {
  url, pageCount, tier, cacheHits, analysisTime
});
```

### 4. Usage Limit Triggers
When users hit limits:
- "Limit reached" tag added
- Upgrade sequence triggered
- Limit type and date tracked

```typescript
// Automatic on limit reached
await triggerUpgradeSequence(email, tier, limitType);
```

## API Endpoints

### Check ConvertKit Status
```http
GET /api/convertkit/status
```

Returns configuration status and setup validation.

### Subscriber Information
Integration provides subscriber data including:
- Email and name
- Current tier
- Analysis history
- Usage statistics
- Tag assignments

## Data Tracking

### User Profile Fields
ConvertKit subscriber profiles include:
- `tier`: Current subscription tier
- `signup_source`: Always "llm-txt-mastery"
- `signup_date`: Registration timestamp
- `last_analysis_url`: Most recent analysis
- `last_analysis_date`: Most recent analysis timestamp
- `total_analyses`: Lifetime analysis count
- `total_pages_analyzed`: Lifetime page count
- `limit_reached_type`: Type of limit reached
- `limit_reached_date`: When limit was reached

### Automated Tagging
- **Tier Tags**: `starter`, `growth`, `scale`
- **Activity Tags**: `analysis-completed`, `limit-reached`
- **Engagement Tags**: Based on usage patterns

## Email Campaign Ideas

### Onboarding Campaign (7 days)
1. **Day 0**: Welcome & first analysis walkthrough
2. **Day 1**: Success stories and use cases
3. **Day 3**: Advanced features tour
4. **Day 5**: Community resources and support
5. **Day 7**: Upgrade benefits and next steps

### Upgrade Campaign (5 days)
1. **Day 0**: Limit notification with upgrade CTA
2. **Day 1**: Feature comparison and benefits
3. **Day 3**: Customer testimonials and case studies
4. **Day 5**: Limited-time upgrade offer

### Re-engagement Campaign (3 days)
1. **Day 0**: "We miss you" with value reminder
2. **Day 2**: New features and improvements
3. **Day 4**: Special comeback offer

### Power User Campaign (ongoing)
- Monthly digest of usage statistics
- Advanced tips and tutorials
- Beta feature access
- Community highlights

## Analytics and Reporting

### ConvertKit Metrics
- **Subscription Rate**: Form conversion rates
- **Sequence Performance**: Open and click rates
- **Segment Engagement**: Tier-based performance
- **Tag Effectiveness**: Behavioral tag analysis

### Business Intelligence
- **Upgrade Conversion**: Tier upgrade rates
- **Usage Patterns**: Analysis frequency by tier
- **Churn Prevention**: Engagement-based retention
- **Revenue Attribution**: Email-driven upgrades

## Best Practices

### 1. Segmentation Strategy
- Segment by tier for relevant messaging
- Use behavioral tags for personalization
- Track engagement for re-targeting

### 2. Email Timing
- Send onboarding emails during business hours
- Time upgrade campaigns with usage peaks
- Avoid sending during weekends

### 3. Content Strategy
- Focus on value, not just features
- Use customer success stories
- Provide actionable tips and tutorials

### 4. A/B Testing
- Test subject lines for open rates
- Test CTAs for conversion rates
- Test send times for engagement

## Troubleshooting

### Common Issues
- **API Key Invalid**: Check ConvertKit dashboard settings
- **Form ID Not Found**: Verify form IDs in ConvertKit
- **Sequence Not Triggering**: Check sequence configuration
- **Tags Not Applied**: Verify tag IDs and permissions

### Debug Endpoints
```bash
# Check ConvertKit configuration
curl http://localhost:3000/api/convertkit/status

# Check subscriber info
curl -H "Authorization: Bearer token" http://localhost:3000/api/auth/me
```

### Monitoring
- Monitor ConvertKit error logs
- Track subscription success rates
- Monitor email delivery rates
- Check sequence completion rates

## Integration Benefits

### For Users
- **Personalized Onboarding**: Tailored to their tier
- **Timely Notifications**: Usage alerts and tips
- **Relevant Upgrades**: Targeted upgrade offers
- **Continuous Value**: Ongoing tips and resources

### For Business
- **Automated Nurturing**: Hands-off user engagement
- **Conversion Optimization**: Data-driven upgrade campaigns
- **User Retention**: Proactive engagement and support
- **Revenue Growth**: Systematic upselling and retention

## Future Enhancements

### Planned Features
- **Advanced Segmentation**: ML-based user clustering
- **Predictive Campaigns**: Churn prediction and prevention
- **Integration Analytics**: ConvertKit + app analytics
- **Dynamic Content**: Personalized email content

### Possible Integrations
- **Webhook Support**: Real-time ConvertKit updates
- **Custom Fields**: Extended user profiling
- **Event Tracking**: Detailed user journey mapping
- **SMS Integration**: Multi-channel campaigns

This integration transforms LLM.txt Mastery from a simple tool into a comprehensive user engagement platform, driving both user success and business growth.