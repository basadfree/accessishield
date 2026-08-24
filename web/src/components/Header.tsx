'use client';

import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export function Header() {
  const { t } = useI18n();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-dark-950/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold text-primary-600 dark:text-primary-400" aria-label="AccessiShield Home">
            <svg className="h-8 w-8" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <rect width="32" height="32" rx="8" className="fill-primary-600" />
              <path d="M16 8L8 16l8 8 8-8-8-8z" className="fill-white" />
              <path d="M16 10.5L11.5 15l4.5 4.5L20.5 15 16 10.5z" className="fill-primary-600" />
            </svg>
            <span>AccessiShield</span>
          </Link>

          <div className="hidden md:flex md:items-center md:gap-8">
            <Link href="/" className="text-sm font-medium text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 transition-colors">
              {t('nav.home')}
            </Link>
            <Link href="#scanner" className="text-sm font-medium text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 transition-colors">
              {t('nav.scanner')}
            </Link>
            <Link href="#pricing" className="text-sm font-medium text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 transition-colors">
              {t('nav.pricing')}
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 transition-colors">
              {t('nav.howItWorks')}
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="#scanner"
              className="hidden sm:inline-flex btn-primary"
            >
              {t('nav.scanner')}
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}