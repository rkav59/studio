'use server';
/**
 * @fileOverview A Genkit flow for generating AI-driven mock drill scenarios.
 *
 * - generateDrillScenario - A function that suggests a drill scenario based on drill type and context.
 * - GenerateDrillScenarioInput - The input type for the function.
 * - GenerateDrillScenarioOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { MockDrill } from '@/lib/types';

// Ensure all possible drill types from MockDrill are included
const drillTypesForSchema: [MockDrill['drillType'], ...MockDrill['drillType'][]] = ['Evacuation', 'Fire', 'Medical', 'Spill', 'Security', 'Tabletop', 'Other'];


const GenerateDrillScenarioInputSchema = z.object({
  drillType: z.enum(drillTypesForSchema).describe('The type of mock drill being planned.'),
  planName: z.string().optional().describe('Optional name of a linked emergency plan for context.'),
  planType: z.string().optional().describe('Optional type of the linked emergency plan (e.g., Evacuation, Fire Response).'),
  planScope: z.string().optional().describe('Optional scope/area covered by the linked emergency plan (e.g., Entire Facility, Warehouse B).'),
  currentDrillName: z.string().optional().describe('The current name or title entered for the drill, which might contain scope information.'),
});
export type GenerateDrillScenarioInput = z.infer<typeof GenerateDrillScenarioInputSchema>;

const GenerateDrillScenarioOutputSchema = z.object({
  suggestedScenario: z
    .string()
    .describe('A detailed and realistic drill scenario suggestion. It should be a few sentences to a short paragraph, suitable for initiating a mock drill.'),
});
export type GenerateDrillScenarioOutput = z.infer<typeof GenerateDrillScenarioOutputSchema>;

export async function generateDrillScenario(
  input: GenerateDrillScenarioInput
): Promise<GenerateDrillScenarioOutput> {
  return generateDrillScenarioFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDrillScenarioPrompt',
  input: {schema: GenerateDrillScenarioInputSchema},
  output: {schema: GenerateDrillScenarioOutputSchema},
  prompt: `You are an expert in emergency preparedness and response planning.
Your task is to generate a concise, realistic, and engaging mock drill scenario.

Drill Type: {{{drillType}}}

Context (if available):
{{#if planName}}Linked Emergency Plan: "{{planName}}" (Type: {{planType}}, Scope: {{planScope}}){{/if}}
{{#if currentDrillName}}Current Drill Name/Title (may indicate scope): "{{currentDrillName}}"{{/if}}

Based on the drill type and any provided context (linked plan details or the drill's own name/title which might hint at scope), generate a scenario.
The scenario should be a short paragraph describing a plausible event that would trigger the {{{drillType}}} response.
Make it specific enough to guide the drill but not overly complex.
For example, for a 'Fire' drill, don't just say 'a fire starts'. Say 'A fire alarm is activated due to smoke detected in the staff kitchen on the 2nd floor, caused by an unattended microwave.'
If the drill type is 'Medical', describe a plausible medical emergency situation.
If 'Evacuation', and not linked to a fire, specify another reason like 'a gas leak reported in the vicinity' or 'structural concern identified'.

Output only the suggested scenario in the 'suggestedScenario' field. Be direct and ready to use.
`,
});

const generateDrillScenarioFlow = ai.defineFlow(
  {
    name: 'generateDrillScenarioFlow',
    inputSchema: GenerateDrillScenarioInputSchema,
    outputSchema: GenerateDrillScenarioOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
