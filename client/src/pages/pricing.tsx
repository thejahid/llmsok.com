import { Brain } from 'lucide-react';
import SubscriptionManagement from '@/components/subscription-management';

export default function Pricing() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-mastery-blue rounded-lg flex items-center justify-center">
                <Brain className="text-white text-lg" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-mastery-blue">LLM.txt Mastery</h1>
                <p className="text-sm text-ai-silver">Subscription Management</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-framework-black mb-4">
            Choose Your Plan
          </h2>
          <p className="text-lg text-ai-silver max-w-2xl mx-auto">
            Unlock the full potential of AI-optimized content with our professional tiers.
          </p>
        </div>

        <SubscriptionManagement />
      </main>
    </div>
  );
}