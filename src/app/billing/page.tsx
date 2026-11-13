"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { getSupabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
export default function BillingPage() {
  const { user, userProfile, isAuthenticating } = useAuth();
  const [status, setStatus] = useState("Checking subscription…");
  const [active, setActive] = useState(false);
  const [developerExempt, setDeveloperExempt] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function authHeaders() {
    const { data } = await getSupabase().auth.getSession();
    if (!data.session) throw new Error("Please sign in to continue");
    return { Authorization: "Bearer " + data.session.access_token };
  }
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    authHeaders().then(headers => fetch("/api/billing/status", { headers, cache: "no-store" }))
      .then(async response => { if (!response.ok) throw new Error("Unable to check billing"); return response.json(); })
      .then(result => { if (!cancelled) { setActive(result.active); setDeveloperExempt(result.exemption === true); setStatus(result.exemption ? "Developer access enabled — no subscription required" : result.active ? "Subscription active" : "Subscription required"); } })
      .catch(() => { if (!cancelled) setStatus("Billing status unavailable"); });
    return () => { cancelled = true; };
  }, [user]);
  async function subscribe() {
    setBusy(true); setError("");
    try {
      const headers = await authHeaders();
      const response = await fetch("/api/billing/checkout", { method: "POST", headers });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to start checkout");
      window.location.assign(result.checkoutUrl);
    } catch (e) { setError((e as Error).message); setBusy(false); }
  }
  return <main className="mx-auto flex min-h-svh max-w-xl flex-col justify-center gap-5 p-6">
    <h1 className="text-3xl font-semibold">SHEiQpro subscription</h1>
    <p className="text-muted-foreground">Keep your organisation's safety management workspace available with a subscription. Billing is securely handled by Dodo Payments.</p>
    <p aria-live="polite" className="font-medium">{status}</p>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    {!user && !isAuthenticating ? <Button asChild><Link href="/sign-in">Sign in</Link></Button> :
      active ? <Button asChild><Link href="/dashboard">Continue to dashboard</Link></Button> :
      userProfile?.role === "admin" ? <Button disabled={busy} onClick={subscribe}>{busy ? "Opening checkout…" : "Subscribe with Dodo Payments"}</Button> :
      <p>Ask your organisation administrator to activate the subscription.</p>}
    {!developerExempt && <p className="text-sm text-muted-foreground">Payment confirmation may take a moment. Access is enabled only after verified confirmation.</p>}
  </main>;
}
