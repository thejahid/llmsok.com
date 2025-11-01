import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, ArrowRight, Coffee } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function CoffeeSuccess() {
  const [searchParams] = useSearchParams();
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Refresh user data to get updated credits
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
              <Coffee className="h-12 w-12 animate-pulse mx-auto mb-4 text-orange-500" />
              <h1 className="text-xl font-semibold mb-2">Brewing your analysis credits...</h1>
              <p className="text-slate-600">Please wait while we set up your coffee analysis.</p>
            </>
          ) : (
            <>
              <div className="relative">
                <CheckCircle className="h-16 w-16 mx-auto mb-6 text-green-500" />
                <Coffee className="h-8 w-8 absolute -top-2 -right-2 text-orange-500" />
              </div>
              <h1 className="text-2xl font-bold text-green-800 mb-2">
                ☕ Coffee Analysis Ready!
              </h1>
              <p className="text-slate-600 mb-6">
                Your $4.95 purchase was successful! You now have <strong>1 analysis credit</strong> for premium website analysis with AI enhancement.
              </p>
              
              <div className="bg-orange-50 rounded-lg p-4 mb-6 border border-orange-200">
                <h3 className="font-semibold text-orange-800 mb-2">What you get:</h3>
                <ul className="text-sm text-orange-700 space-y-1 text-left">
                  <li>• Up to 200 pages per analysis (10x free tier)</li>
                  <li>• Full AI-enhanced quality scoring</li>
                  <li>• Professional LLM.txt file generation</li>
                  <li>• Credits never expire</li>
                </ul>
              </div>

              {sessionId && (
                <div className="bg-slate-100 rounded-lg p-4 mb-6">
                  <p className="text-sm text-slate-600">
                    Purchase ID: <span className="font-mono text-xs">{sessionId}</span>
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <Link to="/">
                  <Button className="w-full bg-orange-600 hover:bg-orange-700">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Start Your Analysis
                  </Button>
                </Link>
                
                <Link to="/pricing">
                  <Button variant="outline" className="w-full">
                    View All Plans
                  </Button>
                </Link>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>💡 Pro tip:</strong> Your credit will be automatically used for your next analysis. 
                  Enjoy the enhanced AI features!
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}