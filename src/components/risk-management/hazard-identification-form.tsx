
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Lightbulb, Loader2 } from "lucide-react";
import { identifyHazards, type IdentifyHazardsInput, type IdentifyHazardsOutput } from "@/ai/flows/identify-hazards-flow";
import { useToast } from "@/hooks/use-toast";

interface HazardIdentificationFormProps {
  onSuggestionsGenerated: (suggestions: string) => void;
}

export function HazardIdentificationForm({ onSuggestionsGenerated }: HazardIdentificationFormProps) {
    const [activityDescription, setActivityDescription] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [generatedSuggestions, setGeneratedSuggestions] = useState<string | null>(null);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activityDescription.trim()) {
            toast({ title: "Input Required", description: "Please describe the activity or area.", variant: "destructive" });
            return;
        }
        setIsLoading(true);
        setGeneratedSuggestions(null); 
        onSuggestionsGenerated(""); // Clear previous suggestions in parent

        try {
            const input: IdentifyHazardsInput = { activityDescription };
            const result: IdentifyHazardsOutput = await identifyHazards(input);
            setGeneratedSuggestions(result.identifiedHazards);
            onSuggestionsGenerated(result.identifiedHazards); // Pass to parent
            toast({ title: "Suggestions Generated", description: "Review the potential hazards listed below." });
        } catch (error) {
            console.error("Failed to fetch hazard suggestions:", error);
            setGeneratedSuggestions("Failed to generate suggestions. Please try again later.");
            onSuggestionsGenerated(""); // Clear on error
            toast({ title: "Error", description: "Could not generate hazard suggestions.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="shadow-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-6 w-6 text-orange-500"/>AI-Powered Hazard Identification</CardTitle>
                <CardDescription>Describe the activity or area to identify potential hazards.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Textarea
                        placeholder="Describe the work activity or area..."
                        value={activityDescription}
                        onChange={(e) => setActivityDescription(e.target.value)}
                        rows={3}
                        disabled={isLoading}
                    />
                    <Button type="submit" disabled={isLoading} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating Suggestions...
                            </>
                        ) : (
                            <>
                                <Lightbulb className="mr-2 h-4 w-4" />
                                Get Hazard Suggestions
                            </>
                        )}
                    </Button>
                </form>
                {generatedSuggestions && (
                    <div className="mt-6">
                        <h3 className="text-md font-semibold mb-2">Potential Hazards Identified by AI:</h3>
                        <pre className="whitespace-pre-wrap text-sm text-muted-foreground p-3 bg-secondary/50 rounded-md">
                            {generatedSuggestions}
                        </pre>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
