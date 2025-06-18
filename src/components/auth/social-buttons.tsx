
"use client";

import { Button } from "@/components/ui/button";
import { Chrome, Facebook } from "lucide-react"; // Using Chrome as a generic Google icon
import { signInWithPopup, GoogleAuthProvider, FacebookAuthProvider, type UserCredential } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface SocialButtonsProps {
  isSignUp?: boolean;
}

export function SocialButtons({ isSignUp = false }: SocialButtonsProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingFacebook, setLoadingFacebook] = useState(false);

  const handleSocialSignIn = async (provider: GoogleAuthProvider | FacebookAuthProvider) => {
    if (provider instanceof GoogleAuthProvider) setLoadingGoogle(true);
    if (provider instanceof FacebookAuthProvider) setLoadingFacebook(true);

    try {
      const result: UserCredential = await signInWithPopup(auth, provider);
      // User is signed in.
      toast({
        title: "Signed In Successfully",
        description: `Welcome, ${result.user.displayName || result.user.email}!`,
      });
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Social sign-in error:", error);
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (error.code) {
        switch (error.code) {
          case "auth/account-exists-with-different-credential":
            errorMessage = "An account already exists with the same email address but different sign-in credentials. Try signing in with the original method.";
            break;
          case "auth/popup-closed-by-user":
            errorMessage = "Sign-in popup was closed. Please try again.";
            break;
          case "auth/cancelled-popup-request":
             errorMessage = "Sign-in popup request was cancelled. Please try again.";
            break;
          case "auth/popup-blocked":
             errorMessage = "Popup blocked by browser. Please allow popups for this site.";
             break;
          default:
            errorMessage = error.message || "Failed to sign in with social provider.";
        }
      }
      toast({
        title: "Sign In Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      if (provider instanceof GoogleAuthProvider) setLoadingGoogle(false);
      if (provider instanceof FacebookAuthProvider) setLoadingFacebook(false);
    }
  };

  const handleGoogleSignIn = () => {
    const provider = new GoogleAuthProvider();
    handleSocialSignIn(provider);
  };

  const handleFacebookSignIn = () => {
    const provider = new FacebookAuthProvider();
    // Note: Facebook login requires extensive setup on developer.facebook.com
    // and enabling it in Firebase console with App ID and App Secret.
    // This client-side code assumes that setup is complete.
    toast({
        title: "Facebook Sign-In (Note)",
        description: "Facebook sign-in requires prior setup in Firebase console and Facebook Developer portal. This is a client-side placeholder.",
        duration: 7000,
    });
    // handleSocialSignIn(provider); // Uncomment when Facebook setup is done
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
        disabled={loadingGoogle || loadingFacebook}
      >
        {loadingFacebook ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Facebook className="mr-2 h-4 w-4" />
        )}
        {isSignUp ? "Sign up" : "Sign in"} with Facebook
      </Button>
    </div>
  );
}
