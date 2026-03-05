import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from '@/components/ThemeProvider';
import { Analytics } from '@vercel/analytics/react';
import { Toaster } from 'react-hot-toast';

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "catchstr | Football Talent Network",
  description: "Connect with agents, scouts, and players. The premium platform for football career growth and highlight sharing.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192x192.png",
    apple: "/icon-192x192.png",
  },
  openGraph: {
    type: 'website',
    siteName: 'catchstr',
    title: 'catchstr | Football Talent Network',
    description: 'Connect with agents, scouts, and players. The premium platform for football career growth and highlight sharing.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'catchstr' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'catchstr | Football Talent Network',
    description: 'Connect with agents, scouts, and players.',
    images: ['/og-image.png'],
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
        {/* Single Material Symbols request covering all axes — wght, FILL, GRAD, opsz */}
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body
        className={`${lexend.variable} antialiased font-display min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Analytics />
          <Toaster
            position="bottom-center"
            toastOptions={{
              duration: 3500,
              style: {
                fontFamily: 'var(--font-lexend, sans-serif)',
                fontWeight: 600,
                borderRadius: '16px',
                padding: '12px 18px',
                fontSize: '14px',
              },
              success: {
                iconTheme: { primary: '#22c55e', secondary: '#fff' },
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: '#fff' },
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
