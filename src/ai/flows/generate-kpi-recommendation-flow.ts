
'use server';
/**
 * @fileOverview A Genkit flow for generating recommendations for an underperforming KPI.
 *
 * - generateKpiRecommendation - A function that takes KPI details and returns improvement suggestions.
 * - KpiRecommendationInput - The input type for the function.
 * - KpiRecommendationOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { KpiRecommendationInput as KpiRecommendationInputType, KpiRecommendationOutput as KpiRecommendationOutputType } from '@/lib/types';

const KpiRecommendationInputSchema = z.object({
  kpiKey: z.string().describe("The unique key or code for the KPI."),
  kpiTitle: z.string().describe("The user-friendly title of the KPI."),
  currentValue: z.union([z.number(), z.string()]).describe("The current measured value of the KPI."),
  thresholdValue: z.coerce.number().describe("The target or threshold value for this KPI."),
  targetDirection: z.enum(['above', 'below']).describe("Indicates if a higher value is better ('above') or a lower value is better ('below') for this KPI."),
  kpiDefinition: z.string().describe("A brief definition explaining what the KPI measures."),
  kpiRelevance: z.string().describe("A brief explanation of why this KPI is important for SHEQ performance."),
});

const KpiRecommendationOutputSchema = z.object({
  suggestedActions: z.array(z.string()).describe("A list of 3-5 concise, actionable recommendations to improve the KPI. Each recommendation should be a separate string in the array."),
  reasoning: z.string().describe("A brief overall reasoning explaining why these actions are suggested for this specific KPI and its current performance."),
});

export async function generateKpiRecommendation(
  input: KpiRecommendationInputType
): Promise<KpiRecommendationOutputType> {
  return generateKpiRecommendationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateKpiRecommendationPrompt',
  input: {schema: KpiRecommendationInputSchema},
  output: {schema: KpiRecommendationOutputSchema},
  prompt: `You are an expert SHEQ (Safety, Health, Environment, Quality) performance improvement consultant.
A Key Performance Indicator (KPI) is underperforming and needs actionable recommendations.

KPI Details:
- Title: {{{kpiTitle}}} (Key: {{{kpiKey}}})
- Current Value: {{{currentValue}}}
- Target Threshold: {{{thresholdValue}}}
- Desired Performance: Values {{{targetDirection}}} the threshold are better.
- Definition: {{{kpiDefinition}}}
- Relevance: {{{kpiRelevance}}}

Based on this information, please provide:
1.  **Suggested Actions:** A list of 3-5 specific, actionable recommendations to improve this KPI. Focus on practical steps the organization can take.
2.  **Reasoning:** A brief explanation (2-3 sentences) outlining why these recommendations are suitable for addressing the underperformance of this particular KPI, considering its definition and current value against the target.

Structure your output strictly according to the defined schema: an array of strings for 'suggestedActions' and a single string for 'reasoning'.
Be concise and professional.
`,
});

const generateKpiRecommendationFlow = ai.defineFlow(
  {
    name: 'generateKpiRecommendationFlow',
    inputSchema: KpiRecommendationInputSchema,
    outputSchema: KpiRecommendationOutputSchema,
  },
  async (input: KpiRecommendationInputType) => {
    const {output} = await prompt(input);
    if (!output) {
        throw new Error("AI failed to generate recommendations for the KPI.");
    }
    // Ensure suggestedActions is always an array, even if AI returns a single string by mistake (though schema should prevent this)
    if (output.suggestedActions && !Array.isArray(output.suggestedActions)) {
        output.suggestedActions = [String(output.suggestedActions)];
    }
    return output;
  }
);
