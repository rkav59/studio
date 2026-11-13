import "server-only";
import { createClient } from "@supabase/supabase-js";

export function billingDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Billing database credentials are not configured");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function billingIdentity(authorization: string | null) {
  const token = authorization?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) return null;
  const db = billingDb();
  const { data: { user }, error } = await db.auth.getUser(token);
  if (error || !user) return null;
  const { data: profile, error: profileError } = await db.from("profiles").select("organization_id,role,active").eq("id", user.id).single();
  if (profileError || !profile?.organization_id || profile.active !== true) return null;
  // Email verification and an active administrator membership are required.
  // This exemption never changes PostgreSQL RLS or tenant membership.
  const developerExempt = user.email?.trim().toLowerCase() === "rapportsango@gmail.com" &&
    Boolean(user.email_confirmed_at) && profile.role === "admin";
  return { user, organizationId: profile.organization_id as string, role: profile.role as string, developerExempt };
}

export function isEntitled(subscription: { status: string; current_period_end: string | null } | null) {
  return !!subscription && (subscription.status === "active" || subscription.status === "on_hold") &&
    (!subscription.current_period_end || Date.parse(subscription.current_period_end) > Date.now());
}
