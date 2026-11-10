"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getSupabase } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
export function SocialButtons({ isSignUp = false }: { isSignUp?: boolean }) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  async function signIn(provider: "google" | "facebook") {
    setLoading(true);
    try {
      const { error } = await getSupabase().auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch (error) {
      toast({
        title: "Social sign-in failed",
        description: (error as Error).message,
        variant: "destructive",
      });
      setLoading(false);
    }
  }
  return (
    <div className="grid grid-cols-2 gap-3">
      <Button
        variant="outline"
        disabled={loading}
        onClick={() => signIn("google")}
      >
        Google
      </Button>
      <Button
        variant="outline"
        disabled={loading}
        onClick={() => signIn("facebook")}
      >
        Facebook
      </Button>
    </div>
  );
}
