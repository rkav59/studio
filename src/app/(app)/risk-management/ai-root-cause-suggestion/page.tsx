
"use client";

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SuggestRootCauseForm } from "@/components/risk-management/suggest-root-cause-form";
import { ArrowLeft, Brain } from "lucide-react";

export default function AiRootCauseSuggestionPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push('/risk-management')} aria-label="Back to Risk Management">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Brain className="h-6 w-6 text-purple-500" /> AI Root Cause Suggestions
        </h1>
      </div>
      <SuggestRootCauseForm /> {/* Render the form directly */}
    </div>
  );
}
    