
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Lightbulb } from "lucide-react";

export function SuggestIndicatorForm() {
  const handleSubmitSuggestion = () => {
    // For now, this is a placeholder.
    // In a real application, this would likely involve a server action or API call.
    alert("Suggestion submitted (placeholder). This feature will be implemented in a future update.");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-accent" />
          Suggest Additional Indicators
        </CardTitle>
        <CardDescription>
          Want to track other specific SHEQ indicators on your dashboard? Let us know!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Textarea 
            placeholder="e.g., Training Completion Rate (%), Waste Recycled (kg), Near Miss Reporting Frequency..." 
            rows={3}
          />
          <Button onClick={handleSubmitSuggestion}>
            Submit Suggestion
          </Button>
        </div>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">
          This is a placeholder for future enhancements. Your suggestions will help us prioritize new features.
        </p>
      </CardFooter>
    </Card>
  );
}
