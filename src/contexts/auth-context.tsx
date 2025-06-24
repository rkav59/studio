
"use client"; // Add this directive

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  User,
  getRedirectResult // Added for redirect flow
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc, getDoc } from 'firebase/firestore'; 
import type { UserProfile } from '@/lib/types';
import { useQuery } from '@tanstack/react-query'; 

interface AuthContextType { 
  user: User | null;
  isAuthenticating: boolean; 
  userProfile: UserProfile | null; 
  isLoadingProfile: boolean; 
  signUp: (email: string, password: string, displayName: string, country: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  updateUserDisplayName: (displayName: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

const USER_PROFILES_COLLECTION = 'userProfiles';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(true); 
  const { toast } = useToast();

  useEffect(() => {
    // This handles both initial auth state check and subsequent changes.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAuthenticating(false);
    });
    return () => unsubscribe();
  }, []);

  // This new useEffect handles the result of a sign-in redirect.
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        setIsAuthenticating(true); // Show loading while processing redirect
        const result = await getRedirectResult(auth);
        if (result) {
          // User successfully signed in or signed up via redirect.
          const user = result.user;
          const userProfileRef = doc(db, 'userProfiles', user.uid);
          const userProfileSnap = await getDoc(userProfileRef);

          if (!userProfileSnap.exists()) {
            // This is a new user signing up via social provider.
            const now = new Date();
            const organizationId = `org_${user.uid.substring(0, 8)}_${Date.now()}`;
            
            const userProfileData: Omit<UserProfile, 'id'> = {
              email: user.email || "",
              displayName: user.displayName || user.email?.split('@')[0] || "User",
              country: "Not Set", // Social sign-in doesn't provide this. User must set it.
              createdAt: now.toISOString(),
              organizationId: organizationId,
              role: 'admin',
              planId: 'premium', // Default to premium plan, no trial
            };
            await setDoc(userProfileRef, userProfileData);
            toast({
              title: 'Account Created',
              description: 'Welcome! All features are enabled.',
            });
            // The onAuthStateChanged listener will handle the redirect to the dashboard.
          } else {
            // This is a returning user.
            toast({
              title: 'Signed In Successfully',
              description: `Welcome back, ${user.displayName || user.email}!`,
            });
          }
        }
      } catch (error: any) {
        console.error("Redirect sign-in error:", error);
        toast({
          title: 'Sign In Failed',
          description: "Could not complete sign-in via redirect. Please try again.",
          variant: 'destructive',
        });
      } finally {
        setIsAuthenticating(false); // Finished processing, hide loading state
      }
    };

    handleRedirectResult();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run this check once on component mount.

  const { data: userProfile, isLoading: isLoadingProfile } = useQuery<UserProfile | null>({
    queryKey: [USER_PROFILES_COLLECTION, user?.uid],
    queryFn: async () => {
      if (!user?.uid) return null;
      const profileRef = doc(db, USER_PROFILES_COLLECTION, user.uid);
      const profileSnap = await getDoc(profileRef);
      return profileSnap.exists() ? { id: profileSnap.id, ...profileSnap.data() } as UserProfile : null;
    },
    enabled: !!user?.uid,
    staleTime: Infinity, 
    cacheTime: Infinity,
  });

  const signUp = async (email: string, password: string, displayName: string, country: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName });

      const userProfileRef = doc(db, 'userProfiles', user.uid);
      const now = new Date();
      const organizationId = `org_${user.uid.substring(0, 8)}_${Date.now()}`;

      const userProfileData: Omit<UserProfile, 'id'> = {
        email: user.email || "",
        displayName: displayName,
        country: country,
        createdAt: now.toISOString(),
        organizationId: organizationId,
        role: 'admin', 
        planId: 'premium', // Default to premium plan, no trial
      };
      await setDoc(userProfileRef, userProfileData);

      toast({
        title: 'Success',
        description: 'Account created successfully. All features are enabled.',
      });
    } catch (error: any) {
      console.error("Signup failed:", error);
      const userFriendlyMessage = error.code === 'auth/email-already-in-use'
        ? "This email address is already registered. Please sign in or use a different email."
        : "An unexpected error occurred during sign up. Please try again.";
      toast({
        title: 'Sign Up Failed',
        description: userFriendlyMessage,
        variant: 'destructive',
      });
      throw error; 
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: 'Success',
        description: 'Signed in successfully.',
      });
    } catch (error: any) {
       console.error("Signin failed:", error);
       const userFriendlyMessage = (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential')
        ? "Invalid email or password. Please try again."
        : "An unexpected error occurred during sign in. Please try again.";
      toast({
        title: 'Sign In Failed',
        description: userFriendlyMessage,
        variant: 'destructive',
      });
      throw error; 
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error("Signout failed:", error);
      toast({
        title: 'Error',
        description: "Failed to sign out. Please try again.",
        variant: 'destructive',
      });
    }
  };

  const updateUserDisplayName = async (displayName: string) => {
    if (!auth.currentUser) {
      toast({ title: "Not Authenticated", description: "You must be signed in to update your profile.", variant: "destructive" });
      return;
    }
    try {
      await updateProfile(auth.currentUser, { displayName: displayName });
      setUser({ ...auth.currentUser, displayName: displayName }); 
    } catch (error: any) {
      console.error("Failed to update display name:", error);
      toast({
        title: 'Error',
        description: "Failed to update display name. Please try again.",
        variant: 'destructive',
      });
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: 'Password Reset Email Sent',
        description: 'Please check your inbox for password reset instructions.',
      });
    } catch (error: any) {
      console.error("Failed to send password reset email:", error);
      const userFriendlyMessage = error.code === 'auth/user-not-found'
        ? "No account found with this email address."
        : "Failed to send password reset email. Please try again.";
      toast({
        title: 'Error',
        description: userFriendlyMessage,
        variant: 'destructive',
      });
      throw error; 
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticating,
    userProfile: userProfile || null,
    isLoadingProfile,
    signUp,
    signIn,
    signOutUser,
    updateUserDisplayName,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
