"use client";
import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
export default function CallbackPage() {
  const [message, setMessage] = useState("Completing sign-in…");
  useEffect(() => {
    getSupabase()
      .auth.getSession()
      .then(({ data, error }) => {
        if (error) throw error;
        if (!data.session)
          throw new Error(
            "The sign-in link is invalid or expired. Return to sign-in and request a new link.",
          );
        const token = sessionStorage.getItem("sheiq-invitation");
        location.replace(
          token ? `/join?token=${encodeURIComponent(token)}` : "/dashboard",
        );
      })
      .catch((e) => setMessage(e.message));
  }, []);
  return <p role="status">{message}</p>;
}
