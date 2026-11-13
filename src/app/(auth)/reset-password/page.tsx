"use client";
import { useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase/client";
import { PasswordStrength } from "@/components/auth/password-strength";
import { passwordChecks } from "@/lib/auth/password-policy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export default function ResetPasswordPage() {
  const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  const valid = passwordChecks(password).every(x => x.valid) && password === confirm;
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setMessage(""); if (!valid) { setMessage("Use a strong password and confirm it correctly."); return; }
    setBusy(true);
    try {
      const client = getSupabase(); const { data, error: sessionError } = await client.auth.getSession();
      if (sessionError) throw sessionError;
      if (!data.session) throw new Error("Open the latest password reset link from your email.");
      const { error } = await client.auth.updateUser({ password }); if (error) throw error;
      setMessage("Password updated successfully. You can sign in now.");
    } catch (err) { setMessage((err as Error).message); } finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="space-y-5">
    <div className="space-y-2"><p className="text-sm font-semibold text-primary">ACCOUNT SECURITY</p><h1 className="text-3xl font-bold tracking-tight">Create a new password</h1><p className="text-muted-foreground">Choose a strong password to protect your workspace.</p></div>
    <div className="space-y-2"><label htmlFor="new-password" className="text-sm font-medium">New password</label><Input id="new-password" type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} required className="h-12" /><PasswordStrength password={password} /></div>
    <div className="space-y-2"><label htmlFor="confirm-password" className="text-sm font-medium">Confirm password</label><Input id="confirm-password" type="password" autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} required className="h-12" /></div>
    <Button type="submit" disabled={!valid || busy} className="h-12 w-full">{busy ? "Updating…" : "Update password"}</Button><p role="status" className="text-sm text-muted-foreground">{message}</p><Link href="/sign-in" className="text-sm font-medium text-primary hover:underline">Return to sign in</Link>
  </form>;
}
