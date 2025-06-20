
'use server';
/**
 * @fileOverview A Genkit flow for generating a SHEQ legal register based on country.
 *
 * - generateLegalRegister - A function that takes a country and returns a list of relevant legal items.
 * - GenerateLegalRegisterInput - The input type for the function.
 * - GenerateLegalRegisterOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { GenerateLegalRegisterInput as GenerateLegalRegisterInputType, GenerateLegalRegisterOutput as GenerateLegalRegisterOutputType, LegalRegisterItem as LegalRegisterItemType } from '@/lib/types';


const LegalRegisterItemSchema = z.object({
    title: z.string().describe("The official title or name of the legal instrument or document."),
    type: z.enum(['Act', 'Regulation', 'Policy', 'Framework', 'Guideline', 'Code of Practice', 'Other']).describe("The type of legal instrument (e.g., Act, Regulation)."),
    summary: z.string().describe("A concise summary of the legal item's purpose and key provisions relevant to SHEQ."),
    relevanceToSheq: z.string().describe("Specific relevance of this item to Safety, Health, Environment, and/or Quality management."),
    issuingBody: z.string().optional().describe("The governmental or regulatory body that issued this item (e.g., Ministry of Labour, EPA)."),
    jurisdiction: z.string().optional().describe("The jurisdiction this item applies to (e.g., National, State/Provincial, Local)."),
    keywords: z.array(z.string()).optional().describe("A few keywords related to this legal item (e.g., 'Workplace Safety', 'Hazardous Waste', 'Machinery Guarding').")
});

const GenerateLegalRegisterInputSchema = z.object({
  country: z.string().describe('The country for which the legal register is to be generated.'),
  industry: z.string().optional().describe('Optional: The specific industry to focus on (e.g., Construction, Manufacturing, Mining). This will help tailor the results.'),
});
export type GenerateLegalRegisterInput = z.infer<typeof GenerateLegalRegisterInputSchema>;

const GenerateLegalRegisterOutputSchema = z.object({
  legalItems: z.array(LegalRegisterItemSchema).describe("A list of key legal and regulatory items relevant to SHEQ for the specified country and industry."),
  disclaimer: z.string().describe("A standard disclaimer stating that this is an AI-generated list for informational purposes and professional legal advice should be sought for compliance."),
});
export type GenerateLegalRegisterOutput = z.infer<typeof GenerateLegalRegisterOutputSchema>;


export async function generateLegalRegister(
  input: GenerateLegalRegisterInputType
): Promise<GenerateLegalRegisterOutput> {
  return generateLegalRegisterFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateLegalRegisterPrompt',
  input: {schema: GenerateLegalRegisterInputSchema},
  output: {schema: GenerateLegalRegisterOutputSchema},
  prompt: `You are an expert SHEQ (Safety, Health, Environment, Quality) legal and regulatory compliance advisor.
Your task is to generate a list of key legal instruments and documents relevant to SHEQ management for a given country and optionally, a specific industry.

Country: {{{country}}}
{{#if industry}}Industry (if specified, tailor results accordingly): {{{industry}}}{{/if}}

Please provide a list of approximately 10-15 primary legal items. For each item, include:
1.  **Title:** The official name of the Act, Regulation, Policy, Framework, etc.
2.  **Type:** Categorize it (e.g., Act, Regulation, Policy, Framework, Guideline, Code of Practice, Other).
3.  **Summary:** A brief summary (2-3 sentences) of its main purpose and key SHEQ-related provisions.
4.  **RelevanceToSheq:** Explain its specific importance or application to Safety, Health, Environment, and/or Quality.
5.  **IssuingBody (Optional):** The main government department or agency responsible (e.g., Ministry of Environment, National Standards Body).
6.  **Jurisdiction (Optional):** Specify if it's National, State/Provincial, etc., if commonly known or distinct.
7.  **Keywords (Optional):** Provide 2-3 relevant keywords.

Focus on overarching and foundational SHEQ legislation first, then potentially more specific significant items if an industry is mentioned.
Prioritize items that have broad applicability or address major SHEQ risks.

IMPORTANT: Conclude your response with a standard disclaimer in the 'disclaimer' field: "This AI-generated list is for informational purposes only and may not be exhaustive or fully up-to-date. It is not a substitute for professional legal advice. Users should consult with qualified legal professionals to ensure compliance with all applicable laws and regulations in their specific jurisdiction and context."

Structure your entire output according to the defined output schema.
`,
});

const generateLegalRegisterFlow = ai.defineFlow(
  {
    name: 'generateLegalRegisterFlow',
    inputSchema: GenerateLegalRegisterInputSchema,
    outputSchema: GenerateLegalRegisterOutputSchema,
  },
  async (input: GenerateLegalRegisterInputType) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error("AI failed to generate legal register information.");
    }
     if (!output.legalItems) {
      output.legalItems = []; // Ensure legalItems is always an array
    }
    if (!output.disclaimer) {
        output.disclaimer = "This AI-generated list is for informational purposes only and may not be exhaustive or fully up-to-date. It is not a substitute for professional legal advice. Users should consult with qualified legal professionals to ensure compliance with all applicable laws and regulations in their specific jurisdiction and context.";
    }
    return output;
  }
);

