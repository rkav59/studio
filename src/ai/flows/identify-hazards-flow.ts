
'use server';
/**
 * @fileOverview A Genkit flow for identifying potential hazards based on an activity description.
 *
 * - identifyHazards - A function that suggests potential hazards for a given activity.
 * - IdentifyHazardsInput - The input type for the function.
 * - IdentifyHazardsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IdentifyHazardsInputSchema = z.object({
  activityDescription: z
    .string()
    .describe('A detailed description of the activity or process for which hazards need to be identified.'),
});
export type IdentifyHazardsInput = z.infer<typeof IdentifyHazardsInputSchema>;

const IdentifyHazardsOutputSchema = z.object({
  identifiedHazards: z
    .string()
    .describe('A list of potential hazards associated with the described activity. Each hazard should be clearly described. Present as a multi-line string or comma-separated list.'),
});
export type IdentifyHazardsOutput = z.infer<typeof IdentifyHazardsOutputSchema>;

export async function identifyHazards(
  input: IdentifyHazardsInput
): Promise<IdentifyHazardsOutput> {
  return identifyHazardsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'identifyHazardsPrompt',
  input: {schema: IdentifyHazardsInputSchema},
  output: {schema: IdentifyHazardsOutputSchema},
  prompt: `You are an expert SHEQ (Safety, Health, Environment, Quality) consultant specializing in hazard identification.
A user is trying to identify hazards for a specific activity.

User Input:
Activity/Process Description: {{{activityDescription}}}

Your Task:
Based on the user's input, provide a list of potential hazards.
- Be specific and consider various types of hazards (e.g., physical, chemical, biological, ergonomic, psychosocial).
- List the hazards clearly. Aim for a list format (e.g., each hazard on a new line, or a comma-separated list).

Structure your output according to the defined output schema, focusing on the 'identifiedHazards' field.
`,
});

const identifyHazardsFlow = ai.defineFlow(
  {
    name: 'identifyHazardsFlow',
    inputSchema: IdentifyHazardsInputSchema,
    outputSchema: IdentifyHazardsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
