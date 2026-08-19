"use client";

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
  getRedirectResult
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
const USER_PROFILES_COLLECTION = 'userProfiles';
const TRIAL_DAYS = 14;

function createTrialDates() {
  const start = new Date();
  const end = new Date(start);
  end.setDate(end.getDate() + TRIAL_DAYS);
  return {
    trialStartDate: start.toISOString(),
    trialEndDate: end.toISOString(),
  };
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

interface AuthProviderProps { children: ReactNode; }

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthenticating(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        setIsAuthenticating(true);
        const result = await getRedirectResult(auth);
        if (result) {
          const currentUser = result.user;
          const userProfileRef = doc(db, USER_PROFILES_COLLECTION, currentUser.uid);
          const userProfileSnap = await getDoc(userProfileRef);

          if (!userProfileSnap.exists()) {
            const now = new Date();
            const organizationId = `org_${currentUser.uid.substring(0, 8)}_${Date.now()}`;
            const { trialStartDate, trialEndDate } = createTrialDates();
            const userProfileData: Omit<UserProfile, 'id'> = {
              email: currentUser.email || '',
              displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
              country: 'Not Set',
              createdAt: now.toISOString(),
              organizationId,
              role: 'admin',
              planId: 'trial',
              trialStartDate,
              trialEndDate,
            };
            await setDoc(userProfileRef, userProfileData);
            toast({ title: 'Account Created', description: `Welcome! Your ${TRIAL_DAYS}-day trial has started.` });
          } else {
            toast({ title: 'Signed In Successfully', description: `Welcome back, ${currentUser.displayName || currentUser.email}!` });
          }
        }
      } catch (error) {
        console.error('Redirect sign-in error:', error);
        toast({ title: 'Sign In Failed', description: 'Could not complete sign-in via redirect. Please try again.', variant: 'destructive' });
      } finally {
        setIsAuthenticating(false);
      }
    };

    handleRedirectResult();
    // Redirect result is intentionally processed once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    gcTime: Infinity,
  });

  const signUp = async (email: string, password: string, displayName: string, country: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const currentUser = userCredential.user;
      await updateProfile(currentUser, { displayName });

      const userProfileRef = doc(db, USER_PROFILES_COLLECTION, currentUser.uid);
      const now = new Date();
      const organizationId = `org_${currentUser.uid.substring(0, 8)}_${Date.now()}`;
      const { trialStartDate, trialEndDate } = createTrialDates();
      const userProfileData: Omit<UserProfile, 'id'> = {
        email: currentUser.email || '',
        displayName,
        country,
        createdAt: now.toISOString(),
        organizationId,
        role: 'admin',
        planId: 'trial',
        trialStartDate,
        trialEndDate,
      };
      await setDoc(userProfileRef, userProfileData);

      toast({ title: 'Success', description: `Account created. Your ${TRIAL_DAYS}-day trial has started.` });
    } catch (error: any) {
      console.error('Signup failed:', error);
      const userFriendlyMessage = error.code === 'auth/email-already-in-use'
        ? 'This email address is already registered. Please sign in or use a different email.'
        : 'An unexpected error occurred during sign up. Please try again.';
      toast({ title: 'Sign Up Failed', description: userFriendlyMessage, variant: 'destructive' });
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: 'Success', description: 'Signed in successfully.' });
    } catch (error: any) {
      console.error('Signin failed:', error);
      const userFriendlyMessage = (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential')
        ? 'Invalid email or password. Please try again.'
        : 'An unexpected error occurred during sign in. Please try again.';
      toast({ title: 'Sign In Failed', description: userFriendlyMessage, variant: 'destructive' });
      throw error;
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Signout failed:', error);
      toast({ title: 'Error', description: 'Failed to sign out. Please try again.', variant: 'destructive' });
    }
  };

  const updateUserDisplayName = async (displayName: string) => {
    if (!auth.currentUser) {
      toast({ title: 'Not Authenticated', description: 'You must be signed in to update your profile.', variant: 'destructive' });
      return;
    }
    try {
      await updateProfile(auth.currentUser, { displayName });
      setUser({ ...auth.currentUser, displayName });
    } catch (error) {
      console.error('Failed to update display name:', error);
      toast({ title: 'Error', description: 'Failed to update display name. Please try again.', variant: 'destructive' });
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast({ title: 'Password Reset Email Sent', description: 'Please check your inbox for password reset instructions.' });
    } catch (error: any) {
      console.error('Failed to send password reset email:', error);
      const userFriendlyMessage = error.code === 'auth/user-not-found'
        ? 'No account found with this email address.'
        : 'Failed to send password reset email. Please try again.';
      toast({ title: 'Error', description: userFriendlyMessage, variant: 'destructive' });
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticating,
      userProfile: userProfile || null,
      isLoadingProfile,
      signUp,
      signIn,
      signOutUser,
      updateUserDisplayName,
      resetPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
