
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-safety-recommendation.ts';
import '@/ai/flows/generate-risk-assessment-suggestion-flow.ts'; // Re-activated
import '@/ai/flows/identify-hazards-flow.ts'; // Re-activated
import '@/ai/flows/generate-she-report-flow.ts';
import '@/ai/flows/analyze-audit-data-flow.ts';
import '@/ai/flows/suggest-root-cause-flow.ts'; // Activated this flow
import '@/ai/flows/generate-drill-scenario-flow.ts';
import '@/ai/flows/generate-kpi-recommendation-flow.ts'; // New KPI recommendation flow
import '@/ai/flows/generate-legal-register-flow.ts'; // New Legal Register flow
import '@/ai/flows/send-action-item-reminders-flow.ts'; // New flow for email reminders

