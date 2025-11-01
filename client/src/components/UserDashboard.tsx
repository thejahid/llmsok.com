import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Coffee, Crown, Zap, Star, CreditCard, LogOut } from 'lucide-react'
import { createCoffeeCheckoutSession } from '@/lib/stripe'
import { useState } from 'react'

export function UserDashboard() {
  const { user, userProfile, signOut, refreshProfile } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  if (!user || !userProfile) {
    return null
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'coffee':
        return <Coffee className="h-4 w-4" />
      case 'growth':
        return <Zap className="h-4 w-4" />
      case 'scale':
        return <Crown className="h-4 w-4" />
      default:
        return <Star className="h-4 w-4" />
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'coffee':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'growth':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'scale':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const handleCoffeePurchase = async () => {
    try {
      setIsLoading(true)
      const { url } = await createCoffeeCheckoutSession(user.email!)
      window.location.href = url
    } catch (error) {
      console.error('Failed to create checkout session:', error)
      alert('Failed to start checkout. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Account Dashboard</CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Tier */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Current Tier</span>
            <Badge className={`${getTierColor(userProfile.tier)} flex items-center gap-1`}>
              {getTierIcon(userProfile.tier)}
              {userProfile.tier.charAt(0).toUpperCase() + userProfile.tier.slice(1)}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Credits Display (Coffee Tier Only) */}
        {userProfile.tier === 'coffee' && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Analysis Credits</span>
                <span className="text-lg font-bold text-orange-600">
                  {userProfile.creditsRemaining}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Each credit allows one website analysis (up to 200 pages with AI enhancement)
              </div>
            </div>

            {userProfile.creditsRemaining === 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-sm text-orange-800 mb-2">
                  No credits remaining. Purchase more to continue analyzing websites.
                </p>
                <Button 
                  onClick={handleCoffeePurchase}
                  disabled={isLoading}
                  size="sm"
                  className="w-full"
                >
                  <Coffee className="h-4 w-4 mr-2" />
                  {isLoading ? 'Loading...' : 'Buy Another Credit ($4.95)'}
                </Button>
              </div>
            )}

            <Separator />
          </>
        )}

        {/* Tier Features */}
        <div className="space-y-2">
          <span className="text-sm font-medium">Your Features</span>
          <div className="text-xs text-gray-600 space-y-1">
            {userProfile.tier === 'starter' && (
              <>
                <div>• 20 pages per analysis</div>
                <div>• HTML extraction only</div>
                <div>• Basic file generation</div>
              </>
            )}
            {userProfile.tier === 'coffee' && (
              <>
                <div>• 200 pages per analysis</div>
                <div>• AI-enhanced analysis</div>
                <div>• Quality scoring & insights</div>
                <div>• Credits never expire</div>
              </>
            )}
            {userProfile.tier === 'growth' && (
              <>
                <div>• 1,000 pages per analysis</div>
                <div>• Unlimited AI analysis</div>
                <div>• File history</div>
                <div>• Priority support</div>
                <div>• Smart caching</div>
              </>
            )}
            {userProfile.tier === 'scale' && (
              <>
                <div>• Unlimited pages</div>
                <div>• Unlimited analyses</div>
                <div>• API access</div>
                <div>• White-label options</div>
                <div>• Dedicated support</div>
              </>
            )}
          </div>
        </div>

        {/* Upgrade Options */}
        {userProfile.tier === 'starter' && (
          <>
            <Separator />
            <div className="space-y-2">
              <span className="text-sm font-medium">Upgrade Options</span>
              <div className="space-y-2">
                <Button 
                  onClick={handleCoffeePurchase}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                >
                  <Coffee className="h-4 w-4 mr-2" />
                  Coffee Tier - $4.95 (1 analysis)
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  asChild
                >
                  <a href="/pricing">
                    <Zap className="h-4 w-4 mr-2" />
                    Growth Tier - $25/month
                  </a>
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Subscription Status */}
        {userProfile.subscriptionStatus && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Subscription</span>
                <Badge variant={userProfile.subscriptionStatus === 'active' ? 'default' : 'secondary'}>
                  {userProfile.subscriptionStatus}
                </Badge>
              </div>
              {userProfile.subscriptionStatus === 'active' && (
                <Button variant="outline" size="sm" className="w-full">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Manage Subscription
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}