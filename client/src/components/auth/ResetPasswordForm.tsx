import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { apiRequest } from '@/lib/queryClient'

export default function ResetPasswordForm() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Get the access token from URL params (sent by Supabase)
  const accessToken = searchParams.get('access_token')
  const type = searchParams.get('type')

  useEffect(() => {
    // Verify this is a password reset request
    if (type !== 'recovery' || !accessToken) {
      setError('Invalid or expired password reset link.')
    }
  }, [type, accessToken])

  const validatePassword = (pwd: string): string[] => {
    const issues = []
    if (pwd.length < 6) issues.push('At least 6 characters')
    if (!/[A-Z]/.test(pwd)) issues.push('One uppercase letter')
    if (!/[a-z]/.test(pwd)) issues.push('One lowercase letter')
    if (!/[0-9]/.test(pwd)) issues.push('One number')
    return issues
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!accessToken) {
      setError('Invalid reset link')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    const passwordIssues = validatePassword(password)
    if (passwordIssues.length > 0) {
      setError(`Password must have: ${passwordIssues.join(', ')}`)
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await apiRequest('POST', '/api/auth/update-password', {
        password
      })

      if (response.ok) {
        setSuccess(true)
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update password')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
        <div className="text-center space-y-4">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
          <h2 className="text-2xl font-bold text-framework-black">Password Updated!</h2>
          <p className="text-ai-silver">
            Your password has been successfully updated. You'll be redirected to the login page shortly.
          </p>
          <Button 
            onClick={() => navigate('/login')}
            className="bg-mastery-blue hover:bg-mastery-blue/90"
          >
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  if (type !== 'recovery' || !accessToken) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-framework-black">Invalid Reset Link</h2>
          <p className="text-ai-silver">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <Button 
            onClick={() => navigate('/forgot-password')}
            className="bg-mastery-blue hover:bg-mastery-blue/90"
          >
            Request New Reset Link
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-bold text-framework-black">Set New Password</h2>
          <p className="text-ai-silver">
            Please enter your new password below.
          </p>
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                required
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-ai-silver" />
                ) : (
                  <Eye className="h-4 w-4 text-ai-silver" />
                )}
              </Button>
            </div>
            {password && (
              <div className="text-xs text-ai-silver space-y-1">
                <p>Password must have:</p>
                <div className="space-y-1">
                  {validatePassword(password).map((issue, index) => (
                    <p key={index} className="text-red-500">• {issue}</p>
                  ))}
                  {validatePassword(password).length === 0 && (
                    <p className="text-green-500">• All requirements met ✓</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-ai-silver" />
                ) : (
                  <Eye className="h-4 w-4 text-ai-silver" />
                )}
              </Button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-500">Passwords do not match</p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full bg-mastery-blue hover:bg-mastery-blue/90"
            disabled={
              isLoading || 
              !password || 
              !confirmPassword || 
              password !== confirmPassword ||
              validatePassword(password).length > 0
            }
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating password...
              </>
            ) : (
              'Update Password'
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}