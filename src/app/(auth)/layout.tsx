
import type { ReactNode } from 'react';
import { ShieldCheck } from 'lucide-react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <main className="flex flex-1 flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="flex flex-col items-center text-center">
            <ShieldCheck className="h-16 w-16 text-primary mb-4" />
            <h1 className="text-4xl font-bold text-foreground font-headline">SHEiQpro</h1>
            <p className="text-muted-foreground mt-2">
              Safety, Health & Environmental Management Platform
            </p>
          </div>
          
          {children}

        </div>
      </main>
       <footer className="py-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} SHEiQpro Platform. All rights reserved.
        </footer>
    </div>
  );
}
