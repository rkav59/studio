import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifiedClient } from "@/lib/supabase/server";
import { emailConfigured, escapeHtml, sendEmail } from "@/lib/email";
const input = z.object({
  email: z.string().email().max(254),
  role: z.enum(["admin", "she_officer", "authorizer", "she_rep", "visitor"]),
});
export async function POST(request: NextRequest) {
  try {
    const { client } = await verifiedClient(
      request.headers.get("authorization")?.replace(/^Bearer /i, "") ?? "",
    );
    const { email, role } = input.parse(await request.json());
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl)
      throw new Error("Set NEXT_PUBLIC_APP_URL before creating invitations.");
    const { data: token, error } = await client.rpc("create_invitation", {
      invitee_email: email,
      invitee_role: role,
    });
    if (error) throw error;
    const inviteUrl = new URL(
      `/join?token=${encodeURIComponent(token)}`,
      appUrl,
    ).href;
    let emailSent = false;
    if (emailConfigured()) {
      try {
        await sendEmail(
          email,
          "Invitation to SHEiQpro",
          `<p>You have been invited to an organisation on SHEiQpro as ${escapeHtml(role.replaceAll("_", " "))}.</p><p><a href="${escapeHtml(inviteUrl)}">Accept invitation</a></p><p>This invitation expires in seven days. Sign in using this email address.</p>`,
        );
        emailSent = true;
      } catch {
        /* The administrator can copy the valid invitation link. */
      }
    }
    return NextResponse.json({ inviteUrl, emailSent });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
