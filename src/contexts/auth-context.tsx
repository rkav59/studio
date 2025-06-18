
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { type User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticating: boolean; // More specific loading for auth state check
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(true); // Start as true
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthenticating(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthenticating) {
      const isAuthPage = pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up');
      if (user && isAuthPage) {
        router.push('/dashboard');
      } else if (!user && !isAuthPage && pathname !== '/') { // Allow '/' for initial redirect logic
        router.push('/sign-in');
      }
    }
  }, [user, isAuthenticating, pathname, router]);


  if (isAuthenticating && !pathname.startsWith('/sign-in') && !pathname.startsWith('/sign-up') && pathname !== '/') {
    // Display a full-page skeleton loader or similar for protected routes while authenticating
    // This prevents flashing of content if not using a specific (auth) layout for these.
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <Skeleton className="h-12 w-1/2 mb-6" />
        <Skeleton className="h-8 w-3/4 mb-4" />
        <Skeleton className="h-8 w-3/4 mb-4" />
        <Skeleton className="h-10 w-1/3 mt-6" />
      </div>
    );
  }


  return (
    <AuthContext.Provider value={{ user, loading: isAuthenticating, isAuthenticating }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
