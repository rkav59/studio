
"use client";

import { Button } from "@/components/ui/button";
import { Chrome, Facebook } from "lucide-react"; // Using Chrome as a generic Google icon
import { signInWithRedirect, GoogleAuthProvider, FacebookAuthProvider } from "firebase/auth"; // Changed to signInWithRedirect
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface SocialButtonsProps {
  isSignUp?: boolean;
}

export function SocialButtons({ isSignUp = false }: SocialButtonsProps) {
  const { toast } = useToast();
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingFacebook, setLoadingFacebook] = useState(false);

  const handleSocialSignIn = async (provider: GoogleAuthProvider | FacebookAuthProvider) => {
    if (provider instanceof GoogleAuthProvider) setLoadingGoogle(true);
    if (provider instanceof FacebookAuthProvider) setLoadingFacebook(true);

    try {
      // This will navigate the user away from the app to the Google sign-in page.
      // The result is handled by getRedirectResult in AuthProvider after the user returns.
      await signInWithRedirect(auth, provider);
    } catch (error: any) {
      console.error("Social sign-in redirect initiation error:", error);
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (error.code) {
        switch (error.code) {
          case "auth/popup-blocked":
             errorMessage = "Popup blocked by browser. Please allow popups for this site.";
             break;
          default:
            errorMessage = "Failed to start sign-in process. Please try again later.";
        }
      }
      toast({
            title: 'Sign In Failed',
            description: errorMessage,
            variant: "destructive",
      });
      if (provider instanceof GoogleAuthProvider) setLoadingGoogle(false);
      if (provider instanceof FacebookAuthProvider) setLoadingFacebook(false);
    }
    // No router.push or success toast here, as the page redirects.
  };

  const handleGoogleSignIn = () => {
    const provider = new GoogleAuthProvider();
    handleSocialSignIn(provider);
  };

  const handleFacebookSignIn = () => {
    const provider = new FacebookAuthProvider();
    toast({
        title: "Facebook Sign-In (Note)",
        description: "Facebook sign-in requires prior setup in Firebase console and Facebook Developer portal. This is a client-side placeholder.",
        duration: 7000,
    });
  };

  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        className="w-full"
        onClick={handleGoogleSignIn}
        disabled={loadingGoogle || loadingFacebook}
      >
        {loadingGoogle ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Chrome className="mr-2 h-4 w-4" />
        )}
        {isSignUp ? "Sign up" : "Sign in"} with Google
      </Button>
      <Button
        variant="outline"
        className="w-full bg-blue-600 text-white hover:bg-blue-700"
        onClick={handleFacebookSignIn}
        disabled={true} // Disabling until implemented
      >
        {loadingFacebook ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Facebook className="mr-2 h-4 w-4" />
        )}
        {isSignUp ? "Sign up" : "Sign in"} with Facebook (Coming Soon)
      </Button>
    </div>
  );
}
