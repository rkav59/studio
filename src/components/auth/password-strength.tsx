"use client";
import { passwordChecks } from "@/lib/auth/password-policy";
import { Check, Circle } from "lucide-react";
export function PasswordStrength({ password }: { password: string }) {
  const checks = passwordChecks(password);
  const count = checks.filter(check => check.valid).length;
  return <div className="space-y-2" aria-live="polite">
    <div className="grid grid-cols-4 gap-1" aria-label={count === 4 ? "Password requirements met" : count + " of 4 password requirements met"}>
      {checks.map((check, i) => <span key={i} className={`h-1.5 rounded-full ${i < count ? "bg-emerald-500" : "bg-muted"}`} />)}
    </div>
    <ul className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
      {checks.map(check => <li key={check.label} className="flex items-center gap-1.5">{check.valid ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Circle className="h-3 w-3" />}{check.label}</li>)}
    </ul>
  </div>;
}
