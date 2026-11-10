"use client";
import { useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          if (password !== confirm) throw new Error("Passwords do not match.");
          const client = getSupabase();
          const { data, error: sessionError } = await client.auth.getSession();
          if (sessionError) throw sessionError;
          if (!data.session)
            throw new Error(
              "Open the latest password reset link from your email.",
            );
          const { error } = await client.auth.updateUser({ password });
          if (error) throw error;
          setMessage("Password updated. You can now return to SHEiQpro.");
        } catch (error) {
          setMessage((error as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2 className="text-xl font-semibold">Set a new password</h2>
      <Input
        aria-label="New password"
        type="password"
        minLength={8}
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="new-password"
      />
      <Input
        aria-label="Confirm new password"
        type="password"
        required
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        autoComplete="new-password"
      />
      <Button disabled={busy}>Update password</Button>
      <p role="status">{message}</p>
      <a href="/sign-in">Return to sign-in</a>
    </form>
  );
}
