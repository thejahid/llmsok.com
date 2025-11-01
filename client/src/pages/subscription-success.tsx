import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function SubscriptionSuccess() {
  const [searchParams] = useSearchParams();
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Refresh user data to get updated tier
    if (user && refreshUser) {
      refreshUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user, refreshUser]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          {loading ? (
            <>
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-500" />
              <h1 className="text-xl font-semibold mb-2">Processing your subscription...</h1>
              <p className="text-slate-600">Please wait while we set up your account.</p>
            </>
          ) : (
            <>
              <CheckCircle className="h-16 w-16 mx-auto mb-6 text-green-500" />
              <h1 className="text-2xl font-bold text-green-800 mb-2">
                Welcome to your new plan!
              </h1>
              <p className="text-slate-600 mb-6">
                Your subscription has been activated successfully. You now have access to all the features of your new tier.
              </p>
              
              {sessionId && (
                <div className="bg-slate-100 rounded-lg p-4 mb-6">
                  <p className="text-sm text-slate-600">
                    Session ID: <span className="font-mono text-xs">{sessionId}</span>
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <Link to="/dashboard">
                  <Button className="w-full">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Go to Dashboard
                  </Button>
                </Link>
                
                <Link to="/">
                  <Button variant="outline" className="w-full">
                    Start Analysis
                  </Button>
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}