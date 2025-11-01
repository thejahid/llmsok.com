import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Brain } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthNav } from "@/components/AuthNav";
import UrlInput from "@/components/url-input";
import EmailCapture from "@/components/email-capture";
import ContentAnalysis from "@/components/content-analysis";
import ContentReview from "@/components/content-review";
import FileGeneration from "@/components/file-generation";
import TierLimitsDisplay from "@/components/tier-limits-display";
import UsageDisplay from "@/components/usage-display";
import { DiscoveredPage } from "@shared/schema";

export default function Home() {
  const { user, userProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState<'input' | 'email' | 'limits' | 'analysis' | 'review' | 'generation'>('input');
  const [analysisId, setAnalysisId] = useState<number | null>(null);
  const [discoveredPages, setDiscoveredPages] = useState<DiscoveredPage[]>([]);
  const [websiteUrl, setWebsiteUrl] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [userTier, setUserTier] = useState<"starter" | "coffee" | "growth" | "scale">("starter");
  const [generatedFileId, setGeneratedFileId] = useState<number | null>(null);

  // Use authenticated user data if available
  const effectiveEmail = user?.email || userEmail;
  const effectiveTier = userProfile?.tier || userTier;

  const handleAnalysisComplete = (id: number, pages: DiscoveredPage[]) => {
    setAnalysisId(id);
    setDiscoveredPages(pages);
    setCurrentStep('review');
  };

  const handleFileGenerated = (fileId: number) => {
    setGeneratedFileId(fileId);
    setCurrentStep('generation');
  };

  const resetWorkflow = () => {
    setCurrentStep('input');
    setAnalysisId(null);
    setDiscoveredPages([]);
    setWebsiteUrl("");
    setUserEmail("");
    setUserTier("starter");
    setGeneratedFileId(null);
  };

  const handleViewAnalysisDetails = () => {
    setCurrentStep('review');
  };

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
                <p className="text-sm text-ai-silver">Expert-Crafted AI Content Accessibility</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <AuthNav />
              <div className="text-right hidden md:block">
                <p className="text-sm text-ai-silver">Created by AI Search Mastery</p>
                <p className="text-xs text-ai-silver">MASTERY-AI Framework Developer</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h2 className="text-4xl font-bold text-framework-black mb-4">
            Transform Your Website's AI Accessibility
          </h2>
          <p className="text-lg text-ai-silver mb-6 max-w-2xl mx-auto">
            Apply the systematic precision of the MASTERY-AI Framework to create professional-grade 
            LLM.txt files that optimize your content for AI systems.
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-ai-silver">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-innovation-teal rounded-full"></div>
              <span>Specification Compliant</span>
            </div>
            <span className="text-slate-300">•</span>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-innovation-teal rounded-full"></div>
              <span>Expert Methodology</span>
            </div>
            <span className="text-slate-300">•</span>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-innovation-teal rounded-full"></div>
              <span>Quality Assured</span>
            </div>
          </div>
        </section>

        {/* Progressive Steps */}
        <div className="space-y-8">
          {/* Usage Display for logged in users */}
          {effectiveEmail && (
            <UsageDisplay userEmail={effectiveEmail} />
          )}
          
          {/* Step 1: URL Input */}
          <UrlInput
            onAnalysisStart={(url) => {
              setWebsiteUrl(url);
              // Skip email capture if user is authenticated
              if (user) {
                setCurrentStep('limits');
              } else {
                setCurrentStep('email');
              }
            }}
            isVisible={currentStep === 'input'}
          />

          {/* Step 2: Email Capture (only for non-authenticated users) */}
          {currentStep === 'email' && !user && (
            <EmailCapture
              websiteUrl={websiteUrl}
              onEmailCaptured={(email, tier) => {
                setUserEmail(email);
                setUserTier(tier);
                setCurrentStep('limits');
              }}
              isVisible={currentStep === 'email'}
            />
          )}

          {/* Step 3: Tier Limits Check */}
          {currentStep === 'limits' && (
            <TierLimitsDisplay
              url={websiteUrl}
              email={effectiveEmail}
              onProceed={() => setCurrentStep('analysis')}
              isVisible={currentStep === 'limits'}
            />
          )}

          {/* Step 4: Content Analysis */}
          {currentStep === 'analysis' && (
            <ContentAnalysis
              websiteUrl={websiteUrl}
              userEmail={effectiveEmail}
              onAnalysisComplete={handleAnalysisComplete}
              useAI={effectiveTier !== 'starter'}
            />
          )}

          {/* Step 5: Content Review */}
          {currentStep === 'review' && analysisId && (
            <ContentReview
              analysisId={analysisId}
              discoveredPages={discoveredPages}
              onFileGenerated={handleFileGenerated}
            />
          )}

          {/* Step 6: File Generation */}
          {currentStep === 'generation' && generatedFileId && (
            <FileGeneration
              fileId={generatedFileId}
              analysisId={analysisId || undefined}
              onStartOver={resetWorkflow}
              onViewAnalysis={handleViewAnalysisDetails}
            />
          )}
        </div>

        {/* Implementation Guide */}
        <section className="mt-16">
          <Card className="bg-slate-50 border-slate-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-framework-black mb-4">
                Implementation Guide
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-framework-black mb-2">Installation</h4>
                  <ol className="text-sm text-ai-silver space-y-1">
                    <li>1. Download the generated llms.txt file</li>
                    <li>2. Upload to your website's root directory</li>
                    <li>3. Ensure the file is accessible at yourdomain.com/llms.txt</li>
                    <li>4. Test accessibility and validate format</li>
                  </ol>
                </div>
                <div>
                  <h4 className="font-medium text-framework-black mb-2">Best Practices</h4>
                  <ul className="text-sm text-ai-silver space-y-1">
                    <li>• Update regularly when adding new content</li>
                    <li>• Keep descriptions concise and accurate</li>
                    <li>• Include only high-quality, relevant pages</li>
                    <li>• Monitor AI system crawling behavior</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-framework-black text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h5 className="font-semibold mb-4">LLM.txt Mastery</h5>
              <p className="text-sm text-slate-300">
                Expert-crafted AI content accessibility tools built by the creator of the MASTERY-AI Framework.
              </p>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Resources</h5>
              <ul className="text-sm text-slate-300 space-y-2">
                <li><a href="#" className="hover:text-innovation-teal transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-innovation-teal transition-colors">Best Practices</a></li>
                <li><a href="#" className="hover:text-innovation-teal transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-innovation-teal transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">AI Search Mastery</h5>
              <ul className="text-sm text-slate-300 space-y-2">
                <li><a href="#" className="hover:text-innovation-teal transition-colors">Main Website</a></li>
                <li><a href="#" className="hover:text-innovation-teal transition-colors">MASTERY-AI Framework</a></li>
                <li><a href="#" className="hover:text-innovation-teal transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-innovation-teal transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700 mt-8 pt-8 text-center text-sm text-slate-400">
            <p>&copy; 2024 AI Search Mastery. All rights reserved. Built with systematic precision.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
