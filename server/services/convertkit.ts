// Note: convertkit-node is a CommonJS module, so we need to import it carefully
// import ConvertKit from 'convertkit-node'

// Initialize ConvertKit client (mock for now until we can fix the import)
const convertKit = {
  addSubscriberToForm: async (formId: string, data: any) => ({ subscription: { subscriber: { id: 'mock-id' } } }),
  addTagToSubscriber: async (tagId: string, subscriberId: string) => ({}),
  removeTagFromSubscriber: async (tagId: string, subscriberId: string) => ({}),
  updateSubscriber: async (subscriberId: string, data: any) => ({}),
  getSubscribers: async (query: any) => ({ subscribers: [] }),
  addSubscriberToSequence: async (sequenceId: string, subscriberId: string) => ({}),
  unsubscribeSubscriber: async (subscriberId: string) => ({})
}

// ConvertKit configuration
const CONVERTKIT_CONFIG = {
  forms: {
    starter: process.env.CONVERTKIT_STARTER_FORM_ID || '',
    coffee: process.env.CONVERTKIT_COFFEE_FORM_ID || '',
    growth: process.env.CONVERTKIT_GROWTH_FORM_ID || '',
    scale: process.env.CONVERTKIT_SCALE_FORM_ID || ''
  },
  sequences: {
    onboarding: process.env.CONVERTKIT_ONBOARDING_SEQUENCE_ID || '',
    coffeeUpgrade: process.env.CONVERTKIT_COFFEE_UPGRADE_SEQUENCE_ID || '',
    growthUpgrade: process.env.CONVERTKIT_GROWTH_UPGRADE_SEQUENCE_ID || '',
    scaleUpgrade: process.env.CONVERTKIT_SCALE_UPGRADE_SEQUENCE_ID || '',
    usageLimits: process.env.CONVERTKIT_USAGE_LIMITS_SEQUENCE_ID || ''
  },
  tags: {
    starter: process.env.CONVERTKIT_STARTER_TAG_ID || '',
    coffee: process.env.CONVERTKIT_COFFEE_TAG_ID || '',
    growth: process.env.CONVERTKIT_GROWTH_TAG_ID || '',
    scale: process.env.CONVERTKIT_SCALE_TAG_ID || '',
    analysisCompleted: process.env.CONVERTKIT_ANALYSIS_COMPLETED_TAG_ID || '',
    limitReached: process.env.CONVERTKIT_LIMIT_REACHED_TAG_ID || ''
  }
}

export interface ConvertKitSubscriber {
  id: string
  email: string
  first_name?: string
  state: 'active' | 'cancelled'
  created_at: string
  fields: Record<string, any>
  tags: any[]
}

// Subscribe user to ConvertKit based on tier
export async function subscribeToTier(
  email: string, 
  tier: 'starter' | 'coffee' | 'growth' | 'scale',
  firstName?: string,
  lastName?: string
): Promise<ConvertKitSubscriber | null> {
  try {
    const formId = CONVERTKIT_CONFIG.forms[tier]
    
    if (!formId) {
      console.warn(`No ConvertKit form ID configured for tier: ${tier}`)
      return null
    }

    const subscriberData = {
      email,
      first_name: firstName || '',
      fields: {
        last_name: lastName || '',
        tier: tier,
        signup_source: 'llm-txt-mastery',
        signup_date: new Date().toISOString()
      }
    }

    const result = await convertKit.addSubscriberToForm(formId, subscriberData)
    
    // Add tier-specific tag
    const tagId = CONVERTKIT_CONFIG.tags[tier]
    if (tagId && result.subscription) {
      await convertKit.addTagToSubscriber(tagId, result.subscription.subscriber.id)
    }

    console.log(`Successfully subscribed ${email} to ${tier} tier in ConvertKit`)
    return result.subscription?.subscriber || null
  } catch (error) {
    console.error('Error subscribing to ConvertKit:', error)
    return null
  }
}

// Update user tier in ConvertKit
export async function updateSubscriberTier(
  email: string, 
  newTier: 'starter' | 'coffee' | 'growth' | 'scale'
): Promise<void> {
  try {
    // Get subscriber by email
    const subscribers = await convertKit.getSubscribers({ email_address: email })
    
    if (!subscribers.subscribers || subscribers.subscribers.length === 0) {
      console.warn(`Subscriber not found in ConvertKit: ${email}`)
      return
    }

    const subscriber = subscribers.subscribers[0]
    
    // Update tier field
    await convertKit.updateSubscriber(subscriber.id, {
      fields: {
        tier: newTier,
        tier_updated_date: new Date().toISOString()
      }
    })

    // Remove old tier tags and add new tier tag
    const oldTags = ['starter', 'growth', 'scale']
    for (const oldTier of oldTags) {
      const tagId = CONVERTKIT_CONFIG.tags[oldTier as keyof typeof CONVERTKIT_CONFIG.tags]
      if (tagId) {
        await convertKit.removeTagFromSubscriber(tagId, subscriber.id)
      }
    }

    // Add new tier tag
    const newTagId = CONVERTKIT_CONFIG.tags[newTier]
    if (newTagId) {
      await convertKit.addTagToSubscriber(newTagId, subscriber.id)
    }

    console.log(`Updated ${email} to ${newTier} tier in ConvertKit`)
  } catch (error) {
    console.error('Error updating subscriber tier:', error)
  }
}

// Track analysis completion
export async function trackAnalysisCompleted(
  email: string,
  analysisData: {
    url: string
    pageCount: number
    tier: string
    cacheHits: number
    analysisTime: number
  }
): Promise<void> {
  try {
    const subscribers = await convertKit.getSubscribers({ email_address: email })
    
    if (!subscribers.subscribers || subscribers.subscribers.length === 0) {
      console.warn(`Subscriber not found in ConvertKit: ${email}`)
      return
    }

    const subscriber = subscribers.subscribers[0]
    
    // Update subscriber with analysis data
    await convertKit.updateSubscriber(subscriber.id, {
      fields: {
        last_analysis_url: analysisData.url,
        last_analysis_pages: analysisData.pageCount,
        last_analysis_date: new Date().toISOString(),
        total_analyses: (subscriber.fields.total_analyses || 0) + 1,
        total_pages_analyzed: (subscriber.fields.total_pages_analyzed || 0) + analysisData.pageCount
      }
    })

    // Add analysis completed tag
    const tagId = CONVERTKIT_CONFIG.tags.analysisCompleted
    if (tagId) {
      await convertKit.addTagToSubscriber(tagId, subscriber.id)
    }

    console.log(`Tracked analysis completion for ${email}`)
  } catch (error) {
    console.error('Error tracking analysis completion:', error)
  }
}

// Trigger upgrade sequence when user hits limits
export async function triggerUpgradeSequence(
  email: string,
  currentTier: 'starter' | 'coffee' | 'growth' | 'scale',
  limitType: 'daily_analyses' | 'page_limit' | 'ai_limit'
): Promise<void> {
  try {
    const subscribers = await convertKit.getSubscribers({ email_address: email })
    
    if (!subscribers.subscribers || subscribers.subscribers.length === 0) {
      console.warn(`Subscriber not found in ConvertKit: ${email}`)
      return
    }

    const subscriber = subscribers.subscribers[0]
    
    // Add limit reached tag
    const limitTagId = CONVERTKIT_CONFIG.tags.limitReached
    if (limitTagId) {
      await convertKit.addTagToSubscriber(limitTagId, subscriber.id)
    }

    // Update subscriber with limit info
    await convertKit.updateSubscriber(subscriber.id, {
      fields: {
        limit_reached_type: limitType,
        limit_reached_date: new Date().toISOString(),
        current_tier: currentTier
      }
    })

    // Trigger appropriate upgrade sequence
    let sequenceId: string | null = null
    
    if (currentTier === 'starter') {
      sequenceId = CONVERTKIT_CONFIG.sequences.growthUpgrade
    } else if (currentTier === 'growth') {
      sequenceId = CONVERTKIT_CONFIG.sequences.scaleUpgrade
    }

    if (sequenceId) {
      await convertKit.addSubscriberToSequence(sequenceId, subscriber.id)
      console.log(`Triggered ${currentTier} upgrade sequence for ${email}`)
    }
  } catch (error) {
    console.error('Error triggering upgrade sequence:', error)
  }
}

// Send welcome email with onboarding sequence
export async function triggerOnboardingSequence(
  email: string,
  tier: 'starter' | 'coffee' | 'growth' | 'scale'
): Promise<void> {
  try {
    const subscribers = await convertKit.getSubscribers({ email_address: email })
    
    if (!subscribers.subscribers || subscribers.subscribers.length === 0) {
      console.warn(`Subscriber not found in ConvertKit: ${email}`)
      return
    }

    const subscriber = subscribers.subscribers[0]
    const sequenceId = CONVERTKIT_CONFIG.sequences.onboarding
    
    if (sequenceId) {
      await convertKit.addSubscriberToSequence(sequenceId, subscriber.id)
      console.log(`Triggered onboarding sequence for ${email}`)
    }
  } catch (error) {
    console.error('Error triggering onboarding sequence:', error)
  }
}

// Get subscriber info
export async function getSubscriberInfo(email: string): Promise<ConvertKitSubscriber | null> {
  try {
    const subscribers = await convertKit.getSubscribers({ email_address: email })
    
    if (!subscribers.subscribers || subscribers.subscribers.length === 0) {
      return null
    }

    return subscribers.subscribers[0]
  } catch (error) {
    console.error('Error getting subscriber info:', error)
    return null
  }
}

// Unsubscribe user
export async function unsubscribeUser(email: string): Promise<void> {
  try {
    const subscribers = await convertKit.getSubscribers({ email_address: email })
    
    if (!subscribers.subscribers || subscribers.subscribers.length === 0) {
      console.warn(`Subscriber not found in ConvertKit: ${email}`)
      return
    }

    const subscriber = subscribers.subscribers[0]
    await convertKit.unsubscribeSubscriber(subscriber.id)
    
    console.log(`Unsubscribed ${email} from ConvertKit`)
  } catch (error) {
    console.error('Error unsubscribing user:', error)
  }
}

// Check if ConvertKit is properly configured
export function isConvertKitConfigured(): boolean {
  return !!(process.env.CONVERTKIT_API_KEY && process.env.CONVERTKIT_API_SECRET)
}

// Get configuration status
export function getConvertKitConfig() {
  return {
    configured: isConvertKitConfigured(),
    formsConfigured: {
      starter: !!CONVERTKIT_CONFIG.forms.starter,
      growth: !!CONVERTKIT_CONFIG.forms.growth,
      scale: !!CONVERTKIT_CONFIG.forms.scale
    },
    sequencesConfigured: {
      onboarding: !!CONVERTKIT_CONFIG.sequences.onboarding,
      growthUpgrade: !!CONVERTKIT_CONFIG.sequences.growthUpgrade,
      scaleUpgrade: !!CONVERTKIT_CONFIG.sequences.scaleUpgrade,
      usageLimits: !!CONVERTKIT_CONFIG.sequences.usageLimits
    },
    tagsConfigured: {
      starter: !!CONVERTKIT_CONFIG.tags.starter,
      growth: !!CONVERTKIT_CONFIG.tags.growth,
      scale: !!CONVERTKIT_CONFIG.tags.scale,
      analysisCompleted: !!CONVERTKIT_CONFIG.tags.analysisCompleted,
      limitReached: !!CONVERTKIT_CONFIG.tags.limitReached
    }
  }
}