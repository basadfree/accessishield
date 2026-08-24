'use client';

import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { MousePointer, Search, CreditCard, CheckCircle } from 'lucide-react';

const icons = {
  1: MousePointer,
  2: Search,
  3: CreditCard,
  4: CheckCircle,
};

const stepsData = [
  { number: 1, titleKey: 'howItWorks.steps.0.title', descKey: 'howItWorks.steps.0.desc' },
  { number: 2, titleKey: 'howItWorks.steps.1.title', descKey: 'howItWorks.steps.1.desc' },
  { number: 3, titleKey: 'howItWorks.steps.2.title', descKey: 'howItWorks.steps.2.desc' },
  { number: 4, titleKey: 'howItWorks.steps.3.title', descKey: 'howItWorks.steps.3.desc' },
];

export function HowItWorks() {
  const { t, lang } = useI18n();

  return (
    <section id="how-it-works" className="py-20 lg:py-28 bg-gray-50 dark:bg-dark-900" aria-labelledby="howitworks-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 id="howitworks-title" className={cn(
            'text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4',
            lang === 'he' ? 'font-hebrew' : ''
          )}>
            {t('howItWorks.title')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stepsData.map((step, index) => {
            const Icon = icons[step.number as keyof typeof icons] || MousePointer;
            const isLast = index === stepsData.length - 1;
            
            return (
              <div key={step.number} className="relative">
                <div className="card h-full relative z-10">
                  <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-100 text-primary-600 dark:bg-primary-950/30 dark:text-primary-400 mb-6 mx-auto">
                    <Icon className="h-7 w-7" aria-hidden="true" />
                  </div>
                  
                  <div className="flex items-baseline gap-2 mb-4 justify-center">
                    <span className={cn(
                      'text-4xl font-bold text-primary-600 dark:text-primary-400',
                      lang === 'he' ? 'font-hebrew' : ''
                    )}>
                      {step.number}
                    </span>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {t(step.titleKey)}
                    </h3>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-400 text-center">
                    {t(step.descKey)}
                  </p>
                </div>

                {!isLast && (
                  <div className="hidden lg:block absolute top-14 left-full w-full h-0.5 bg-gradient-to-r from-primary-200 to-transparent dark:from-primary-800/30" aria-hidden="true" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}