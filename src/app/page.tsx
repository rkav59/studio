
"use client"; // Required for using hooks like useAuth

import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { SheiqproLogo } from '@/components/icons/sheiqpro-logo';

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
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <SheiqproLogo className="h-24 w-24 text-primary animate-pulse" />
        <p className="mt-4 text-muted-foreground">Authenticating...</p>
      </div>
    );
  }

  return null; // Or a more sophisticated loading component
}
