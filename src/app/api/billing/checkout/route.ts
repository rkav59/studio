import { NextRequest, NextResponse } from "next/server";
import { billingDb, billingIdentity } from "@/lib/billing/server";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  try {
    const identity = await billingIdentity(request.headers.get("authorization"));
    if (!identity) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (identity.developerOrganizationExempt) return NextResponse.json({ error: "This developer organisation already has subscription-free access." }, { status: 409 });
    if (identity.role !== "admin") return NextResponse.json({ error: "Only organisation administrators can subscribe" }, { status: 403 });
    const key = process.env.DODO_PAYMENTS_API_KEY;
    const product = process.env.DODO_SUBSCRIPTION_PRODUCT_ID;
    const origin = process.env.NEXT_PUBLIC_APP_URL;
    if (!key || !product || !origin) return NextResponse.json({ error: "Checkout is not configured yet" }, { status: 503 });
    const { data: existing } = await billingDb().from("organization_subscriptions").select("status").eq("organization_id", identity.organizationId).maybeSingle();
    if (existing?.status === "active") return NextResponse.json({ error: "Organisation already subscribed" }, { status: 409 });
    const endpoint = process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode" ? "https://live.dodopayments.com" : "https://test.dodopayments.com";
    const response = await fetch(endpoint + "/checkouts", {
      method: "POST",
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({
        product_cart: [{ product_id: product, quantity: 1 }],
        customer: { email: identity.user.email },
        metadata: { organization_id: identity.organizationId },
        return_url: new URL("/billing?checkout=returned", origin).toString()
      }),
      cache: "no-store"
    });
    if (!response.ok) return NextResponse.json({ error: "Dodo checkout could not be created" }, { status: 502 });
    const result = await response.json();
    if (typeof result.checkout_url !== "string" || !result.checkout_url.startsWith("https://"))
      return NextResponse.json({ error: "Invalid checkout response" }, { status: 502 });
    return NextResponse.json({ checkoutUrl: result.checkout_url });
  } catch { return NextResponse.json({ error: "Checkout unavailable" }, { status: 503 }); }
}
