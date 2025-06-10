
"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileText } from "lucide-react";

export function GenerateReportButton() {
  const { toast } = useToast();

  const handleGenerateReportClick = () => {
    toast({
      title: "Feature Coming Soon",
      description: "Comprehensive SHE report generation will be available in a future update.",
      duration: 3000,
    });
  };

  return (
    <Button onClick={handleGenerateReportClick}>
      <FileText className="mr-2 h-4 w-4" />
      Generate SHE Report
    </Button>
  );
}
