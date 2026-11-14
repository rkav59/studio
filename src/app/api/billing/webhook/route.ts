import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { billingDb } from "@/lib/billing/server";
export const runtime = "nodejs";
function verify(body: string, request: NextRequest) {
  const secret = process.env.DODO_PAYMENTS_WEBHOOK_SECRET;
  const id = request.headers.get("webhook-id");
  const timestamp = request.headers.get("webhook-timestamp");
  const signature = request.headers.get("webhook-signature");
  if (!secret || !id || !timestamp || !signature) return false;
  if (!/^\d+$/.test(timestamp) || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key).update(id + "." + timestamp + "." + body).digest();
  return signature.split(" ").some(part => {
    if (!part.startsWith("v1,")) return false;
    const provided = Buffer.from(part.slice(3), "base64");
    return provided.length === expected.length && timingSafeEqual(provided, expected);
  });
}
export async function POST(request: NextRequest) {
  const raw = await request.text();
  if (!verify(raw, request)) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  try {
    const payload = JSON.parse(raw);
    const event = String(payload.type ?? "");
    if (!event.startsWith("subscription.")) return NextResponse.json({ received: true });
    const subscription = payload.data ?? {};
    const org = subscription.metadata?.organization_id;
    const subscriptionId = subscription.subscription_id;
    if (typeof org !== "string" || typeof subscriptionId !== "string") return NextResponse.json({ received: true });
    const db = billingDb();
    const { data: current, error: lookupError } = await db.from("organization_subscriptions").select("dodo_subscription_id").eq("organization_id", org).maybeSingle();
    if (lookupError) throw lookupError;
    if (current?.dodo_subscription_id && current.dodo_subscription_id !== subscriptionId) return NextResponse.json({ received: true });
    const allowed = ["active", "on_hold", "pending", "failed", "cancelled", "expired"];
    const status = String(subscription.status ?? "pending").toLowerCase();
    if (!allowed.includes(status)) return NextResponse.json({ received: true });
    const periodEnd = subscription.next_billing_date ?? subscription.current_period_end ?? null;
    const { error } = await db.from("organization_subscriptions").upsert({
      organization_id: org, dodo_subscription_id: subscriptionId, dodo_customer_id: subscription.customer?.customer_id ?? subscription.customer_id ?? null,
      status, plan_id: "pro", current_period_end: periodEnd, updated_at: new Date().toISOString()
    }, { onConflict: "organization_id" });
    if (error) throw error;
    return NextResponse.json({ received: true });
  } catch { return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 }); }
}
