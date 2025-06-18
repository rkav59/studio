
import type { ReactNode } from 'react';
import Image from 'next/image';
import { ShieldCheck } from 'lucide-react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary p-4">
      <div className="mb-8 flex flex-col items-center">
        <ShieldCheck className="h-16 w-16 text-primary mb-3" />
        <h1 className="text-4xl font-bold text-foreground font-headline">SHEild</h1>
        <p className="text-muted-foreground">Safety, Health & Environment Management</p>
      </div>
      <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-xl sm:p-8">
        {children}
      </div>
       <footer className="mt-8 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} SHEild Platform. All rights reserved.
      </footer>
    </div>
  );
}
