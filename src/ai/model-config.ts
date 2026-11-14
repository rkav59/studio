/**
 * Shared model and environment settings for server-side Gemini use.
 * Keep the API key in Vercel as GOOGLE_GENAI_API_KEY, never NEXT_PUBLIC_.
 */
export const GEMINI_MODEL = process.env.GEMINI_MODEL?.startsWith('googleai/gemini-')
  ? process.env.GEMINI_MODEL
  : 'googleai/gemini-2.5-flash';

export const geminiConfigured = () => Boolean(process.env.GOOGLE_GENAI_API_KEY);
