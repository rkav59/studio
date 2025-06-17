
import type { IndustrialHygieneSampleAgent, MedicalTestRecordType } from './types';

export const agentToMedicalTestMap: Partial<Record<IndustrialHygieneSampleAgent, MedicalTestRecordType>> = {
  'Noise': 'Audiometry',
  'Dust (Respirable)': 'Spirometry (Lung Function)',
  'Dust (Inhalable)': 'Spirometry (Lung Function)',
  'Silica': 'Spirometry (Lung Function)', // Also X-Ray long term, but Spirometry is common
  'Asbestos': 'Spirometry (Lung Function)', // Also X-Ray long term
  'Welding Fumes': 'Spirometry (Lung Function)',
  'Lead': 'Blood Test', // Specific for blood lead levels
  'VOCs': 'Biological Monitoring', // Or specific blood/urine tests
  'Specific Chemical': 'Biological Monitoring', // Depends on the chemical
  // Ergonomic Strain might lead to Musculoskeletal Assessment, but it's not a direct IH agent test
};

export const followUpKeywords: string[] = [
  "abnormal", "elevated", "referral", "action required", "monitor", 
  "re-test", "out of range", "exceeds", "follow-up", "concern", "further investigation"
];
