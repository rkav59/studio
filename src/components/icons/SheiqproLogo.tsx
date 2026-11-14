import * as React from 'react';

export const SheiqproLogo = ({ className, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
  <img
    src="/sheiqpro-logo.png"
    alt="SHEiQpro"
    className={className}
    {...props}
  />
);
