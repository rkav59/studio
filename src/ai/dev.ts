
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-safety-recommendation.ts';
import '@/ai/flows/generate-risk-assessment-suggestion-flow.ts';
import '@/ai/flows/identify-hazards-flow.ts';
import '@/ai/flows/generate-she-report-flow.ts';
import '@/ai/flows/analyze-audit-data-flow.ts'; // Added import
