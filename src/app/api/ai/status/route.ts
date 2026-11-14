import { NextResponse } from "next/server";
import { GEMINI_MODEL } from "@/ai/genkit";

export const runtime = "nodejs";

/** Readiness only. Never return credentials or private configuration. */
export async function GET() {
  const configured = Boolean(process.env.GOOGLE_GENAI_API_KEY);
  return NextResponse.json(
    { configured, provider: "Gemini API", model: GEMINI_MODEL },
    { headers: { "Cache-Control": "no-store" } },
  );
}
