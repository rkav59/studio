
import type {Metadata} from 'next';
import './globals.css';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { Providers } from '@/components/layout/providers'; // Import the new Providers component

export const metadata: Metadata = {
  title: 'SHEiQpro - Safety, Health & Environment',
  description: 'Comprehensive SHE management platform by SHEiQpro',
  icons: {
    icon: '/sheiqpro-logo.png',
    apple: '/sheiqpro-logo.png',
  },
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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;650;700;750;800&display=swap" rel="stylesheet" />
        
      </head>
      <body className="font-body antialiased">
        {/* Tailwind v3 emits an unlayered reset; a named MUI layer loses to it. */}
        <AppRouterCacheProvider options={{ enableCssLayer: false }}>
        <Providers>
          {children}
        </Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
