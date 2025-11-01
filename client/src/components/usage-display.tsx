import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Zap, TrendingUp, DollarSign, Clock, Coffee } from "lucide-react";

interface UsageDisplayProps {
  userEmail: string;
}

export default function UsageDisplay({ userEmail }: UsageDisplayProps) {
  const { data: usageData } = useQuery({
    queryKey: ["/api/usage", userEmail],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/usage/${encodeURIComponent(userEmail)}`);
      return response.json();
    },
    enabled: !!userEmail,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (!usageData) return null;

  const analysisPercentage = (usageData.usage.analysesToday / usageData.limits.dailyAnalyses) * 100;
  const costSaved = usageData.usage.costToday ? (usageData.usage.cacheHitsToday * 0.03 * 0.7).toFixed(2) : "0.00";
  const isCoffeeTier = usageData.tier === 'coffee';
  const creditsRemaining = usageData.usage.creditsRemaining || 0;

  return (
    <Card className="bg-slate-50 border-slate-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-framework-black">
            {isCoffeeTier ? 'Coffee Credits' : 'Your Usage Today'}
          </h4>
          <span className={`text-xs px-2 py-1 rounded ${
            isCoffeeTier 
              ? 'bg-orange-600 text-white' 
              : 'bg-mastery-blue text-white'
          }`}>
            {usageData.tier.toUpperCase()}
          </span>
        </div>
        
        <div className="space-y-3">
          {/* Credits for Coffee Tier or Daily Analyses for Others */}
          {isCoffeeTier ? (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-ai-silver">Analysis Credits</span>
                <span className="text-framework-black font-medium">
                  {creditsRemaining} remaining
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Coffee className="w-4 h-4 text-orange-600" />
                <div className="flex-1 bg-orange-100 rounded-full h-2">
                  <div 
                    className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: creditsRemaining > 0 ? '100%' : '0%' }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-ai-silver">Daily Analyses</span>
                <span className="text-framework-black font-medium">
                  {usageData.usage.analysesToday} / {usageData.limits.dailyAnalyses}
                </span>
              </div>
              <Progress value={analysisPercentage} className="h-1.5" />
            </div>
          )}

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-innovation-teal" />
              <div>
                <p className="text-xs text-ai-silver">Cache Hits</p>
                <p className="text-sm font-semibold text-framework-black">
                  {usageData.usage.cacheHitsToday}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-xs text-ai-silver">Saved Today</p>
                <p className="text-sm font-semibold text-framework-black">
                  ${costSaved}
                </p>
              </div>
            </div>
          </div>

          {/* Tier Features */}
          <div className="pt-2 border-t border-slate-200">
            <p className="text-xs text-ai-silver mb-1">Your tier includes:</p>
            <div className="space-y-1">
              <p className="text-xs text-framework-black">
                • Max {usageData.limits.maxPagesPerAnalysis} pages per analysis
              </p>
              {usageData.limits.aiPagesLimit > 0 && (
                <p className="text-xs text-framework-black">
                  • AI analysis for first {usageData.limits.aiPagesLimit} pages
                </p>
              )}
              {usageData.features.smartCaching && (
                <p className="text-xs text-framework-black">
                  • Smart caching with change detection
                </p>
              )}
            </div>
          </div>

          {/* Upgrade Prompts */}
          {usageData.tier === 'starter' && analysisPercentage >= 80 && (
            <div className="pt-2 border-t border-slate-200">
              <p className="text-xs text-ai-silver mb-2">
                Running low on analyses? 
              </p>
              <div className="flex space-x-2">
                <a href="/pricing" className="text-xs bg-orange-600 text-white px-2 py-1 rounded hover:bg-orange-700 transition-colors">
                  Try Coffee ($4.95)
                </a>
                <a href="/pricing" className="text-xs text-mastery-blue hover:underline">
                  View all plans
                </a>
              </div>
            </div>
          )}
          
          {isCoffeeTier && creditsRemaining === 0 && (
            <div className="pt-2 border-t border-slate-200">
              <p className="text-xs text-ai-silver mb-2">
                Out of credits? Get more premium analyses:
              </p>
              <div className="flex space-x-2">
                <a href="/pricing" className="text-xs bg-orange-600 text-white px-2 py-1 rounded hover:bg-orange-700 transition-colors">
                  Buy More ($4.95)
                </a>
                <a href="/pricing" className="text-xs text-mastery-blue hover:underline">
                  Unlimited plans
                </a>
              </div>
            </div>
          )}
          
          {usageData.tier === 'growth' && analysisPercentage >= 80 && (
            <div className="pt-2 border-t border-slate-200">
              <p className="text-xs text-ai-silver">
                Need more AI pages? 
                <a href="/pricing" className="text-mastery-blue ml-1 hover:underline">
                  Upgrade to Scale
                </a>
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}