import { ReactNode } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { AuthModal } from "./AuthModal"

interface ProtectedRouteProps {
  children: ReactNode
  fallback?: ReactNode
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Please sign in to continue</h2>
          <AuthModal isOpen={true} onClose={() => {}} defaultMode="login" />
        </div>
      </div>
    )
  }

  return <>{children}</>
}