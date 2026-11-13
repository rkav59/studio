import { NextRequest, NextResponse } from "next/server";
import { billingDb, billingIdentity, isEntitled } from "@/lib/billing/server";
import { BILLING_ENABLED } from "@/lib/billing/feature-flags";
export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  try {
    const identity = await billingIdentity(request.headers.get("authorization"));
    if (!identity) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!BILLING_ENABLED) {
      return NextResponse.json({ active: true, status: "free_access", plan: "free", exemption: true }, {
        headers: { "Cache-Control": "private, no-store" }
      });
    }
    if (identity.developerOrganizationExempt) {
      return NextResponse.json({ active: true, status: "developer_organization", plan: "developer_organization", exemption: true }, {
        headers: { "Cache-Control": "private, no-store" }
      });
    }
    const { data, error } = await billingDb().from("organization_subscriptions").select("status,current_period_end,plan_id").eq("organization_id", identity.organizationId).maybeSingle();
    if (error) throw error;
    return NextResponse.json({ active: isEntitled(data), status: data?.status ?? "inactive", plan: data?.plan_id ?? null, exemption: false }, {
      headers: { "Cache-Control": "private, no-store" }
    });
  } catch { return NextResponse.json({ error: "Billing status unavailable" }, { status: 503 }); }
}
