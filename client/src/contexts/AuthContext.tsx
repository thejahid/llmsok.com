import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase, getCurrentUser, onAuthStateChange } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  email: string
  tier: 'starter' | 'coffee' | 'growth' | 'scale'
  creditsRemaining: number
  stripeCustomerId?: string
  subscriptionId?: string
  subscriptionStatus?: string
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signUp: (email: string, password: string, tier?: 'starter' | 'coffee' | 'growth' | 'scale') => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  userProfile: UserProfile | null
  refreshProfile: () => Promise<void>
  hasCredits: boolean
  canAnalyze: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUser(session.user)
          await fetchUserProfile(session.user.id)
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user)
          await fetchUserProfile(session.user.id)
        } else {
          setUser(null)
          setUserProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (!error) {
        setUserProfile(data)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const signUp = async (email: string, password: string, tier: 'starter' | 'coffee' | 'growth' | 'scale' = 'starter') => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    
    if (error) {
      throw new Error(error.message)
    }
    
    // Create user profile after successful signup
    if (data.user) {
      await supabase
        .from('user_profiles')
        .insert({
          id: data.user.id,
          email: data.user.email,
          tier,
          creditsRemaining: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      throw new Error(error.message)
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      throw new Error(error.message)
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id)
    }
  }

  // Computed properties
  const hasCredits = userProfile?.tier === 'coffee' && (userProfile?.creditsRemaining || 0) > 0
  const canAnalyze = !user || userProfile?.tier === 'starter' || hasCredits || ['growth', 'scale'].includes(userProfile?.tier || '')

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    userProfile,
    refreshProfile,
    hasCredits,
    canAnalyze
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}