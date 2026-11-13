"use client";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, Users, ShieldCheck } from "lucide-react";
export default function WelcomePage() {
  const { user, userProfile, isLoadingProfile } = useAuth();
  return <main className="flex min-h-svh items-center justify-center px-5 py-12">
    <div className="w-full max-w-2xl space-y-8">
      <div className="space-y-3"><span className="inline-flex rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">WELCOME TO SHEiQpro</span>
        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">You're in, {user?.displayName?.split(" ")[0] || "there"}.</h1>
        <p className="max-w-xl text-muted-foreground">Let's get your safety workspace ready. You can set up your organisation or accept an invitation from your team.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-card p-5 shadow-sm"><Building2 className="mb-3 h-6 w-6 text-primary" /><h2 className="font-semibold">Your workspace</h2><p className="mt-2 text-sm text-muted-foreground">Review your organisation details and account.</p></div>
        <div className="rounded-xl bg-card p-5 shadow-sm"><Users className="mb-3 h-6 w-6 text-primary" /><h2 className="font-semibold">Your team</h2><p className="mt-2 text-sm text-muted-foreground">Invite colleagues or join an existing team.</p></div>
        <div className="rounded-xl bg-card p-5 shadow-sm"><ShieldCheck className="mb-3 h-6 w-6 text-primary" /><h2 className="font-semibold">Your subscription</h2><p className="mt-2 text-sm text-muted-foreground">Activate billing before accessing paid modules.</p></div>
      </div>
      <div className="flex flex-wrap gap-3">{!isLoadingProfile && userProfile && <Button asChild><Link href="/billing">Continue setup <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>}<Button asChild variant="outline"><Link href="/join">Join with invitation</Link></Button><Button asChild variant="ghost"><Link href="/user-profile">Review profile</Link></Button></div>
      {isLoadingProfile && <p role="status" className="text-sm text-muted-foreground">Preparing your account…</p>}
      {!isLoadingProfile && !userProfile && <p role="status" className="text-sm text-muted-foreground">Your organisation profile is not ready yet. Please sign in again or contact support if this persists.</p>}
    </div>
  </main>;
}
