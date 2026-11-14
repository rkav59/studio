"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function BillingPage() {
  const { user, isAuthenticating } = useAuth();

  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col justify-center gap-5 p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
        <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
      </div>
      <h1 className="text-3xl font-semibold tracking-tight">SHEiQpro is free to use</h1>
      <p className="text-muted-foreground">
        Subscription payments are temporarily paused. Your organisation can access
        the platform without paying, subject to the usual account and role permissions.
      </p>
      <p className="text-sm text-muted-foreground">
        No subscription or checkout is required at this time.
      </p>
      {!isAuthenticating && (
        <Button asChild>
          <Link href={user ? "/dashboard" : "/sign-in"}>
            {user ? "Continue to dashboard" : "Sign in to continue"}
          </Link>
        </Button>
      )}
    </main>
  );
}
