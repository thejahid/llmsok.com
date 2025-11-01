import { Router } from 'express'
import { signUpWithEmail, signInWithEmail, signOut, createUserProfile, getUserProfile, updateUserTier, getUserByEmail, sendPasswordResetEmail, updatePassword, resendEmailVerification } from '../supabase'
import { requireAuth } from '../middleware/auth'
import { authLimiter, passwordResetLimiter } from '../middleware/rate-limit'
import { subscribeToTier, updateSubscriberTier, triggerOnboardingSequence, isConvertKitConfigured } from '../services/convertkit'
import { z } from 'zod'

const router = Router()

// Validation schemas
const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  tier: z.enum(['starter', 'coffee', 'growth', 'scale']).default('starter')
})

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

const updateTierSchema = z.object({
  tier: z.enum(['starter', 'coffee', 'growth', 'scale'])
})

const passwordResetSchema = z.object({
  email: z.string().email()
})

const passwordUpdateSchema = z.object({
  password: z.string().min(6)
})

// Sign up endpoint
router.post('/signup', authLimiter, async (req, res) => {
  try {
    const { email, password, tier } = signUpSchema.parse(req.body)
    
    // Check if user already exists in our system
    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      return res.status(400).json({
        error: 'User already exists',
        message: 'An account with this email already exists'
      })
    }
    
    // Create user with Supabase Auth
    const { user, session } = await signUpWithEmail(email, password)
    
    if (!user) {
      return res.status(400).json({
        error: 'Signup failed',
        message: 'Failed to create user account'
      })
    }
    
    // Create user profile with tier information
    await createUserProfile(user.id, email, tier)
    
    // Subscribe to ConvertKit if configured
    if (isConvertKitConfigured()) {
      try {
        await subscribeToTier(email, tier)
        await triggerOnboardingSequence(email, tier)
      } catch (error) {
        console.error('ConvertKit subscription failed:', error)
        // Don't fail the signup if ConvertKit fails
      }
    }
    
    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        tier,
        emailVerified: user.email_confirmed_at !== null
      },
      session: session ? {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at
      } : null
    })
  } catch (error) {
    console.error('Signup error:', error)
    res.status(400).json({
      error: 'Signup failed',
      message: error instanceof Error ? error.message : 'Failed to create account'
    })
  }
})

// Sign in endpoint
router.post('/signin', authLimiter, async (req, res) => {
  try {
    const { email, password } = signInSchema.parse(req.body)
    
    // Sign in with Supabase Auth
    const { user, session } = await signInWithEmail(email, password)
    
    if (!user || !session) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Invalid email or password'
      })
    }
    
    // Get user profile with tier information
    const userProfile = await getUserProfile(user.id)
    
    res.json({
      message: 'Signed in successfully',
      user: {
        id: user.id,
        email: user.email,
        tier: userProfile?.tier || 'starter',
        emailVerified: user.email_confirmed_at !== null
      },
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at
      }
    })
  } catch (error) {
    console.error('Signin error:', error)
    res.status(401).json({
      error: 'Signin failed',
      message: error instanceof Error ? error.message : 'Invalid credentials'
    })
  }
})

// Sign out endpoint
router.post('/signout', requireAuth, async (req, res) => {
  try {
    await signOut()
    res.json({ message: 'Signed out successfully' })
  } catch (error) {
    console.error('Signout error:', error)
    res.status(500).json({
      error: 'Signout failed',
      message: error instanceof Error ? error.message : 'Failed to sign out'
    })
  }
})

// Get current user profile
router.get('/me', requireAuth, async (req, res) => {
  try {
    const userProfile = await getUserProfile(req.user!.id)
    
    res.json({
      user: {
        id: req.user!.id,
        email: req.user!.email,
        tier: userProfile?.tier || 'starter',
        createdAt: userProfile?.created_at,
        updatedAt: userProfile?.updated_at
      }
    })
  } catch (error) {
    console.error('Get user profile error:', error)
    res.status(500).json({
      error: 'Failed to get user profile',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Update user tier
router.patch('/me/tier', requireAuth, async (req, res) => {
  try {
    const { tier } = updateTierSchema.parse(req.body)
    
    // Update user tier
    const updatedProfile = await updateUserTier(req.user!.id, tier)
    
    // Update tier in ConvertKit if configured
    if (isConvertKitConfigured()) {
      try {
        await updateSubscriberTier(req.user!.email, tier)
      } catch (error) {
        console.error('ConvertKit tier update failed:', error)
        // Don't fail the tier update if ConvertKit fails
      }
    }
    
    res.json({
      message: 'Tier updated successfully',
      user: {
        id: req.user!.id,
        email: req.user!.email,
        tier: updatedProfile.tier,
        updatedAt: updatedProfile.updated_at
      }
    })
  } catch (error) {
    console.error('Update tier error:', error)
    res.status(500).json({
      error: 'Failed to update tier',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Password reset request endpoint
router.post('/forgot-password', passwordResetLimiter, async (req, res) => {
  try {
    const { email } = passwordResetSchema.parse(req.body)
    
    // Check if user exists in our system
    const existingUser = await getUserByEmail(email)
    if (!existingUser) {
      // Don't reveal whether the email exists or not for security
      return res.json({
        message: 'If an account with that email exists, we sent you a password reset link.',
      })
    }
    
    // Send password reset email
    await sendPasswordResetEmail(email)
    
    res.json({
      message: 'If an account with that email exists, we sent you a password reset link.',
    })
  } catch (error) {
    console.error('Password reset error:', error)
    res.status(500).json({
      error: 'Failed to process password reset request',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Update password endpoint (requires authentication)
router.post('/update-password', requireAuth, async (req, res) => {
  try {
    const { password } = passwordUpdateSchema.parse(req.body)
    
    // Get the user's access token from the request
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No access token provided' })
    }
    
    const accessToken = authHeader.substring(7)
    
    // Update password
    await updatePassword(accessToken, password)
    
    res.json({
      message: 'Password updated successfully'
    })
  } catch (error) {
    console.error('Password update error:', error)
    res.status(500).json({
      error: 'Failed to update password',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Resend email verification
router.post('/resend-verification', authLimiter, async (req, res) => {
  try {
    const { email } = passwordResetSchema.parse(req.body) // Reuse the same schema
    
    // Check if user exists
    const existingUser = await getUserByEmail(email)
    if (!existingUser) {
      return res.status(404).json({
        error: 'User not found'
      })
    }
    
    // Resend verification email
    await resendEmailVerification(email)
    
    res.json({
      message: 'Verification email sent successfully'
    })
  } catch (error) {
    console.error('Resend verification error:', error)
    res.status(500).json({
      error: 'Failed to resend verification email',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router