
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
  preferredMethod: z
    .string()
    .optional()
    .describe('User-preferred risk assessment method. The AI should consider this but still recommend the most suitable method overall.'),
});
export type RiskAssessmentSuggestionInput = z.infer<typeof RiskAssessmentSuggestionInputSchema>;

const RiskAssessmentSuggestionOutputSchema = z.object({
  potentialRisks: z
    .string()
    .describe('A detailed list of potential risks associated with the described activity and hazards. Each risk should be clearly explained and listed on a new line.'),
  recommendedControls: z.object({
    elimination: z.array(z.string()).optional().describe("Specific control measures for Elimination, if any. Each measure as a string."),
    substitution: z.array(z.string()).optional().describe("Specific control measures for Substitution, if any. Each measure as a string."),
    engineering: z.array(z.string()).optional().describe("Specific control measures for Engineering Controls, if any. Each measure as a string."),
    administrative: z.array(z.string()).optional().describe("Specific control measures for Administrative Controls, if any. Each measure as a string."),
    ppe: z.array(z.string()).optional().describe("Specific control measures for Personal Protective Equipment (PPE), if any. Each measure as a string.")
  }).describe("Recommended control measures categorized by the hierarchy of controls. Provide lists of specific, actionable control measures for each applicable category. If a category has no specific measures, the list can be empty or the key omitted."),
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
{{#if preferredMethod}}User's Preferred Method: {{{preferredMethod}}}{{/if}}

Your Task:
Based on the user's input, provide the following:
1.  **Potential Risks Identified:** Elaborate on the potential risks that could arise from the described activity and identified hazards. Be specific and consider various consequences (e.g., injury, illness, environmental damage, property damage). List each distinct risk on a new line.
2.  **Recommended Control Measures (Categorized):** Suggest a comprehensive list of control measures. You MUST categorize these measures according to the hierarchy of controls:
    *   'elimination': List specific elimination controls here.
    *   'substitution': List specific substitution controls here.
    *   'engineering': List specific engineering controls here.
    *   'administrative': List specific administrative controls here.
    *   'ppe': List specific Personal Protective Equipment (PPE) controls here.
    For each category, provide a list of concrete, actionable control measure strings. If a category has no suitable measures, provide an empty list for that category or omit the key.
3.  **Suggested Risk Assessment Method:** Recommend ONE most suitable risk assessment methodology from the following list: ${methodNamesForPrompt.join(', ')}.
    {{#if preferredMethod}}
    The user has indicated a preference for '{{{preferredMethod}}}'. If '{{{preferredMethod}}}' is indeed suitable for this scenario, please select it. Otherwise, select the method you deem most appropriate from the list and briefly explain why it's a better fit than the user's preference if you choose a different one (this explanation is for your reasoning, do not include it in the 'suggestedMethod' field output).
    {{else}}
    Briefly state why you recommend it for this scenario if possible, but keep it concise and only include the method name in the 'suggestedMethod' field.
    {{/if}}

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

    // Ensure all control categories are at least empty arrays if not provided by LLM
    if (output && output.recommendedControls) {
        output.recommendedControls.elimination = output.recommendedControls.elimination || [];
        output.recommendedControls.substitution = output.recommendedControls.substitution || [];
        output.recommendedControls.engineering = output.recommendedControls.engineering || [];
        output.recommendedControls.administrative = output.recommendedControls.administrative || [];
        output.recommendedControls.ppe = output.recommendedControls.ppe || [];
    } else if (output) {
        output.recommendedControls = {
            elimination: [],
            substitution: [],
            engineering: [],
            administrative: [],
            ppe: []
        };
    }

    return output!;
  }
);

