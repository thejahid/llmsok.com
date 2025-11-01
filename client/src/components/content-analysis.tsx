import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, Loader2 } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { DiscoveredPage, SiteAnalysisResult } from "@shared/schema";

interface ContentAnalysisProps {
  websiteUrl: string;
  userEmail: string;
  onAnalysisComplete: (analysisId: number, pages: DiscoveredPage[]) => void;
  useAI?: boolean;
}

interface AnalysisStep {
  id: string;
  label: string;
  progress: number;
}

const analysisSteps: AnalysisStep[] = [
  { id: "sitemap", label: "Discovering sitemap.xml and content structure", progress: 25 },
  { id: "content", label: "Analyzing content quality and relevance", progress: 50 },
  { id: "filtering", label: "Applying intelligent filtering rules", progress: 75 },
  { id: "descriptions", label: "Generating AI-powered descriptions", progress: 100 }
];

export default function ContentAnalysis({ websiteUrl, userEmail, onAnalysisComplete, useAI = false }: ContentAnalysisProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [analysisId, setAnalysisId] = useState<number | null>(null);

  const startAnalysisMutation = useMutation({
    mutationFn: async ({ url, force = false, email }: { url: string; force?: boolean; email: string }) => {
      // Use real sitemap analysis endpoint with email for tier-based analysis
      const response = await apiRequest("POST", "/api/analyze", { url, force, email });
      return response.json();
    },
    onSuccess: (data) => {
      setAnalysisId(data.analysisId);
      if (data.status === "completed") {
        onAnalysisComplete(data.analysisId, data.discoveredPages);
      }
    },
    onError: (error) => {
      console.error("Analysis failed:", error);
    }
  });

  const { data: analysisData, error } = useQuery<SiteAnalysisResult>({
    queryKey: ["/api/analysis", analysisId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/analysis/${analysisId}`);
      return response.json();
    },
    enabled: !!analysisId,
    refetchInterval: (query) => {
      // Stop polling when analysis is complete
      const data = query?.state?.data;
      return data?.status === "completed" || data?.status === "failed" ? false : 2000;
    },
  });

  useEffect(() => {
    if (websiteUrl && userEmail) {
      startAnalysisMutation.mutate({ url: websiteUrl, force: true, email: userEmail });
    }
  }, [websiteUrl, userEmail]);

  useEffect(() => {
    if (analysisData) {
      if (analysisData.status === "completed") {
        setProgress(100);
        setCurrentStepIndex(analysisSteps.length - 1);
        setTimeout(() => {
          onAnalysisComplete(analysisData.id, analysisData.discoveredPages);
        }, 1000);
      } else if (analysisData.status === "processing") {
        // Simulate progress through steps
        const timer = setInterval(() => {
          setCurrentStepIndex((prev) => {
            if (prev < analysisSteps.length - 1) {
              const newIndex = prev + 1;
              setProgress(analysisSteps[newIndex].progress);
              return newIndex;
            }
            return prev;
          });
        }, 2000);

        return () => clearInterval(timer);
      }
    }
  }, [analysisData, onAnalysisComplete]);

  const getStepIcon = (stepIndex: number) => {
    if (stepIndex < currentStepIndex) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (stepIndex === currentStepIndex) {
      return <Loader2 className="h-5 w-5 text-innovation-teal animate-spin" />;
    } else {
      return <Circle className="h-5 w-5 text-slate-300" />;
    }
  };

  if (error) {
    return (
      <Card className="bg-white shadow-sm border border-red-200">
        <CardContent className="p-6">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-3">
              <span className="text-white font-semibold text-sm">!</span>
            </div>
            <h3 className="text-xl font-semibold text-red-600">Analysis Failed</h3>
          </div>
          <p className="text-red-600">
            {error instanceof Error ? error.message : "Failed to analyze website"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-sm border border-slate-200">
      <CardContent className="p-6">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-innovation-teal rounded-full flex items-center justify-center mr-3">
            <span className="text-white font-semibold text-sm">2</span>
          </div>
          <h3 className="text-xl font-semibold text-framework-black">Systematic Content Analysis</h3>
        </div>

        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-ai-silver mb-2">
            <span>Analyzing content...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Analysis Steps */}
        <div className="space-y-4">
          {analysisSteps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center space-x-3 text-sm ${
                index <= currentStepIndex ? "opacity-100" : "opacity-50"
              }`}
            >
              {getStepIcon(index)}
              <span
                className={
                  index < currentStepIndex
                    ? "text-framework-black"
                    : index === currentStepIndex
                    ? "text-innovation-teal"
                    : "text-ai-silver"
                }
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {/* Analysis Results */}
        {analysisData && analysisData.status === "completed" && (
          <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="font-semibold text-framework-black mb-3">Analysis Results</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-ai-silver">Site Type:</span>
                <span className="text-framework-black font-medium">
                  {analysisData.siteType === "single-page" ? "Single-Page Site" : 
                   analysisData.siteType === "multi-page" ? "Multi-Page Site" : "Unknown"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ai-silver">Sitemap Found:</span>
                <span className="text-framework-black font-medium">
                  {analysisData.sitemapFound ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ai-silver">Analysis Method:</span>
                <span className="text-framework-black font-medium">
                  {analysisData.analysisMethod === "sitemap" ? "Sitemap Discovery" :
                   analysisData.analysisMethod === "robots.txt" ? "Robots.txt Fallback" :
                   analysisData.analysisMethod === "homepage-only" ? "Homepage Only" :
                   analysisData.analysisMethod === "fallback-crawl" ? "Basic Crawling" : "Unknown"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ai-silver">Pages Found:</span>
                <span className="text-framework-black font-medium">
                  {analysisData.totalPagesFound}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ai-silver">Pages Analyzed:</span>
                <span className="text-framework-black font-medium">
                  {analysisData.discoveredPages.length}
                </span>
              </div>
              {analysisData.discoveredPages.length < analysisData.totalPagesFound && (
                <div className="flex items-center justify-between">
                  <span className="text-ai-silver">Pages Skipped:</span>
                  <span className="text-yellow-600 font-medium">
                    {analysisData.totalPagesFound - analysisData.discoveredPages.length}
                  </span>
                </div>
              )}
              {analysisData.message && (
                <div className="pt-2 border-t border-slate-200">
                  <p className="text-ai-silver text-xs">
                    {analysisData.message}
                  </p>
                </div>
              )}
              {analysisData.metrics && (
                <div className="pt-2 border-t border-slate-200 space-y-1">
                  <p className="text-framework-black text-xs font-semibold">Performance Metrics:</p>
                  <p className="text-ai-silver text-xs">
                    • Cache hit: {analysisData.metrics.cacheHit ? 'Yes' : 'No'}
                  </p>
                  <p className="text-ai-silver text-xs">
                    • Processing time: {analysisData.metrics.processingTime}s
                  </p>
                  <p className="text-ai-silver text-xs">
                    • API calls: {analysisData.metrics.apiCalls}
                  </p>
                  <p className="text-ai-silver text-xs">
                    • Cost saved: ${analysisData.metrics.costSaved.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
