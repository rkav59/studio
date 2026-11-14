import { cn } from '@/lib/utils';
import * as React from 'react';

export const SheiqproLogo = ({ className, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
  <img
    src="/sheiqpro-logo.png"
    alt="SHEiQpro"
    className={cn(className)}
    {...props}
  />
);
