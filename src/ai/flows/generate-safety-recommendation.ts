// src/ai/flows/generate-safety-recommendation.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating AI-driven safety recommendations.
 *
 * - generateSafetyRecommendation - A function that generates safety recommendations based on incident logs and inspection data.
 * - SafetyRecommendationInput - The input type for the generateSafetyRecommendation function.
 * - SafetyRecommendationOutput - The return type for the generateSafetyRecommendation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SafetyRecommendationInputSchema = z.object({
  incidentLogs: z
    .string()
    .describe('A summary of recent incident logs, including location and timestamp.'),
  inspectionData: z
    .string()
    .describe('A summary of recent inspection data, including checklists and findings.'),
  region: z
    .string()
    .describe('The region or location where the safety recommendations will be applied.'),
});

export type SafetyRecommendationInput = z.infer<typeof SafetyRecommendationInputSchema>;

const SafetyRecommendationOutputSchema = z.object({
  recommendations: z
    .string()
    .describe('A list of safety recommendations based on the incident logs, inspection data, and region.'),
});

export type SafetyRecommendationOutput = z.infer<typeof SafetyRecommendationOutputSchema>;

export async function generateSafetyRecommendation(
  input: SafetyRecommendationInput
): Promise<SafetyRecommendationOutput> {
  return generateSafetyRecommendationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'safetyRecommendationPrompt',
  input: {schema: SafetyRecommendationInputSchema},
  output: {schema: SafetyRecommendationOutputSchema},
  prompt: `You are an expert safety officer. Based on the following incident logs, inspection data, and region, provide a list of safety recommendations.

Incident Logs: {{{incidentLogs}}}
Inspection Data: {{{inspectionData}}}
Region: {{{region}}}

Recommendations:`,
});

const generateSafetyRecommendationFlow = ai.defineFlow(
  {
    name: 'generateSafetyRecommendationFlow',
    inputSchema: SafetyRecommendationInputSchema,
    outputSchema: SafetyRecommendationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
