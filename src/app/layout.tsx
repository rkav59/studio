
import type {Metadata} from 'next';
import './globals.css';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { Providers } from '@/components/layout/providers'; // Import the new Providers component

export const metadata: Metadata = {
  title: 'SHEiQpro - Safety, Health & Environment',
  description: 'Comprehensive SHE management platform by SHEiQpro',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        
      </head>
      <body className="font-body antialiased">
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
        <Providers>
          {children}
        </Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
