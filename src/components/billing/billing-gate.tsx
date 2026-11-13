"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { getSupabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
export function BillingGate({ children }: { children: React.ReactNode }) {
  const { user, userProfile } = useAuth();
  const [state, setState] = useState<"checking" | "active" | "inactive">("checking");
  useEffect(() => {
    let disposed = false;
    setState("checking");
    if (!user || !userProfile?.organizationId) return;
    getSupabase().auth.getSession().then(async ({ data }) => {
      if (!data.session) throw new Error("No session");
      const response = await fetch("/api/billing/status", { headers: { Authorization: "Bearer " + data.session.access_token }, cache: "no-store" });
      if (!response.ok) throw new Error("Billing status unavailable");
      return response.json();
    }).then(data => { if (!disposed) setState(data.active ? "active" : "inactive"); })
      .catch(() => { if (!disposed) setState("inactive"); });
    return () => { disposed = true; };
  }, [user?.uid, userProfile?.organizationId]);
  if (state === "active") return <>{children}</>;
  return <main className="mx-auto flex min-h-[60svh] max-w-xl flex-col items-start justify-center gap-4 p-5">
    <h1 className="text-2xl font-semibold">{state === "checking" ? "Checking subscription" : "Subscription required"}</h1>
    <p className="text-muted-foreground">{state === "checking" ? "Verifying your organisation's access…" : "Your organisation needs an active SHEiQpro subscription to use this workspace."}</p>
    {state === "inactive" && <Button asChild><Link href="/billing">View subscription options</Link></Button>}
  </main>;
}
