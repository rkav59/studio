"use client";
import { reviewAiDraft } from '@/components/ai-recommendations/draft-review';
import { getSupabase } from "@/lib/supabase/client";
import { analyzeSheqAuditData as analyzeSheqAuditDataAction } from './flows/analyze-audit-data-flow';
export type * from './flows/analyze-audit-data-flow';
import { generateDrillScenario as generateDrillScenarioAction } from './flows/generate-drill-scenario-flow';
export type * from './flows/generate-drill-scenario-flow';
import { generateKpiRecommendation as generateKpiRecommendationAction } from './flows/generate-kpi-recommendation-flow';
export type * from './flows/generate-kpi-recommendation-flow';
import { generateLegalRegister as generateLegalRegisterAction } from './flows/generate-legal-register-flow';
export type * from './flows/generate-legal-register-flow';
import { generateRiskAssessmentSuggestion as generateRiskAssessmentSuggestionAction } from './flows/generate-risk-assessment-suggestion-flow';
export type * from './flows/generate-risk-assessment-suggestion-flow';
import { generateSafetyRecommendation as generateSafetyRecommendationAction } from './flows/generate-safety-recommendation';
export type * from './flows/generate-safety-recommendation';
import { generateSheReport as generateSheReportAction } from './flows/generate-she-report-flow';
export type * from './flows/generate-she-report-flow';
import { identifyHazards as identifyHazardsAction } from './flows/identify-hazards-flow';
export type * from './flows/identify-hazards-flow';
import { suggestRootCause as suggestRootCauseAction } from './flows/suggest-root-cause-flow';
export type * from './flows/suggest-root-cause-flow';
import { vetContractor as vetContractorAction } from './flows/vet-contractor-flow';
export type * from './flows/vet-contractor-flow';

async function draft<I, O>(action: (input: I, token: string) => Promise<O>, input: I): Promise<O> {
  const { data: { session } } = await getSupabase().auth.getSession();
  if (!session) throw new Error('Sign in to use AI.');
  if (!window.confirm('Send this summary for AI drafting? Remove unnecessary personal or medical information first. AI output requires your professional review and does not approve safety decisions.')) {
    throw new Error('AI request cancelled.');
  }
  const result = await action(input, session.access_token);
  if (!await reviewAiDraft(result)) throw new Error('AI draft discarded.');
  return result;
}
export const analyzeSheqAuditData = (input: Parameters<typeof analyzeSheqAuditDataAction>[0]) => draft(analyzeSheqAuditDataAction, input);
export const generateDrillScenario = (input: Parameters<typeof generateDrillScenarioAction>[0]) => draft(generateDrillScenarioAction, input);
export const generateKpiRecommendation = (input: Parameters<typeof generateKpiRecommendationAction>[0]) => draft(generateKpiRecommendationAction, input);
export const generateLegalRegister = (input: Parameters<typeof generateLegalRegisterAction>[0]) => draft(generateLegalRegisterAction, input);
export const generateRiskAssessmentSuggestion = (input: Parameters<typeof generateRiskAssessmentSuggestionAction>[0]) => draft(generateRiskAssessmentSuggestionAction, input);
export const generateSafetyRecommendation = (input: Parameters<typeof generateSafetyRecommendationAction>[0]) => draft(generateSafetyRecommendationAction, input);
export const generateSheReport = (input: Parameters<typeof generateSheReportAction>[0]) => draft(generateSheReportAction, input);
export const identifyHazards = (input: Parameters<typeof identifyHazardsAction>[0]) => draft(identifyHazardsAction, input);
export const suggestRootCause = (input: Parameters<typeof suggestRootCauseAction>[0]) => draft(suggestRootCauseAction, input);
export const vetContractor = (input: Parameters<typeof vetContractorAction>[0]) => draft(vetContractorAction, input);
