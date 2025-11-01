import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for Supabase auth
export interface AuthUser {
  id: string
  email: string
  emailVerified: boolean
  createdAt: string
  tier: 'starter' | 'coffee' | 'growth' | 'scale'
}

// Helper functions for authentication
export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  
  if (error) {
    throw new Error(error.message)
  }
  
  return data
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) {
    throw new Error(error.message)
  }
  
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    throw new Error(error.message)
  }
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    throw new Error(error.message)
  }
  
  return user
}

// Create or update user profile with tier information
export async function createUserProfile(userId: string, email: string, tier: 'starter' | 'coffee' | 'growth' | 'scale' = 'starter') {
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert({
      id: userId,
      email,
      tier,
      updated_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) {
    throw new Error(error.message)
  }
  
  return data
}

// Get user profile with tier information
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) {
    throw new Error(error.message)
  }
  
  return data
}

// Update user tier
export async function updateUserTier(userId: string, tier: 'starter' | 'coffee' | 'growth' | 'scale') {
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ 
      tier,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single()
  
  if (error) {
    throw new Error(error.message)
  }
  
  return data
}

// Password reset functionality
export async function sendPasswordResetEmail(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password`,
  })
  
  if (error) {
    throw new Error(error.message)
  }
  
  return { message: 'Password reset email sent successfully' }
}

export async function updatePassword(accessToken: string, newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  })
  
  if (error) {
    throw new Error(error.message)
  }
  
  return { message: 'Password updated successfully' }
}

export async function resendEmailVerification(email: string) {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email,
    options: {
      emailRedirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email`
    }
  })
  
  if (error) {
    throw new Error(error.message)
  }
  
  return { message: 'Verification email sent successfully' }
}

// Middleware to verify JWT token
export async function verifyAuthToken(token: string) {
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error) {
    throw new Error('Invalid or expired token')
  }
  
  return user
}

// Get user by email (for existing email capture integration)
export async function getUserByEmail(email: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('email', email)
    .single()
  
  if (error && error.code !== 'PGRST116') { // Not found error
    throw new Error(error.message)
  }
  
  return data
}