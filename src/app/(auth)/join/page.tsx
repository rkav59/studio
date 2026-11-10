"use client";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/auth-context";
import { getSupabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
export default function JoinPage() {
  const { user, isAuthenticating } = useAuth();
  const queryClient = useQueryClient();
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const t =
      new URLSearchParams(location.search).get("token") ||
      sessionStorage.getItem("sheiq-invitation") ||
      "";
    setToken(t);
    if (t) sessionStorage.setItem("sheiq-invitation", t);
  }, []);
  async function accept() {
    setBusy(true);
    try {
      const { error } = await getSupabase().rpc("accept_invitation", { token });
      if (error) throw error;
      sessionStorage.removeItem("sheiq-invitation");
      queryClient.clear();
      location.replace("/dashboard");
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Join your organisation</h2>
      <p>
        Sign in using the verified email address that received this invitation.
      </p>
      {isAuthenticating ? (
        <p>Checking sign-in…</p>
      ) : user ? (
        <Button disabled={!token || busy} onClick={accept}>
          Accept invitation
        </Button>
      ) : (
        <div className="flex gap-4">
          <a href="/sign-in">Sign in</a>
          <a href="/sign-up">Create account</a>
        </div>
      )}
      <p role="status">
        {message || (!token ? "Open your invitation link to continue." : "")}
      </p>
    </div>
  );
}
