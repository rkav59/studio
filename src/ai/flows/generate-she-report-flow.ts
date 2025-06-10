'use server';
/**
 * @fileOverview A Genkit flow for generating a SHE (Safety, Health, Environment) report summary.
 *
 * - generateSheReport - A function that synthesizes provided summaries into a SHE report.
 * - SheReportInput - The input type for the generateSheReport function.
 * - SheReportOutput - The return type for the generateSheReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SheReportInputSchema = z.object({
  incidentSummary: z
    .string()
    .describe('A summary of key incident statistics, trends, and significant events.'),
  inspectionSummary: z
    .string()
    .describe('A summary of inspection activities, common findings, and overdue actions.'),
  riskAssessmentSummary: z
    .string()
    .describe('A summary of key risk assessments conducted, significant risks identified, and control measure effectiveness.'),
  safetyInitiativesSummary: z
    .string()
    .optional()
    .describe('A summary of ongoing or recently completed safety initiatives, campaigns, or training programs.'),
  reportingPeriod: z
    .string()
    .describe('The period for which the report is being generated (e.g., "Q3 2024", "July 2024").'),
});
export type SheReportInput = z.infer<typeof SheReportInputSchema>;

const SheReportOutputSchema = z.object({
  reportContent: z
    .string()
    .describe('The full textual content of the generated SHE report summary, formatted with markdown for readability (e.g., headings, bullet points).'),
});
export type SheReportOutput = z.infer<typeof SheReportOutputSchema>;

export async function generateSheReport(
  input: SheReportInput
): Promise<SheReportOutput> {
  return generateSheReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSheReportPrompt',
  input: {schema: SheReportInputSchema},
  output: {schema: SheReportOutputSchema},
  prompt: `You are an experienced SHEQ Manager tasked with compiling a SHE (Safety, Health, and Environment) report summary.
The report should be structured, insightful, and highlight key performance areas, concerns, and recommendations.
Use Markdown for formatting (headings, subheadings, bullet points, bold text for emphasis).

Reporting Period: {{{reportingPeriod}}}

Please synthesize the following information into a comprehensive SHE report summary:

1.  **Incident Overview:**
    {{{incidentSummary}}}

2.  **Inspection Program Summary:**
    {{{inspectionSummary}}}

3.  **Risk Management Summary:**
    {{{riskAssessmentSummary}}}

{{#if safetyInitiativesSummary}}
4.  **Safety Initiatives & Training:**
    {{{safetyInitiativesSummary}}}
{{/if}}

Based on the above, structure your report with the following sections:
-   **Executive Summary:** A brief overview of the SHE performance during the reporting period.
-   **Incident Performance:** Detailed insights from the incident summary.
-   **Inspection & Compliance:** Key takeaways from the inspection summary.
-   **Risk Management:** Highlights from the risk assessment summary.
{{#if safetyInitiativesSummary}}
-   **Safety Initiatives & Training:** Updates on safety programs.
{{/if}}
-   **Key Challenges & Areas for Improvement:** Identify 2-3 main challenges based on the provided data.
-   **Recommendations:** Provide 2-3 actionable recommendations to address the challenges and improve SHE performance.
-   **Conclusion:** A brief concluding statement.

Ensure the report is professional, data-driven (based on the summaries provided), and easy to understand.
The output should be a single string containing the entire report formatted with Markdown.
`,
});

const generateSheReportFlow = ai.defineFlow(
  {
    name: 'generateSheReportFlow',
    inputSchema: SheReportInputSchema,
    outputSchema: SheReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
