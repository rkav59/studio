
import type { ReactNode } from 'react';
import { SheiqproLogo } from '@/components/icons/sheiqpro-logo';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col bg-background overflow-hidden">
      {/* Background Illustrations */}
      <div
        className="absolute top-0 -left-20 w-96 h-96 bg-primary/30 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob"
        style={{ animationDelay: '0s' }}
      ></div>
      <div
        className="absolute top-0 -right-20 w-96 h-96 bg-accent/30 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob"
        style={{ animationDelay: '2s' }}
      ></div>
      <div
        className="absolute -bottom-8 left-20 w-96 h-96 bg-primary/40 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob"
        style={{ animationDelay: '4s' }}
      ></div>
      
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex flex-col items-center text-center">
            <SheiqproLogo className="h-16 w-16 text-primary mb-4" />
            <h1 className="text-4xl font-bold text-foreground font-headline">SHEiQpro</h1>
            <p className="text-muted-foreground mt-2">
              Safety, Health & Environmental Management Platform
            </p>
          </div>
          
          {children}

        </div>
      </main>
       <footer className="relative z-10 py-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} SHEiQpro Platform. All rights reserved.
        </footer>
    </div>
  );
}
