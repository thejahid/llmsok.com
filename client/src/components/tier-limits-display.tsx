import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface TierLimitsDisplayProps {
  url: string;
  email: string;
  onProceed: () => void;
  isVisible: boolean;
}

export default function TierLimitsDisplay({ url, email, onProceed, isVisible }: TierLimitsDisplayProps) {
  const [limitsData, setLimitsData] = useState<any>(null);

  const checkLimitsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/check-limits", { email, url });
      return response.json();
    },
    onSuccess: (data) => {
      setLimitsData(data);
      if (data.allowed) {
        // Auto-proceed after 2 seconds if allowed
        setTimeout(() => {
          onProceed();
        }, 2000);
      }
    },
  });

  useEffect(() => {
    if (isVisible && url && email) {
      checkLimitsMutation.mutate();
    }
  }, [isVisible, url, email]);

  if (!isVisible || !limitsData) return null;

  const { allowed, reason, pageCount, tier, limits, currentUsage, estimatedCost, suggestedUpgrade } = limitsData;

  return (
    <Alert className={allowed ? "border-green-200" : "border-red-200"}>
      <div className="flex items-start space-x-3">
        {allowed ? (
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
        ) : (
          <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
        )}
        <div className="flex-1">
          <AlertTitle className={allowed ? "text-green-900" : "text-red-900"}>
            {allowed ? "Analysis Ready" : "Limit Reached"}
          </AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            {allowed ? (
              <>
                <p>Found {pageCount} pages to analyze.</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-ai-silver">Your tier:</span>
                    <span className="ml-1 font-medium">{tier.toUpperCase()}</span>
                  </div>
                  <div>
                    <span className="text-ai-silver">Pages to analyze:</span>
                    <span className="ml-1 font-medium">{Math.min(pageCount, limits.maxPagesPerAnalysis)}</span>
                  </div>
                  <div>
                    <span className="text-ai-silver">Analyses today:</span>
                    <span className="ml-1 font-medium">{currentUsage.analysesToday} / {limits.dailyAnalyses}</span>
                  </div>
                  <div>
                    <span className="text-ai-silver">Est. cost:</span>
                    <span className="ml-1 font-medium">${estimatedCost.toFixed(3)}</span>
                  </div>
                </div>
                <p className="text-sm text-green-700 pt-1">
                  Starting analysis in 2 seconds...
                </p>
              </>
            ) : (
              <>
                <p>{reason}</p>
                <div className="text-sm space-y-1">
                  <p>
                    <span className="text-ai-silver">Current usage:</span>
                    <span className="ml-1">{currentUsage.analysesToday} analyses today</span>
                  </p>
                  <p>
                    <span className="text-ai-silver">Your limit:</span>
                    <span className="ml-1">{limits.dailyAnalyses} analyses per day</span>
                  </p>
                </div>
                {suggestedUpgrade && (
                  <div className="pt-2">
                    <Button size="sm" variant="outline" className="text-mastery-blue border-mastery-blue">
                      Upgrade to {suggestedUpgrade.toUpperCase()}
                    </Button>
                  </div>
                )}
              </>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}