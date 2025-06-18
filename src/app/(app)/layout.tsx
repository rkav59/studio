
"use client"; // Make this a client component to use hooks

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import AppLayoutInternal from '@/components/layout/app-layout'; // Renamed original
import { Skeleton } from '@/components/ui/skeleton';

// This is the protected layout for the main application routes
export default function ProtectedAppLayout({ children }: { children: ReactNode }) {
  const { user, isAuthenticating } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticating && !user) {
      router.replace('/sign-in');
    }
  }, [user, isAuthenticating, router]);

  if (isAuthenticating || !user) {
    // Show a loading state or a more sophisticated skeleton for the app layout
    return (
      <div className="flex min-h-screen">
        <Skeleton className="hidden md:block w-16 md:w-64 bg-sidebar" /> {/* Sidebar skeleton */}
        <div className="flex-1 flex flex-col">
          <Skeleton className="h-14 border-b bg-background/80" /> {/* Header skeleton */}
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <Skeleton className="h-32 w-full mb-6" />
            <Skeleton className="h-64 w-full" />
          </main>
        </div>
      </div>
    );
  }

  // If authenticated, render the actual app layout and children
  return <AppLayoutInternal>{children}</AppLayoutInternal>;
}
