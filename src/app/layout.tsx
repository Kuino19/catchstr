import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import "./globals.css";
import ProtectedRoute from "@/components/ProtectedRoute";

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "catchstr",
  description: "Football Talent Network",
};

import { ThemeProvider } from '@/components/ThemeProvider';
import LeftSidebar from '@/components/LeftSidebar';
import RightSidebar from '@/components/RightSidebar';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght@100..700,0..1&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`${lexend.variable} antialiased font-display min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ProtectedRoute>
            <div className="flex w-full min-h-screen">
              <LeftSidebar />
              <div className="flex-1 flex justify-center border-x border-slate-200 dark:border-slate-800">
                <main className="max-w-2xl w-full bg-white dark:bg-background-dark min-h-screen overflow-x-hidden">
                  {children}
                </main>
              </div>
              <RightSidebar />
            </div>
          </ProtectedRoute>
        </ThemeProvider>
      </body>
    </html>
  );
}
