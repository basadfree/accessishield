'use client';

import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { ArrowRight, ShieldCheck, Zap, Eye } from 'lucide-react';

export function Hero() {
  const { t, lang } = useI18n();

  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden" aria-labelledby="hero-title">
      <div className="absolute inset-0 bg-gradient-to-b from-primary-50/50 via-transparent to-transparent dark:from-primary-950/20 dark:via-transparent" aria-hidden="true" />
      <div className="absolute inset-0 [background-image:radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary-100/50 via-transparent to-transparent dark:from-primary-900/20" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-1.5 text-sm font-medium text-primary-700 dark:bg-primary-950/30 dark:text-primary-300 mb-6 animate-in">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            <span>{t('hero.badge')}</span>
          </div>

          <h1 id="hero-title" className={cn(
            'text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-white mb-6 animate-in',
            lang === 'he' ? 'font-hebrew' : ''
          )}>
            {t('hero.title')}
          </h1>

          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-10 animate-in" style={{ animationDelay: '100ms' }}>
            {t('hero.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in" style={{ animationDelay: '200ms' }}>
            <a
              href="#scanner"
              className="group btn-primary text-base px-8 py-4 gap-3"
            >
              {t('hero.ctaScan')}
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </a>
            <a
              href="#demo"
              className="btn-outline text-base px-8 py-4"
            >
              {t('hero.ctaDemo')}
            </a>
          </div>

          <p className="mt-8 text-sm text-gray-500 dark:text-gray-400 animate-in" style={{ animationDelay: '300ms' }}>
            {t('hero.trustText')}
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 animate-in" style={{ animationDelay: '400ms' }}>
          <div className="card text-center group">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-100 text-primary-600 dark:bg-primary-950/30 dark:text-primary-400 mb-4 group-hover:scale-110 transition-transform">
              <Zap className="h-8 w-8" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">30 Second Scan</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">axe-core powered, zero setup</p>
          </div>
          <div className="card text-center group">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-100 text-green-600 dark:bg-green-950/30 dark:text-green-400 mb-4 group-hover:scale-110 transition-transform">
              <Eye className="h-8 w-8" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Exact Violations</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Code snippets + line numbers</p>
          </div>
          <div className="card text-center group">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-100 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400 mb-4 group-hover:scale-110 transition-transform">
              <ShieldCheck className="h-8 w-8" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">One-Line Fix</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">JS widget patches dynamically</p>
          </div>
        </div>
      </div>
    </section>
  );
}