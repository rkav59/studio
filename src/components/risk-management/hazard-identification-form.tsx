"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Lightbulb, Loader2 } from "lucide-react";

export function HazardIdentificationForm() {
    const [description, setDescription] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setSuggestions([]); // Clear previous suggestions

        try {
            // Mocking the API call with a delay and some sample hazards
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const sampleHazards = [
                "Slipping hazards due to wet floors",
                "Electrical hazards from exposed wiring",
                "Ergonomic hazards from poorly designed workstations",
                "Chemical exposure hazards from improper ventilation",
                "Fire hazards from flammable materials near heat sources"
            ];
            setSuggestions(sampleHazards);
        } catch (error) {
            console.error("Failed to fetch hazard suggestions:", error);
            setSuggestions(["Failed to generate suggestions. Please try again later."]);
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
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
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
                {suggestions.length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-sm font-semibold mb-2">Potential Hazards:</h3>
                        <ul className="list-disc list-inside text-sm text-muted-foreground">
                            {suggestions.map((hazard, index) => (
                                <li key={index}>{hazard}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
