'use client';

import { useEffect, useState, ReactNode } from 'react';
import { I18nProvider } from '@/lib/i18n';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

interface ClientLayoutProps {
  children: ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <html lang="en" suppressHydrationWarning>
        <head />
        <body className="min-h-screen bg-white dark:bg-dark-950">
          <div className="flex h-screen items-center justify-center">
            <div className="text-center">
              <div className="h-12 w-12 animate-spin border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading...</p>
            </div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <I18nProvider>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 btn-primary">
        Skip to main content
      </a>
      <Header />
      <main id="main-content" className="min-h-screen">
        {children}
      </main>
      <Footer />
    </I18nProvider>
  );
}