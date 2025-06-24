

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
  User
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { add } from 'date-fns';

interface AuthContextType { // Renamed for clarity
  user: User | null;
  isAuthenticating: boolean; // Changed from isLoading to be more specific
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

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(true); // Start as true
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAuthenticating(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName: string, country: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName });
      setUser({ ...user, displayName }); // Update local state immediately

      // Create user profile in Firestore with trial period
      const userProfileRef = doc(db, 'userProfiles', user.uid);
      const now = new Date();
      const trialEndDate = add(now, { days: 14 });

      const userProfileData: Omit<UserProfile, 'id'> = {
        email: user.email || "",
        displayName: displayName,
        country: country,
        createdAt: now.toISOString(),
        planId: 'trial',
        trialStartDate: now.toISOString(),
        trialEndDate: trialEndDate.toISOString(),
      };
      await setDoc(userProfileRef, userProfileData);

      toast({
        title: 'Success',
        description: 'Account created successfully. Your 14-day trial has begun!',
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
      throw error; // Re-throw for form to handle
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
      throw error; // Re-throw for form to handle
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
      // No toast needed here as the user is redirected immediately
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
      setUser({ ...auth.currentUser, displayName: displayName }); // Update local state
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
      throw error; // Re-throw for form to handle
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticating,
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
