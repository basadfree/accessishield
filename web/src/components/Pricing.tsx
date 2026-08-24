'use client';

import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Check, Shield, Code, FileText, Zap, RotateCcw } from 'lucide-react';

const featuresKeys = [
  'pricing.plan.features.0',
  'pricing.plan.features.1',
  'pricing.plan.features.2',
  'pricing.plan.features.3',
  'pricing.plan.features.4',
  'pricing.plan.features.5',
];

export function Pricing() {
  const { t, lang } = useI18n();

  return (
    <section id="pricing" className="py-20 lg:py-28 bg-white dark:bg-dark-950" aria-labelledby="pricing-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 id="pricing-title" className={cn(
            'text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4',
            lang === 'he' ? 'font-hebrew' : ''
          )}>
            {t('pricing.title')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            {t('pricing.subtitle')}
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="card relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-100 rounded-full blur-3xl opacity-50 dark:bg-primary-950/30" aria-hidden="true" />
            <div className="relative">
              <div className="text-center mb-8">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-sm font-medium dark:bg-primary-950/30 dark:text-primary-300">
                  <Zap className="h-4 w-4" aria-hidden="true" />
                  {lang === 'he' ? 'תשלום חד פעמי' : 'One-time payment'}
                </span>
              </div>

              <div className="text-center mb-8">
                <span className={cn(
                  'text-6xl sm:text-7xl font-bold',
                  lang === 'he' ? 'font-hebrew' : ''
                )}>
                  {t('pricing.plan.price')}
                </span>
                <span className="text-2xl font-medium text-gray-500 dark:text-gray-400 ml-1">
                  {t('pricing.plan.currency')}
                </span>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-8">
                {t('pricing.plan.name')}
              </h3>

              <ul className="space-y-4 mb-8" role="list">
                {featuresKeys.map((featureKey, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="text-gray-700 dark:text-gray-300">{t(featureKey)}</span>
                  </li>
                ))}
              </ul>

              <a
                href="#scanner"
                className="w-full btn-primary text-center py-4 text-lg"
              >
                {t('pricing.plan.cta')}
              </a>

              <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                <RotateCcw className="h-4 w-4 inline-block mr-1" aria-hidden="true" />
                {lang === 'he' ? 'סקירות נוספות חינם למשך 3 חודשים' : 'Free re-scans for 3 months'}
              </p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card text-center">
              <Shield className="h-10 w-10 text-primary-600 dark:text-primary-400 mx-auto mb-3" aria-hidden="true" />
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">WCAG 2.1 AA</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Full compliance scanning</p>
            </div>
            <div className="card text-center">
              <Code className="h-10 w-10 text-primary-600 dark:text-primary-400 mx-auto mb-3" aria-hidden="true" />
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Exact Fixes</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Line-by-line code patches</p>
            </div>
            <div className="card text-center">
              <FileText className="h-10 w-10 text-primary-600 dark:text-primary-400 mx-auto mb-3" aria-hidden="true" />
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">PDF Report</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Professional documentation</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}