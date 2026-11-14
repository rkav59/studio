import 'server-only';
import { genkit } from 'genkit';
import { GEMINI_MODEL } from './model-config';
import { googleAI } from '@genkit-ai/googleai';

/**
 * One server-side Gemini configuration for every SHEiQpro AI flow.
 * Keep the API key in the Vercel server environment, never NEXT_PUBLIC_.
 *
 * Gemini 2.0 Flash was discontinued; use a supported versioned model.
 * Set GEMINI_MODEL after evaluating a replacement across SHEQ workflows.
 */
export const ai = genkit({
  plugins: [googleAI()],
  model: GEMINI_MODEL,
});
