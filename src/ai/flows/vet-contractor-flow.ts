
'use server';
/**
 * @fileOverview A Genkit flow for providing an AI-assisted vetting recommendation for a contractor.
 *
 * - vetContractor - A function that analyzes historical performance data and suggests a vetting status.
 * - VetContractorInput - The input type for the function.
 * - VetContractorOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { ContractorVettingStatus } from '@/lib/types';

// Define Zod schemas for input and output
const vettingStatusesForSchema: [ContractorVettingStatus, ...ContractorVettingStatus[]] = ['Approved', 'Pending', 'Rejected', 'Requires Review'];

export const VetContractorInputSchema = z.object({
  contractorName: z.string().describe('The name of the contractor being vetted.'),
  tradeOrService: z.string().describe('The trade or service the contractor provides.'),
  ptwSummary: z.object({
    total: z.number(),
    closed: z.number(),
    expired: z.number(),
    cancelled: z.number(),
  }).describe('A summary of the contractor\'s Permit-to-Work history.'),
  jobCardSummary: z.object({
    total: z.number(),
    completed: z.number(),
    cancelled: z.number(),
  }).describe('A summary of the contractor\'s Job Card history.'),
  supervisionSummary: z.object({
    excellent: z.number(),
    good: z.number(),
    fair: z.number(),
    poor: z.number(),
    total: z.number(),
  }).describe('A summary of performance ratings from on-site supervision records.'),
});

export const VetContractorOutputSchema = z.object({
  overallAssessment: z.string().describe('A concise, one-sentence overall assessment of the contractor\'s safety performance.'),
  positivePoints: z.array(z.string()).describe('A list of positive observations from the data.'),
  areasForConcern: z.array(z.string()).describe('A list of potential concerns or red flags from the data.'),
  suggestedVettingStatus: z.enum(vettingStatusesForSchema).describe('The AI\'s recommended vetting status based on the analysis.'),
  recommendationReasoning: z.string().describe('A brief explanation for the suggested vetting status.'),
});

export type VetContractorInput = z.infer<typeof VetContractorInputSchema>;
export type VetContractorOutput = z.infer<typeof VetContractorOutputSchema>;

// Exported wrapper function
export async function vetContractor(input: VetContractorInput): Promise<VetContractorOutput> {
  return vetContractorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'vetContractorPrompt',
  input: {schema: VetContractorInputSchema},
  output: {schema: VetContractorOutputSchema},
  prompt: `You are an expert SHEQ (Safety, Health, Environment, Quality) Manager responsible for contractor vetting.
Analyze the following historical performance data for a contractor and provide a vetting recommendation.

Contractor Details:
- Name: {{{contractorName}}}
- Service: {{{tradeOrService}}}

Historical Performance Data:
- Permit-to-Work (PTW) History:
  - Total PTWs Issued: {{{ptwSummary.total}}}
  - Closed Successfully: {{{ptwSummary.closed}}}
  - Expired: {{{ptwSummary.expired}}}
  - Cancelled: {{{ptwSummary.cancelled}}}

- Job Card History:
  - Total Job Cards: {{{jobCardSummary.total}}}
  - Completed Successfully: {{{jobCardSummary.completed}}}
  - Cancelled: {{{jobCardSummary.cancelled}}}

- On-Site Supervision Ratings:
  - Total Supervision Records: {{{supervisionSummary.total}}}
  - Excellent Ratings: {{{supervisionSummary.excellent}}}
  - Good Ratings: {{{supervisionSummary.good}}}
  - Fair Ratings: {{{supervisionSummary.fair}}}
  - Poor Ratings: {{{supervisionSummary.poor}}}

Your Task:
Based ONLY on the data provided, perform the following analysis and structure your response strictly according to the output schema.

1.  **Overall Assessment:** Write a single, concise sentence summarizing the contractor's performance record.
2.  **Positive Points:** Identify and list key strengths. For example, a high number of successfully closed PTWs, a high ratio of good/excellent supervision ratings, or no 'Poor' ratings. If there are no clear positives, state that.
3.  **Areas for Concern:** Identify and list potential red flags. For example, any 'Poor' supervision ratings, a high number of expired or cancelled PTWs, or a pattern of cancelled jobs. If there are no concerns, state that.
4.  **Suggested Vetting Status:** Based on the balance of positives and concerns, suggest a vetting status from the available options.
    - 'Approved': Strong positive record, no significant concerns.
    - 'Requires Review': Mixed record, some concerns that need further investigation or discussion with the contractor.
    - 'Rejected': Significant concerns, such as 'Poor' ratings or a clear pattern of non-completion.
    - 'Pending': Use if there is insufficient data to make a clear judgment.
5.  **Recommendation Reasoning:** Briefly explain why you suggested that status, citing the specific data points that influenced your decision (e.g., "Suggested 'Requires Review' due to the 'Poor' supervision rating, despite a good PTW completion record.").
`,
});

const vetContractorFlow = ai.defineFlow(
  {
    name: 'vetContractorFlow',
    inputSchema: VetContractorInputSchema,
    outputSchema: VetContractorOutputSchema,
  },
  async input => {
    // If there is almost no data, return a default 'Pending' status.
    if (input.ptwSummary.total === 0 && input.jobCardSummary.total === 0 && input.supervisionSummary.total === 0) {
      return {
        overallAssessment: "Insufficient historical data available to form an assessment.",
        positivePoints: ["No performance history recorded in the system."],
        areasForConcern: ["Lack of data makes it impossible to verify past performance."],
        suggestedVettingStatus: "Pending",
        recommendationReasoning: "No PTWs, Job Cards, or Supervision records found for this contractor. Vetting status cannot be determined without performance data.",
      };
    }
    
    const {output} = await prompt(input);
    return output!;
  }
);
