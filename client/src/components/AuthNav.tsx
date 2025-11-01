import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { AuthModal } from '@/components/auth/AuthModal'
import { UserDashboard } from '@/components/UserDashboard'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { 
  User, 
  Coffee, 
  Crown, 
  Zap, 
  Star, 
  LogOut, 
  Settings,
  CreditCard
} from 'lucide-react'

export function AuthNav() {
  const { user, userProfile, signOut, loading } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showDashboard, setShowDashboard] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
      </div>
    )
  }

  const getTierIcon = (tier?: string) => {
    switch (tier) {
      case 'coffee':
        return <Coffee className="h-3 w-3" />
      case 'growth':
        return <Zap className="h-3 w-3" />
      case 'scale':
        return <Crown className="h-3 w-3" />
      default:
        return <Star className="h-3 w-3" />
    }
  }

  const getTierColor = (tier?: string) => {
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

  if (!user) {
    return (
      <>
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            onClick={() => {
              setAuthMode('login')
              setShowAuthModal(true)
            }}
          >
            Sign In
          </Button>
          <Button 
            onClick={() => {
              setAuthMode('signup')
              setShowAuthModal(true)
            }}
          >
            Get Started
          </Button>
        </div>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          defaultMode={authMode}
        />
      </>
    )
  }

  return (
    <>
      <div className="flex items-center space-x-3">
        {/* Tier Badge */}
        {userProfile && (
          <Badge className={`${getTierColor(userProfile.tier)} flex items-center gap-1`}>
            {getTierIcon(userProfile.tier)}
            {userProfile.tier.charAt(0).toUpperCase() + userProfile.tier.slice(1)}
          </Badge>
        )}

        {/* Credits Display for Coffee Tier */}
        {userProfile?.tier === 'coffee' && (
          <div className="flex items-center space-x-1 text-sm text-orange-600">
            <Coffee className="h-4 w-4" />
            <span className="font-medium">{userProfile.creditsRemaining}</span>
            <span className="text-gray-500">credits</span>
          </div>
        )}

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center space-x-2">
              <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
              <span className="hidden sm:inline-block">{user.email?.split('@')[0]}</span>
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div>
                <div className="font-medium">{user.email}</div>
                <div className="text-xs text-gray-500 capitalize">
                  {userProfile?.tier || 'starter'} tier
                </div>
              </div>
            </DropdownMenuLabel>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              onClick={() => setShowDashboard(true)}
              className="cursor-pointer"
            >
              <Settings className="mr-2 h-4 w-4" />
              Dashboard
            </DropdownMenuItem>

            {userProfile?.subscriptionStatus === 'active' && (
              <DropdownMenuItem className="cursor-pointer">
                <CreditCard className="mr-2 h-4 w-4" />
                Manage Billing
              </DropdownMenuItem>
            )}
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              onClick={signOut}
              className="cursor-pointer text-red-600 focus:text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Dashboard Modal */}
      <Dialog open={showDashboard} onOpenChange={setShowDashboard}>
        <DialogContent className="sm:max-w-md">
          <UserDashboard />
        </DialogContent>
      </Dialog>
    </>
  )
}