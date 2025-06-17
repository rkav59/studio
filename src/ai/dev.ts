
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-safety-recommendation.ts';
// import '@/ai/flows/generate-risk-assessment-suggestion-flow.ts'; // Removed as part of Hub removal
// import '@/ai/flows/identify-hazards-flow.ts'; // Removed as part of Hub removal
import '@/ai/flows/generate-she-report-flow.ts';
import '@/ai/flows/analyze-audit-data-flow.ts';
// import '@/ai/flows/suggest-root-cause-flow.ts'; // Removed as part of Hub removal
import '@/ai/flows/generate-drill-scenario-flow.ts';

