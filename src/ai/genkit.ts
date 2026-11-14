import 'server-only';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

/**
 * One server-side Gemini configuration for every SHEiQpro AI flow.
 * Keep the API key in the Vercel server environment, never NEXT_PUBLIC_.
 *
 * Gemini 2.0 Flash was discontinued; use a supported versioned model.
 * Set GEMINI_MODEL after evaluating a replacement across SHEQ workflows.
 */
export const GEMINI_MODEL = process.env.GEMINI_MODEL?.startsWith('googleai/gemini-')
  ? process.env.GEMINI_MODEL
  : 'googleai/gemini-2.5-flash';

export const ai = genkit({
  plugins: [googleAI()],
  model: GEMINI_MODEL,
});
