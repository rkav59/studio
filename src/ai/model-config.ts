/** Fixed model keeps the conservative request allowance valid. Re-evaluate limits before changing it. */
export const GEMINI_MODEL = 'googleai/gemini-2.5-flash-lite';
export const MAX_AI_INPUT_BYTES = 12000;
export const MAX_AI_OUTPUT_TOKENS = 2048;
export const geminiConfigured = () => Boolean(
  process.env.GOOGLE_GENAI_API_KEY?.trim() &&
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() &&
  process.env.AI_PAID_TIER_CONFIRMED === 'true'
);
