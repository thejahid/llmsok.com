import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SubscriptionCancel() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <XCircle className="h-16 w-16 mx-auto mb-6 text-orange-500" />
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            Subscription Cancelled
          </h1>
          <p className="text-slate-600 mb-6">
            No worries! Your subscription setup was cancelled and no payment was processed. 
            You can try again anytime or continue using our free tier.
          </p>
          
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Still interested?</strong> We're here to help! Contact our support team if you have any questions about our plans.
            </p>
          </div>

          <div className="space-y-3">
            <Link to="/">
              <Button className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Continue with Free Plan
              </Button>
            </Link>
            
            <Link to="/pricing">
              <Button variant="outline" className="w-full">
                View Plans Again
              </Button>
            </Link>
            
            <Button variant="ghost" className="w-full text-sm">
              <MessageCircle className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}