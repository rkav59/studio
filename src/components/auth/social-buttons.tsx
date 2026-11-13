"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSupabase } from "@/lib/supabase/client";
import { googleCallbackUrl } from "@/lib/auth/google-oauth";
import { useToast } from "@/hooks/use-toast";

export function SocialButtons({ isSignUp = false }: { isSignUp?: boolean }) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function signInWithGoogle() {
    if (loading) return;
    setLoading(true);
    try {
      const { data, error } = await getSupabase().auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: googleCallbackUrl(window.location.origin),
          queryParams: { prompt: "select_account" },
        },
      });
      if (error) throw error;
      if (!data.url) throw new Error("Google sign-in could not be started.");
      // Supabase redirects the browser to the Google consent screen.
    } catch (error) {
      toast({
        title: "Google sign-in unavailable",
        description: (error as Error).message,
        variant: "destructive",
      });
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="h-12 w-full gap-3 rounded-xl bg-white text-slate-800 hover:bg-slate-50"
      onClick={signInWithGoogle}
      disabled={loading}
      aria-label={isSignUp ? "Sign up with Google" : "Sign in with Google"}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.28 5.48-4.82 7.18l7.73 6C44.36 38.03 46.98 31.9 46.98 24.55z" />
          <path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.88.93 7.56 2.56 10.78l7.97-6.19z" />
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.73-6C30.03 37.64 27.29 38.5 24 38.5c-6.26 0-11.57-4.22-13.47-9.91l-7.97 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
      )}
      {loading ? "Connecting to Google…" : isSignUp ? "Sign up with Google" : "Continue with Google"}
    </Button>
  );
}
