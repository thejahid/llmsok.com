import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Mail, ArrowRight, Check, Zap, Crown } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { emailCaptureSchema } from "@shared/schema";
import { z } from "zod";

interface EmailCaptureProps {
  websiteUrl: string;
  onEmailCaptured: (email: string, tier: "starter" | "coffee" | "growth" | "scale") => void;
  isVisible: boolean;
}

type FormData = z.infer<typeof emailCaptureSchema>;

export default function EmailCapture({ websiteUrl, onEmailCaptured, isVisible }: EmailCaptureProps) {
  const { toast } = useToast();
  const [selectedTier, setSelectedTier] = useState<"starter" | "coffee" | "growth" | "scale">("starter");

  const form = useForm<FormData>({
    resolver: zodResolver(emailCaptureSchema),
    defaultValues: {
      email: "",
      websiteUrl: websiteUrl,
      tier: "starter",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      await apiRequest("POST", "/api/email-capture", data);
    },
    onSuccess: () => {
      toast({
        title: "Email captured successfully",
        description: `Starting ${selectedTier} analysis for ${websiteUrl}`,
      });
      onEmailCaptured(form.getValues("email"), selectedTier);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to capture email",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate({ ...data, tier: selectedTier });
  };

  if (!isVisible) return null;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center space-x-2">
          <Mail className="text-mastery-blue" />
          <span>Choose Your Analysis Type</span>
        </CardTitle>
        <p className="text-sm text-ai-silver">
          Get instant access to your LLM.txt analysis for <strong>{websiteUrl}</strong>
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tier Selection */}
        <div className="space-y-4">
          <RadioGroup 
            value={selectedTier} 
            onValueChange={(value: any) => setSelectedTier(value)}
            className="space-y-3"
          >
            {/* Starter Tier */}
            <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-slate-50 transition-colors">
              <RadioGroupItem value="starter" id="starter" />
              <div className="flex-1">
                <Label htmlFor="starter" className="flex items-center space-x-2 cursor-pointer">
                  <Check className="text-green-600 w-4 h-4" />
                  <span className="font-medium">Starter (Free)</span>
                </Label>
                <p className="text-sm text-ai-silver mt-1">
                  1 analysis/day • 50 pages max • HTML extraction • Basic categorization
                </p>
              </div>
            </div>

            {/* Coffee Tier */}
            <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-slate-50 transition-colors border-orange-200 bg-orange-50">
              <RadioGroupItem value="coffee" id="coffee" />
              <div className="flex-1">
                <Label htmlFor="coffee" className="flex items-center space-x-2 cursor-pointer">
                  <span className="text-orange-600">☕</span>
                  <span className="font-medium">Coffee Analysis ($4.95)</span>
                  <span className="text-xs bg-orange-600 text-white px-2 py-1 rounded">ONE-TIME</span>
                </Label>
                <p className="text-sm text-orange-700 mt-1">
                  1 premium analysis • 200 pages • Full AI-enhanced • No subscription
                </p>
              </div>
            </div>

            {/* Growth Tier */}
            <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-slate-50 transition-colors">
              <RadioGroupItem value="growth" id="growth" />
              <div className="flex-1">
                <Label htmlFor="growth" className="flex items-center space-x-2 cursor-pointer">
                  <Zap className="text-innovation-teal w-4 h-4" />
                  <span className="font-medium">Growth ($25/mo)</span>
                  <span className="text-xs bg-innovation-teal text-white px-2 py-1 rounded">POPULAR</span>
                </Label>
                <p className="text-sm text-ai-silver mt-1">
                  Unlimited analyses • 1,000 pages • AI-enhanced (first 200) • Smart caching
                </p>
              </div>
            </div>

            {/* Scale Tier */}
            <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-slate-50 transition-colors">
              <RadioGroupItem value="scale" id="scale" />
              <div className="flex-1">
                <Label htmlFor="scale" className="flex items-center space-x-2 cursor-pointer">
                  <Crown className="text-mastery-blue w-4 h-4" />
                  <span className="font-medium">Scale ($99/mo)</span>
                  <span className="text-xs bg-mastery-blue text-white px-2 py-1 rounded">ENTERPRISE</span>
                </Label>
                <p className="text-sm text-ai-silver mt-1">
                  Unlimited everything • Full AI analysis • API access • White-label options
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Email Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input 
                      {...field}
                      type="email"
                      placeholder="your@email.com"
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between pt-4">
              <div className="text-xs text-ai-silver">
                {selectedTier === "starter" ? (
                  <span>✓ Instant access • No payment required</span>
                ) : selectedTier === "growth" ? (
                  <span>✓ Professional features • Smart caching</span>
                ) : (
                  <span>✓ Enterprise features • Priority support</span>
                )}
              </div>
              <Button 
                type="submit" 
                disabled={mutation.isPending}
                className="bg-mastery-blue hover:bg-mastery-blue/90"
              >
                {mutation.isPending ? (
                  "Processing..."
                ) : (
                  <>
                    Start Analysis
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>

        {/* Trust Indicators */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-center space-x-6 text-xs text-ai-silver">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Secure & Private</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>No Spam</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Expert Quality</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}