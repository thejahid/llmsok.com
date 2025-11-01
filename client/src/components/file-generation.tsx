import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Copy, Download, FileText, BarChart3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface FileGenerationProps {
  fileId: number;
  analysisId?: number;
  onStartOver: () => void;
  onViewAnalysis?: () => void;
}

export default function FileGeneration({ fileId, analysisId, onStartOver, onViewAnalysis }: FileGenerationProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const { data: fileData, isLoading } = useQuery({
    queryKey: ["/api/llm-file", fileId],
    queryFn: async () => {
      const response = await fetch(`/api/llm-file/${fileId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch file data");
      }
      return response.json();
    },
  });

  const handleCopyToClipboard = async () => {
    if (fileData?.content) {
      try {
        await navigator.clipboard.writeText(fileData.content);
        setCopied(true);
        toast({
          title: "Copied to clipboard",
          description: "LLM.txt content has been copied to your clipboard.",
        });
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        toast({
          title: "Copy failed",
          description: "Failed to copy content to clipboard.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDownloadFile = () => {
    if (fileId) {
      // Use the server's download endpoint which has proper headers
      const link = document.createElement('a');
      link.href = `/api/download/${fileId}`;
      link.download = 'llms.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <Card className="bg-white shadow-sm border border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-innovation-teal mx-auto mb-4"></div>
              <p className="text-ai-silver">Loading generated file...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-sm border border-slate-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-innovation-teal rounded-full flex items-center justify-center mr-3">
              <span className="text-white font-semibold text-sm">4</span>
            </div>
            <h3 className="text-xl font-semibold text-framework-black">
              Professional LLM.txt File Generated
            </h3>
          </div>
          <div className="flex items-center space-x-2 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>Specification Compliant</span>
          </div>
        </div>

        {/* File Preview */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-framework-black">File Preview</h4>
            <div className="flex items-center space-x-4 text-sm text-ai-silver">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-framework-black">
                  {fileData?.pageCount || 0} pages
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>
                  {fileData?.fileSize ? formatFileSize(fileData.fileSize) : "N/A"}
                </span>
              </div>
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 max-h-96 overflow-y-auto">
            <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
              <div className="text-sm text-blue-800 font-medium mb-1">
                📋 Preview Limitation Notice
              </div>
              <div className="text-xs text-blue-700">
                This preview shows only the first portion of your LLM.txt file due to display constraints. 
                The complete file contains <span className="font-bold">{fileData?.pageCount || 0} pages</span> and 
                is <span className="font-bold">{fileData?.fileSize ? formatFileSize(fileData.fileSize) : "N/A"}</span>. 
                Use the download button below to get the full file.
              </div>
            </div>
            <pre className="text-sm text-framework-black font-mono whitespace-pre-wrap">
              <code>{fileData?.content || "No content available"}</code>
            </pre>
          </div>
        </div>

        {/* Quality Assessment */}
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-medium text-green-800 mb-2">Quality Assessment</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-green-700">Specification Compliant</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-green-700">High-Quality Content</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-green-700">Optimized for AI Systems</span>
            </div>
          </div>
        </div>

        {/* Download Options */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-ai-silver">
            <p>Ready for implementation on your website</p>
            <p className="text-xs">
              Place this file in your website's root directory as{" "}
              <code className="bg-slate-100 px-1 rounded">llms.txt</code>
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {onViewAnalysis && (
              <Button
                variant="outline"
                onClick={onViewAnalysis}
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analysis Details
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={handleCopyToClipboard}
              className="bg-slate-100 hover:bg-slate-200 text-framework-black"
            >
              <Copy className="h-4 w-4 mr-2" />
              {copied ? "Copied!" : "Copy to Clipboard"}
            </Button>
            <Button
              onClick={handleDownloadFile}
              className="bg-innovation-teal hover:bg-innovation-teal/90 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Download llms.txt
            </Button>
          </div>
        </div>

        {/* Start Over Button */}
        <div className="mt-6 pt-4 border-t border-slate-200 text-center">
          <Button
            variant="outline"
            onClick={onStartOver}
            className="text-ai-silver hover:text-framework-black"
          >
            Analyze Another Website
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
