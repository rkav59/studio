
'use server';
/**
 * @fileOverview A Genkit flow for generating AI-driven risk assessment suggestions.
 *
 * - generateRiskAssessmentSuggestion - A function that suggests potential risks, controls, and assessment methods.
 * - RiskAssessmentSuggestionInput - The input type for the function.
 * - RiskAssessmentSuggestionOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { RiskAssessmentMethod } from '@/lib/types';
import { riskAssessmentMethodsList, type DescriptiveRiskAssessmentMethod } from '@/lib/risk-assessment-config';


const RiskAssessmentSuggestionInputSchema = z.object({
  activityDescription: z
    .string()
    .describe('A detailed description of the activity or process being assessed.'),
  identifiedHazards: z
    .string()
    .describe('A list or summary of already identified potential hazards related to the activity.'),
});
export type RiskAssessmentSuggestionInput = z.infer<typeof RiskAssessmentSuggestionInputSchema>;

const RiskAssessmentSuggestionOutputSchema = z.object({
  potentialRisks: z
    .string()
    .describe('A detailed list of potential risks associated with the described activity and hazards. Each risk should be clearly explained.'),
  recommendedControls: z
    .string()
    .describe('A comprehensive list of recommended control measures, categorized by the hierarchy of controls (Elimination, Substitution, Engineering, Administrative, PPE) if possible.'),
  suggestedMethod: z
    .string()
    .describe('The name of a suitable risk assessment methodology (e.g., JSA, HAZOP, FMEA, What-If). Choose from common SHEQ methodologies.')
});
export type RiskAssessmentSuggestionOutput = z.infer<typeof RiskAssessmentSuggestionOutputSchema>;

export async function generateRiskAssessmentSuggestion(
  input: RiskAssessmentSuggestionInput
): Promise<RiskAssessmentSuggestionOutput> {
  return generateRiskAssessmentSuggestionFlow(input);
}

// Extract just the names for the prompt
const methodNamesForPrompt = (riskAssessmentMethodsList as DescriptiveRiskAssessmentMethod[]).map(method => method.name);

const prompt = ai.definePrompt({
  name: 'riskAssessmentSuggestionPrompt',
  input: {schema: RiskAssessmentSuggestionInputSchema},
  output: {schema: RiskAssessmentSuggestionOutputSchema},
  prompt: `You are an expert SHEQ (Safety, Health, Environment, Quality) consultant specializing in risk assessment.
A user is performing a risk assessment and needs your expert guidance.

User Input:
Activity/Process Description: {{{activityDescription}}}
Identified Potential Hazards: {{{identifiedHazards}}}

Your Task:
Based on the user's input, provide the following:
1.  **Potential Risks Identified:** Elaborate on the potential risks that could arise from the described activity and identified hazards. Be specific and consider various consequences (e.g., injury, illness, environmental damage, property damage).
2.  **Recommended Control Measures:** Suggest a comprehensive list of control measures. Where possible, try to follow the hierarchy of controls: Elimination, Substitution, Engineering Controls, Administrative Controls, and Personal Protective Equipment (PPE). Be practical and specific.
3.  **Suggested Risk Assessment Method:** Recommend ONE most suitable risk assessment methodology from the following list: ${methodNamesForPrompt.join(', ')}. Briefly state why you recommend it for this scenario if possible, but keep it concise and only include the method name in the 'suggestedMethod' field.

Structure your output according to the defined output schema.
Provide detailed and actionable advice.
`,
});

const generateRiskAssessmentSuggestionFlow = ai.defineFlow(
  {
    name: 'generateRiskAssessmentSuggestionFlow',
    inputSchema: RiskAssessmentSuggestionInputSchema,
    outputSchema: RiskAssessmentSuggestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    
    if (output && output.suggestedMethod && !methodNamesForPrompt.includes(output.suggestedMethod as RiskAssessmentMethod)) {
        // console.warn(`LLM suggested method "${output.suggestedMethod}" not in predefined list. It will be allowed but might not have specific guidance.`);
    }

    return output!;
  }
);
