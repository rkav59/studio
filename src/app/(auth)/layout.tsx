
import type { ReactNode } from 'react';
import { ShieldCheck } from 'lucide-react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-sm">
          {children}
        </div>
      </div>
      <div className="hidden bg-muted lg:flex flex-col items-center justify-center p-10 text-center relative">
        <div className="flex flex-col items-center">
            <ShieldCheck className="h-24 w-24 text-primary mb-6" />
            <h1 className="text-5xl font-bold text-foreground font-headline">SHEild</h1>
            <p className="text-muted-foreground mt-4 text-xl max-w-md">
              Your Proactive Partner in Workplace Safety.
            </p>
            <p className="text-muted-foreground mt-2 text-base max-w-lg">
              Streamline compliance, mitigate risks, and foster a culture of safety with our intelligent management platform.
            </p>
        </div>
         <footer className="absolute bottom-8 text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} SHEild Platform. All rights reserved.
         </footer>
      </div>
    </div>
  );
}
