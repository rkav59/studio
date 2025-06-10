
'use server';
/**
 * @fileOverview A Genkit flow for analyzing SHEQ audit data to provide insights.
 *
 * - analyzeSheqAuditData - A function that takes a summary of audit data and returns AI-generated insights.
 * - AnalyzeAuditDataInput - The input type for the function.
 * - AnalyzeAuditDataOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z}
from 'genkit';
import type { AnalyzeAuditDataInput as AnalyzeAuditDataInputType, AnalyzeAuditDataOutput as AnalyzeAuditDataOutputType } from '@/lib/types';


const AnalyzeAuditDataInputSchema = z.object({
  totalAudits: z.number().describe("Total number of audits available in the summary period."),
  completedAuditsCount: z.number().describe("Number of audits that are marked as completed or closed."),
  nonConformanceDescriptions: z.array(z.string()).describe("A list of textual descriptions of identified non-conformances from various audits."),
  failedChecklistItemsText: z.array(z.string()).describe("A list of the textual content of checklist items that were marked as non-compliant across different audits."),
  capaStatusSummary: z.object({
    open: z.number(),
    inProgress: z.number(),
    completed: z.number(),
    overdue: z.number(),
  }).describe("A summary of the current statuses of Corrective and Preventive Actions (CAPAs) linked to non-conformances."),
  overallFindingsSummary: z.array(z.string()).optional().describe("A list of overall findings texts from completed audits. This can provide context on auditors' general observations."),
  overallRecommendationsSummary: z.array(z.string()).optional().describe("A list of overall recommendations texts from completed audits. This can indicate auditors' suggestions for improvement."),
});
export type AnalyzeAuditDataInput = z.infer<typeof AnalyzeAuditDataInputSchema>;


const AnalyzeAuditDataOutputSchema = z.object({
  identifiedThemes: z.string().describe("Common themes or recurring patterns observed across non-conformances and failed checklist items. Each distinct theme should be listed on a new line. Be concise but descriptive."),
  capaEffectivenessObservations: z.string().describe("Observations regarding the status and potential effectiveness of corrective and preventive actions. For example, comment on the ratio of open to completed CAPAs, or if many are overdue."),
  suggestedFocusAreas: z.string().describe("Specific areas or topics that might require more attention, training, or systemic improvement based on the analysis of the provided data. List each area on a new line."),
  positiveObservations: z.string().optional().describe("Any positive observations or potential strengths that can be inferred from the audit data summary, if apparent."),
});
export type AnalyzeAuditDataOutput = z.infer<typeof AnalyzeAuditDataOutputSchema>;


export async function analyzeSheqAuditData(
  input: AnalyzeAuditDataInputType
): Promise<AnalyzeAuditDataOutputType> {
  return analyzeAuditDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeAuditDataPrompt',
  input: {schema: AnalyzeAuditDataInputSchema},
  output: {schema: AnalyzeAuditDataOutputSchema},
  prompt: `You are an expert SHEQ (Safety, Health, Environment, Quality) analyst.
You have been provided with a summary of data from multiple SHEQ audits. Your task is to analyze this data and provide actionable insights.

Provided Audit Data Summary:
- Total Audits in Period: {{{totalAudits}}}
- Completed/Closed Audits: {{{completedAuditsCount}}}

- Non-Conformance Descriptions (examples):
  {{#each nonConformanceDescriptions}}
  - "{{this}}"
  {{else}}
  - No specific non-conformance descriptions provided or none logged.
  {{/each}}

- Failed Checklist Items (examples of items marked Non-Compliant):
  {{#each failedChecklistItemsText}}
  - "{{this}}"
  {{else}}
  - No specific failed checklist items provided or all were compliant.
  {{/each}}

- CAPA Status Summary:
  - Open: {{{capaStatusSummary.open}}}
  - In Progress: {{{capaStatusSummary.inProgress}}}
  - Completed: {{{capaStatusSummary.completed}}}
  - Overdue: {{{capaStatusSummary.overdue}}}

{{#if overallFindingsSummary}}
- Examples of Overall Audit Findings from some audits:
  {{#each overallFindingsSummary}}
  - "{{this}}"
  {{/each}}
{{/if}}

{{#if overallRecommendationsSummary}}
- Examples of Overall Audit Recommendations from some audits:
  {{#each overallRecommendationsSummary}}
  - "{{this}}"
  {{/each}}
{{/if}}

Your Analysis (based ONLY on the data provided above):

1.  **Identified Themes:**
    Review the 'Non-Conformance Descriptions' and 'Failed Checklist Items Text'.
    Identify and list common themes, recurring issues, or patterns.
    For example, if multiple NCs relate to "PPE not worn" or "emergency exits blocked", these are themes.
    Output these themes in the 'identifiedThemes' field, each on a new line.

2.  **CAPA Effectiveness Observations:**
    Analyze the 'CAPA Status Summary'.
    Provide observations on the effectiveness or management of corrective and preventive actions.
    Consider the proportion of open, in-progress, completed, and especially overdue actions.
    Output these observations in the 'capaEffectivenessObservations' field.

3.  **Suggested Focus Areas:**
    Based on the identified themes and CAPA observations, suggest specific areas or topics that likely require more attention, resources, training, or systemic improvements to enhance SHEQ performance.
    Output these suggestions in the 'suggestedFocusAreas' field, each on a new line.

4.  **Positive Observations (Optional):**
    If the data suggests any positive aspects (e.g., low number of NCs despite many audits, high completion rate of CAPAs without many overdue), mention them briefly in the 'positiveObservations' field. If no clear positives, this can be omitted or state "No specific positive observations noted from this summary."

Adhere strictly to the output schema. Ensure your insights are derived directly from the provided summary.
Do not invent data or make assumptions beyond what is given.
`,
});

const analyzeAuditDataFlow = ai.defineFlow(
  {
    name: 'analyzeAuditDataFlow',
    inputSchema: AnalyzeAuditDataInputSchema,
    outputSchema: AnalyzeAuditDataOutputSchema,
  },
  async (input: AnalyzeAuditDataInputType) => {
    // Defensive check: if no useful textual data, provide a default-like response or short-circuit
    if (input.nonConformanceDescriptions.length === 0 && input.failedChecklistItemsText.length === 0) {
        return {
            identifiedThemes: "No specific non-conformances or failed checklist items were provided in the summary to identify detailed themes.",
            capaEffectivenessObservations: `CAPA Status: Open: ${input.capaStatusSummary.open}, In Progress: ${input.capaStatusSummary.inProgress}, Completed: ${input.capaStatusSummary.completed}, Overdue: ${input.capaStatusSummary.overdue}. Further analysis would require more context on the nature of these CAPAs.`,
            suggestedFocusAreas: "Review overall audit processes and CAPA management for potential improvements.",
            positiveObservations: input.completedAuditsCount > 0 ? `${input.completedAuditsCount} audits completed is a positive activity.` : "Ensure audits are regularly conducted and closed out.",
        };
    }

    const {output} = await prompt(input);
    return output!;
  }
);
