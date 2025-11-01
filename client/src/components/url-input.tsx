import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, CheckCircle, Info } from "lucide-react";

interface UrlInputProps {
  onAnalysisStart: (url: string) => void;
  isVisible: boolean;
}

export default function UrlInput({ onAnalysisStart, isVisible }: UrlInputProps) {
  const [url, setUrl] = useState("");
  const [isValid, setIsValid] = useState(false);

  const validateUrl = (value: string) => {
    const urlPattern = /^https?:\/\/.+\..+/;
    const valid = urlPattern.test(value);
    setIsValid(valid);
    return valid;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUrl(value);
    validateUrl(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid && url) {
      onAnalysisStart(url);
    }
  };

  if (!isVisible) return null;

  return (
    <section>
      <Card className="bg-white shadow-sm border border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-innovation-teal rounded-full flex items-center justify-center mr-3">
              <span className="text-white font-semibold text-sm">1</span>
            </div>
            <h3 className="text-xl font-semibold text-framework-black">Enter Your Website URL</h3>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="website-url" className="text-sm font-medium text-framework-black">
                Website URL
              </Label>
              <div className="relative mt-2">
                <Input
                  id="website-url"
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={handleInputChange}
                  className="pr-12 border-slate-300 focus:ring-innovation-teal focus:border-innovation-teal"
                />
                {isValid && (
                  <div className="absolute right-3 top-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                )}
              </div>
              <p className="mt-2 text-sm text-ai-silver">
                Enter your website's main URL. We'll automatically discover and analyze your content.
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-ai-silver">
                <Info className="h-4 w-4 text-innovation-teal" />
                <span>Supports HTTP/HTTPS protocols</span>
              </div>
              <Button
                type="submit"
                disabled={!isValid}
                className="bg-innovation-teal hover:bg-innovation-teal/90 text-white"
              >
                <Search className="h-4 w-4 mr-2" />
                Analyze Website
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
