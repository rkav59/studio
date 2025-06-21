import { RecommendationGenerator } from "@/components/ai-recommendations/recommendation-generator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { Sparkles } from "lucide-react";

export default function AiRecommendationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary"/> AI Safety Assist
        </h1>
      </div>

       <Card>
        <CardHeader>
          <CardTitle>Proactive Safety Insights</CardTitle>
          <CardDescription>Leverage AI to identify potential risks and get tailored recommendations.</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">
                Our AI Safety Assist tool analyzes your incident logs and inspection data to provide actionable insights. 
                Input the required information below to receive customized safety recommendations for your specified region or site.
                This tool aims to help you proactively manage risks and enhance your safety programs.
            </p>
        </CardContent>
      </Card>

      <RecommendationGenerator />
    </div>
  );
}
