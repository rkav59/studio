"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { z } from "zod";
import { useAuth } from "@/contexts/auth-context";
import { PasswordStrength } from "@/components/auth/password-strength";
import { strongPassword, passwordChecks } from "@/lib/auth/password-policy";
import { SocialButtons } from "@/components/auth/social-buttons";
import { Combobox } from "@/components/ui/combobox";
import { countries } from "@/lib/countries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
const schema = z.object({ fullName: z.string().trim().min(2), email: z.string().trim().email(), country: z.string().min(2), password: strongPassword, confirmPassword: z.string() }).refine(v => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords must match." });
export default function SignUpPage() {
  const router = useRouter(); const { signUp } = useAuth();
  const [step, setStep] = useState(1); const [fullName, setFullName] = useState(""); const [email, setEmail] = useState(""); const [country, setCountry] = useState("");
  const [password, setPassword] = useState(""); const [confirmPassword, setConfirmPassword] = useState(""); const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [notice, setNotice] = useState("");
  const validDetails = fullName.trim().length >= 2 && z.string().email().safeParse(email.trim()).success && country.length >= 2;
  const validPassword = passwordChecks(password).every(x => x.valid) && password === confirmPassword;
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError("");
    if (step === 1) { if (!validDetails) { setError("Complete your name, email and country to continue."); return; } setStep(2); return; }
    const checked = schema.safeParse({ fullName, email, country, password, confirmPassword });
    if (!checked.success) { setError(checked.error.issues[0]?.message ?? "Check your details."); return; }
    setBusy(true);
    try {
      const signedIn = await signUp(email.trim(), password, fullName.trim(), country);
      if (signedIn) router.replace(sessionStorage.getItem("sheiq-invitation") ? "/join" : "/welcome");
      else setNotice("Check your email to verify your account, then sign in to continue.");
    } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  }
  return <div className="space-y-6">
    <div className="space-y-2"><p className="text-sm font-semibold text-primary">CREATE YOUR WORKSPACE · STEP {step} OF 2</p><h2 className="text-3xl font-bold tracking-tight">{step === 1 ? "Let's get acquainted." : "Secure your account."}</h2><p className="text-muted-foreground">{step === 1 ? "A few details to personalise your SHEiQpro experience." : "Protect your workspace with a strong password."}</p></div>
    <div className="grid grid-cols-2 gap-2" aria-label={`Step ${step} of 2`}><span className="h-1.5 rounded-full bg-primary" /><span className={`h-1.5 rounded-full ${step === 2 ? "bg-primary" : "bg-muted"}`} /></div>
    {notice ? <div role="status" className="rounded-xl bg-emerald-500/10 p-5 text-sm"><Check className="mb-2 h-6 w-6 text-emerald-600" />{notice}<p className="mt-3"><Link href="/sign-in" className="font-semibold text-primary underline">Return to sign in</Link></p></div> :
    <form onSubmit={submit} className="space-y-4">
      {step === 1 ? <>
        <div className="space-y-2"><label htmlFor="fullName" className="text-sm font-medium">Full name</label><Input id="fullName" autoComplete="name" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" className="h-12" required /></div>
        <div className="space-y-2"><label htmlFor="email" className="text-sm font-medium">Work email</label><Input id="email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" className="h-12" required /></div>
        <div className="space-y-2"><label className="text-sm font-medium">Country of operation</label><Combobox options={countries} value={country} onChange={setCountry} placeholder="Select your country" searchPlaceholder="Search countries…" /></div>
      </> : <>
        <div className="space-y-2"><label htmlFor="password" className="text-sm font-medium">Create password</label><div className="relative"><Input id="password" type={show ? "text" : "password"} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} className="h-12 pr-12" required /><button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow(!show)} className="absolute inset-y-0 right-3 text-muted-foreground">{show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div><PasswordStrength password={password} /></div>
        <div className="space-y-2"><label htmlFor="confirmPassword" className="text-sm font-medium">Confirm password</label><Input id="confirmPassword" type={show ? "text" : "password"} autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="h-12" required />{confirmPassword && <p className={`text-xs ${password === confirmPassword ? "text-emerald-600" : "text-destructive"}`}>{password === confirmPassword ? "Passwords match" : "Passwords do not match"}</p>}</div>
      </>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-3">{step === 2 && <Button type="button" variant="outline" onClick={() => { setStep(1); setError(""); }} className="h-12"><ArrowLeft className="h-4 w-4" /><span className="sr-only">Back</span></Button>}<Button type="submit" disabled={busy || (step === 1 ? !validDetails : !validPassword)} className="h-12 flex-1">{busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <>{step === 1 ? "Continue" : "Create account"}<ArrowRight className="ml-2 h-4 w-4" /></>}</Button></div>
    </form>}
    {step === 1 && !notice && <><div className="flex items-center gap-4 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or sign up with<span className="h-px flex-1 bg-border" /></div><SocialButtons isSignUp /></>}
    <p className="text-center text-sm text-muted-foreground">Already have an account? <Link href="/sign-in" className="font-semibold text-primary hover:underline">Sign in</Link></p>
  </div>;
}
