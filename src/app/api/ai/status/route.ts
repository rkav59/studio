import { NextResponse } from "next/server";
import { GEMINI_MODEL, geminiConfigured } from "@/ai/model-config";

export const runtime = "nodejs";

/** Readiness only. Never return credentials or private configuration. */
export async function GET() {
  const configured = geminiConfigured();
  return NextResponse.json(
    { configured, provider: "Gemini API", model: GEMINI_MODEL },
    { headers: { "Cache-Control": "no-store" } },
  );
}
