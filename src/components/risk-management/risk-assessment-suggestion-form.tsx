"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ShieldQuestion, Lightbulb, Loader2 } from "lucide-react";

export function RiskAssessmentSuggestionForm() {
    const [description, setDescription] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setSuggestions([]); // Clear previous suggestions

        try {
            // Mocking the API call with a delay and some sample suggestions
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const sampleSuggestions = [
                "Conduct a Job Safety Analysis (JSA) to break down the activity into steps and identify hazards for each step.",
                "Ensure proper ventilation to minimize exposure to chemical hazards.",
                "Implement regular equipment maintenance to prevent mechanical failures.",
                "Provide adequate training for employees on safe work procedures.",
                "Use appropriate Personal Protective Equipment (PPE) for the task."
            ];
            setSuggestions(sampleSuggestions);
        } catch (error) {
            console.error("Failed to fetch risk assessment suggestions:", error);
            setSuggestions(["Failed to generate suggestions. Please try again later."]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="shadow-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><ShieldQuestion className="h-6 w-6 text-blue-500"/>AI-Powered Risk Assessment Suggestions</CardTitle>
                <CardDescription>Describe the identified hazard to get risk assessment suggestions.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Textarea
                        placeholder="Describe the identified hazard..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        disabled={isLoading}
                    />
                    <Button type="submit" disabled={isLoading} className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating Suggestions...
                            </>
                        ) : (
                            <>
                                <Lightbulb className="mr-2 h-4 w-4" />
                                Get Risk Assessment Suggestions
                            </>
                        )}
                    </Button>
                </form>
                {suggestions.length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-sm font-semibold mb-2">Suggested Actions:</h3>
                        <ul className="list-disc list-inside text-sm text-muted-foreground">
                            {suggestions.map((suggestion, index) => (
                                <li key={index}>{suggestion}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
