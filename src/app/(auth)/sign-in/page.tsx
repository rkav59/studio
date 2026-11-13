"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { z } from "zod";
import { useAuth } from "@/contexts/auth-context";
import { SocialButtons } from "@/components/auth/social-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
const emailSchema = z.string().email();
export default function SignInPage() {
  const router = useRouter();
  const { signIn, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setNotice("");
    if (!emailSchema.safeParse(email.trim()).success) { setError("Enter a valid email address."); return; }
    setBusy(true);
    try { await signIn(email.trim(), password); router.replace(sessionStorage.getItem("sheiq-invitation") ? "/join" : "/dashboard"); }
    catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  }
  async function reset() {
    setError(""); setNotice("");
    if (!emailSchema.safeParse(email.trim()).success) { setError("Enter your email address above to reset your password."); return; }
    setResetBusy(true);
    try { await resetPassword(email.trim()); setNotice("If the account exists, a reset link has been sent."); }
    catch (err) { setError((err as Error).message); } finally { setResetBusy(false); }
  }
  return <div className="space-y-7">
    <div className="space-y-2"><p className="text-sm font-semibold text-primary">WELCOME BACK</p><h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Sign in to SHEiQpro</h2><p className="text-muted-foreground">Your safer workplace starts here.</p></div>
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-2"><label htmlFor="email" className="text-sm font-medium">Work email</label><Input id="email" type="email" autoComplete="email" placeholder="you@company.com" required value={email} onChange={e => setEmail(e.target.value)} className="h-12" /></div>
      <div className="space-y-2"><div className="flex items-center justify-between"><label htmlFor="password" className="text-sm font-medium">Password</label><button type="button" onClick={reset} disabled={resetBusy} className="text-xs font-semibold text-primary hover:underline">{resetBusy ? "Sending…" : "Forgot password?"}</button></div>
        <div className="relative"><Input id="password" type={show ? "text" : "password"} autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} className="h-12 pr-12" /><button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)} className="absolute inset-y-0 right-3 text-muted-foreground">{show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}{notice && <p role="status" className="text-sm text-emerald-600">{notice}</p>}
      <Button type="submit" disabled={busy} className="h-12 w-full text-base">{busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Sign in <ArrowRight className="ml-2 h-4 w-4" /></>}</Button>
    </form>
    <div className="flex items-center gap-4 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or continue with<span className="h-px flex-1 bg-border" /></div>
    <SocialButtons />
    <p className="text-center text-sm text-muted-foreground">New to SHEiQpro? <Link href="/sign-up" className="font-semibold text-primary hover:underline">Create an account</Link></p>
  </div>;
}
