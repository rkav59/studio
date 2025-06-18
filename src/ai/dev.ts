
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-safety-recommendation.ts';
import '@/ai/flows/generate-risk-assessment-suggestion-flow.ts'; // Re-activated
import '@/ai/flows/identify-hazards-flow.ts'; // Re-activated
import '@/ai/flows/generate-she-report-flow.ts';
import '@/ai/flows/analyze-audit-data-flow.ts';
// import '@/ai/flows/suggest-root-cause-flow.ts'; // Remains commented as per previous Hub removal
import '@/ai/flows/generate-drill-scenario-flow.ts';

