import { Request, Response, NextFunction } from 'express'
import { verifyAuthToken, getUserProfile } from '../supabase'

// Extend Express Request to include user information
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        tier: 'starter' | 'coffee' | 'growth' | 'scale'
      }
    }
  }
}

// Middleware to verify authentication token
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please provide a valid authentication token'
      })
    }
    
    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    
    // Verify the token with Supabase
    const user = await verifyAuthToken(token)
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'Authentication token is invalid or expired'
      })
    }
    
    // Get user profile with tier information
    const userProfile = await getUserProfile(user.id)
    
    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email || '',
      tier: userProfile?.tier || 'starter'
    }
    
    next()
  } catch (error) {
    console.error('Authentication error:', error)
    res.status(401).json({ 
      error: 'Authentication failed',
      message: 'Invalid or expired authentication token'
    })
  }
}

// Optional auth middleware - doesn't require authentication but adds user info if available
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      
      try {
        const user = await verifyAuthToken(token)
        
        if (user) {
          const userProfile = await getUserProfile(user.id)
          
          req.user = {
            id: user.id,
            email: user.email || '',
            tier: userProfile?.tier || 'starter'
          }
        }
      } catch (error) {
        // Ignore auth errors in optional auth
        console.log('Optional auth failed:', error)
      }
    }
    
    next()
  } catch (error) {
    // Don't block the request if optional auth fails
    next()
  }
}

// Middleware to check if user has sufficient tier for operation
export function requireTier(minTier: 'starter' | 'coffee' | 'growth' | 'scale') {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please sign in to access this feature'
      })
    }
    
    const tierLevels = { starter: 1, coffee: 2, growth: 3, scale: 4 }
    const userTierLevel = tierLevels[req.user.tier]
    const requiredTierLevel = tierLevels[minTier]
    
    if (userTierLevel < requiredTierLevel) {
      return res.status(403).json({ 
        error: 'Insufficient tier',
        message: `This feature requires ${minTier} tier or higher. You are on ${req.user.tier} tier.`,
        currentTier: req.user.tier,
        requiredTier: minTier,
        upgradeUrl: '/upgrade'
      })
    }
    
    next()
  }
}