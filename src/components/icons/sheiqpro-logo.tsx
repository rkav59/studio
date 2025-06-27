import Image from 'next/image';
import * as React from 'react';
import { cn } from '@/lib/utils';

export const SheiqproLogo = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("relative", className)} {...props}>
    <Image
      src="/sheiqpro-logo.png"
      alt="SHEiQpro Logo"
      fill
      style={{ objectFit: 'contain' }}
      priority
    />
  </div>
);
