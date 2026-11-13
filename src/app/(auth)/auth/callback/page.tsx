"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { getSupabase } from "@/lib/supabase/client";
import { callbackError, postSignInPath } from "@/lib/auth/google-oauth";

export default function CallbackPage() {
  const [message, setMessage] = useState("Completing your sign-in…");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let disposed = false;
    async function completeSignIn() {
      // The Supabase browser client uses PKCE + detectSessionInUrl and
      // exchanges the callback code when it initializes. Do not exchange
      // the same one-time code a second time.
      if (callbackError(window.location.search, window.location.hash)) {
        throw new Error("Google sign-in was cancelled or could not be completed.");
      }

      const { data, error } = await getSupabase().auth.getSession();
      if (error) throw error;
      if (!data.session) {
        throw new Error("Sign-in could not be verified. Please try again.");
      }

      const invitationToken = sessionStorage.getItem("sheiq-invitation");
      window.location.replace(postSignInPath(invitationToken));
    }

    completeSignIn().catch((error: Error) => {
      if (!disposed) {
        setFailed(true);
        setMessage(error.message);
      }
    });

    return () => { disposed = true; };
  }, []);

  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-4 text-center" role="status">
      {!failed && <Loader2 className="h-7 w-7 animate-spin text-primary" aria-hidden="true" />}
      <p className={failed ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>{message}</p>
      {failed && (
        <Link href="/sign-in" className="text-sm font-semibold text-primary hover:underline">
          Return to sign in
        </Link>
      )}
    </div>
  );
}
