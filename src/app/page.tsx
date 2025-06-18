
"use client"; // Required for using hooks like useAuth

import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';


export default function HomePage() {
  const { user, isAuthenticating } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticating) {
      if (user) {
        router.replace('/dashboard');
      } else {
        router.replace('/sign-in');
      }
    }
  }, [user, isAuthenticating, router]);

  // Show a loading state while determining auth status
  if (isAuthenticating) {
    return (
       <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <Skeleton className="h-16 w-16 mb-4 rounded-full" />
        <Skeleton className="h-10 w-48 mb-2" />
        <Skeleton className="h-6 w-64 mb-8" />
        <Skeleton className="h-10 w-full max-w-sm" />
      </div>
    );
  }

  return null; // Or a more sophisticated loading component
}
