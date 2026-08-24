'use client';

import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

export function CTA() {
  const { t, lang } = useI18n();

  return (
    <section className="py-20 lg:py-28 bg-primary-600 dark:bg-primary-700" aria-labelledby="cta-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 id="cta-title" className={cn(
          'text-3xl sm:text-4xl font-bold text-white mb-4',
          lang === 'he' ? 'font-hebrew' : ''
        )}>
          {t('cta.title')}
        </h2>
        <p className="text-primary-100 text-lg max-w-2xl mx-auto mb-8">
          {t('cta.subtitle')}
        </p>
        <a
          href="#scanner"
          className="inline-flex items-center gap-2 bg-white text-primary-600 hover:bg-primary-50 px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
        >
          {t('cta.button')}
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}