"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { getSupabase, db } from "@/lib/supabase/client";
import { doc, getDoc } from "@/lib/supabase/records";
import { useToast } from "@/hooks/use-toast";
import type { UserProfile } from "@/lib/types";

export type AppUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};
const toAppUser = (u: User | null): AppUser | null =>
  u
    ? {
        uid: u.id,
        email: u.email ?? null,
        displayName:
          u.user_metadata.displayName ?? u.user_metadata.full_name ?? null,
        photoURL: u.user_metadata.avatar_url ?? null,
      }
    : null;
interface AuthContextType {
  user: AppUser | null;
  isAuthenticating: boolean;
  userProfile: UserProfile | null;
  isLoadingProfile: boolean;
  signUp: (
    email: string,
    password: string,
    displayName: string,
    country: string,
  ) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  updateUserDisplayName: (name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export function useAuth() {
  const c = useContext(AuthContext);
  if (!c) throw new Error("AuthProvider is required");
  return c;
}
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const previousUser = useRef<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  useEffect(() => {
    let disposed = false;
    const apply = (u: User | null) => {
      if (disposed) return;
      if (previousUser.current !== (u?.id ?? null)) {
        queryClient.clear();
        previousUser.current = u?.id ?? null;
      }
      setUser(toAppUser(u));
      setIsAuthenticating(false);
    };
    try {
      const client = getSupabase();
      const {
        data: { subscription },
      } = client.auth.onAuthStateChange((_event, session) =>
        apply(session?.user ?? null),
      );
      client.auth
        .getSession()
        .then(({ data, error }) => {
          if (error) throw error;
          apply(data.session?.user ?? null);
        })
        .catch((error: Error) => {
          if (!disposed) {
            apply(null);
            toast({
              title: "Sign-in unavailable",
              description: error.message,
              variant: "destructive",
            });
          }
        });
      return () => {
        disposed = true;
        subscription.unsubscribe();
      };
    } catch (error) {
      setIsAuthenticating(false);
      toast({
        title: "Configuration required",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  }, [queryClient, toast]);
  const { data: userProfile, isLoading: isLoadingProfile } =
    useQuery<UserProfile | null>({
      queryKey: ["userProfiles", user?.uid],
      queryFn: async () => {
        if (!user) return null;
        const profile = await getDoc(doc(db, "userProfiles", user.uid));
        if (!profile.exists())
          throw new Error(
            "Your membership is unavailable. Contact your administrator.",
          );
        return { ...profile.data(), id: profile.id } as UserProfile;
      },
      enabled: !!user,
      staleTime: 30_000,
      retry: false,
    });
  async function report<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      toast({
        title: "Account action failed",
        description: (error as Error).message,
        variant: "destructive",
      });
      throw error;
    }
  }
  const signUp = (
    email: string,
    password: string,
    displayName: string,
    country: string,
  ) =>
    report(async () => {
      const { data, error } = await getSupabase().auth.signUp({
        email,
        password,
        options: {
          data: { displayName, country },
          emailRedirectTo: `${location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      toast({
        title: data.session ? "Account created" : "Check your email",
        description: data.session
          ? "Welcome to SHEiQpro."
          : "Confirm your email address, then sign in to continue.",
      });
      return !!data.session;
    });
  const signIn = (email: string, password: string) =>
    report(async () => {
      const { error } = await getSupabase().auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    });
  const signOutUser = () =>
    report(async () => {
      const { error } = await getSupabase().auth.signOut();
      if (error) throw error;
      queryClient.clear();
      setUser(null);
    });
  const updateUserDisplayName = (displayName: string) =>
    report(async () => {
      const { data, error } = await getSupabase().auth.updateUser({
        data: { displayName },
      });
      if (error) throw error;
      setUser(toAppUser(data.user));
    });
  const resetPassword = (email: string) =>
    report(async () => {
      const { error } = await getSupabase().auth.resetPasswordForEmail(email, {
        redirectTo: `${location.origin}/reset-password`,
      });
      if (error) throw error;
      toast({
        title: "Check your email",
        description:
          "If an account exists, you will receive password reset instructions.",
      });
    });
  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticating,
        userProfile: userProfile ?? null,
        isLoadingProfile: !!user && isLoadingProfile,
        signUp,
        signIn,
        signOutUser,
        updateUserDisplayName,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
