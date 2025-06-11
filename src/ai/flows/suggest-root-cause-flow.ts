
'use server';
/**
 * @fileOverview A Genkit flow for suggesting potential root causes for an incident.
 *
 * - suggestRootCause - A function that takes incident details and investigation findings to suggest root causes.
 * - SuggestRootCauseInput - The input type for the function.
 * - SuggestRootCauseOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { SuggestRootCauseInput as SuggestRootCauseInputType, SuggestRootCauseOutput as SuggestRootCauseOutputType } from '@/lib/types';


const SuggestRootCauseInputSchema = z.object({
  incidentDescription: z
    .string()
    .describe('A description of the incident that occurred. This could be the investigation title or a brief summary of the event.'),
  summaryOfFindings: z
    .string()
    .describe('The summary of findings from the investigation so far. This provides context to the AI.'),
});
export type SuggestRootCauseInput = z.infer<typeof SuggestRootCauseInputSchema>;

const SuggestRootCauseOutputSchema = z.object({
  suggestedRootCauses: z
    .string()
    .describe('A list of potential root causes suggested by the AI, based on the provided information. Each distinct suggestion should ideally be on a new line or clearly separated.'),
});
export type SuggestRootCauseOutput = z.infer<typeof SuggestRootCauseOutputSchema>;

export async function suggestRootCause(
  input: SuggestRootCauseInputType
): Promise<SuggestRootCauseOutputType> {
  return suggestRootCauseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestRootCausePrompt',
  input: {schema: SuggestRootCauseInputSchema},
  output: {schema: SuggestRootCauseOutputSchema},
  prompt: `You are an expert incident investigator specializing in root cause analysis.
A user is conducting an investigation and needs help brainstorming potential root causes.

Incident Description / Title:
{{{incidentDescription}}}

Summary of Investigation Findings So Far:
{{{summaryOfFindings}}}

Your Task:
Based on the incident description and the summary of findings provided, suggest a list of potential root causes.
Consider various categories of causes, such as:
- People factors (e.g., lack of training, fatigue, human error, miscommunication)
- Process factors (e.g., inadequate procedures, poor planning, insufficient supervision)
- Equipment factors (e.g., mechanical failure, poor design, lack of maintenance)
- Environment factors (e.g., weather, lighting, workspace conditions)
- Management system factors (e.g., inadequate risk assessment, poor safety culture, resource allocation)

Provide a list of plausible root causes. Each distinct suggestion should be concise and clearly stated, ideally on a new line.
Focus on identifying the fundamental, underlying reasons why the incident occurred, not just the immediate causes or symptoms.
For example, if an immediate cause was "operator error", a root cause might be "inadequate training program for operators" or "complex user interface leading to frequent errors".

Output your suggestions in the 'suggestedRootCauses' field.
`,
});

const suggestRootCauseFlow = ai.defineFlow(
  {
    name: 'suggestRootCauseFlow',
    inputSchema: SuggestRootCauseInputSchema,
    outputSchema: SuggestRootCauseOutputSchema,
  },
  async (input: SuggestRootCauseInputType) => {
    const {output} = await prompt(input);
    return output!;
  }
);
