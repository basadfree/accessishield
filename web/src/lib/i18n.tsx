'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Language = 'he' | 'en';

export const translations = {
  he: {
    nav: {
      home: 'בית',
      scanner: 'סריקה חינמית',
      pricing: 'מחיר',
      howItWorks: 'איך זה עובד',
      login: 'התחברות',
    },
    hero: {
      badge: 'תואם ת"י 5568 / WCAG 2.1',
      title: 'האתר שלך מפסיד לקוחות. וגם חשוף לתביעות.',
      subtitle: 'סריקה חינמית תוך 30 שניות מגלה בדיוק איפה הקוד שלך נכשל בנגישות - ונותן לך את התיקון המדויק ב-200 ש"ח בלבד.',
      ctaScan: 'סרוק את האתר שלי בחינם',
      ctaDemo: 'ראה דוח לדוגמה',
      trustText: 'אין צורך בכרטיס אשראי • תוצאות מיידיות • דוח טכני מלא',
    },
    scanner: {
      title: 'סריקת נגישות חינמית',
      subtitle: 'הכנס את כתובת האתר ותקבל תוך שניות דוח מפורט של 3 ההפרות החמורות ביותר',
      placeholder: 'https://your-site.co.il',
      button: 'התחל סריקה',
      scanning: 'סורק...',
      resultsTitle: 'תוצאות הסריקה',
      violationsFound: 'נמצאו {count} הפרות נגישות',
      noViolations: 'לא נמצאו הפרות - האתר שלך נגיש!',
      topViolations: 'ההפרות החמורות ביותר:',
      impactCritical: 'קריטי',
      impactSerious: 'חמור',
      impactModerate: 'בינוני',
      impactMinor: 'קל',
      viewFullReport: 'צפה בדוח המלא ותיקון',
      price: '200 ש"ח בלבד',
      or: 'או',
      priceUsd: '$55',
    },
    report: {
      title: 'דוח נגישות מלא',
      subtitle: 'הפתרון המדויק לכל הפרה שנמצאה',
      violationDetails: 'פרטי ההפרה',
      codeExample: 'דוגמת קוד בעייתי',
      fixCode: 'קוד מתוקן',
      jsWidget: 'ווידג\'ט תיקון ב-JS (שורה אחת)',
      downloadPdf: 'הורד PDF',
      copyWidget: 'העתק ווידג\'ט',
      widgetCopied: 'הועתק! הדבק ב-<head> של האתר',
    },
    pricing: {
      title: 'תמחור פשוט ושקוף',
      subtitle: 'ללא מנויים, ללא הפתעות. תשלום חד פעמי לדוח מלא + תיקון.',
      plan: {
        name: 'דוח נגישות מלא',
        price: '200',
        currency: 'ש"ח',
        features: [
          'סריקת axe-core מלאה (WCAG 2.1 AA)',
          'פירוט 10 ההפרות המובילות עם קוד',
          'קוד תיקון מדויק לכל הפרה',
          'ווידג\'ט JS בודד לתיקון דינמי',
          'דוח PDF מקצועי להורדה',
          'סקירות נוספות חינם למשך 3 חודשים',
        ],
        cta: 'קבל את הדוח שלי עכשיו',
      },
    },
    howItWorks: {
      title: 'איך זה עובד?',
      steps: [
        {
          number: '1',
          title: 'סריקה חינמית',
          desc: 'הכנס את ה-URL - נריץ axe-core על הדף ונמצא כל הפרה',
        },
        {
          number: '2',
          title: 'תוצאות מיידיות',
          desc: 'תראה את 3 ההפרות הכי חמורות עם צילומי קוד מדויקים',
        },
        {
          number: '3',
          title: 'תשלום מאובטח',
          desc: '200 ש"ח דרך PayPal - מקבלים דוח מלא + ווידג\'ט תיקון',
        },
        {
          number: '4',
          title: 'תיקון ויישום',
          desc: 'העתק את הקוד המתוקן או הדבק את הווידג\'ט - סיימת',
        },
      ],
    },
    footer: {
      brand: 'AccessiShield',
      tagline: 'נגישות זה לא אופציה. זה החוק.',
      links: {
        product: 'מוצר',
        scanner: 'סריקה חינמית',
        pricing: 'מחיר',
        api: 'API',
        company: 'חברה',
        about: 'אודות',
        blog: 'בלוג',
        careers: 'קריירה',
        legal: 'משפטי',
        privacy: 'פרטיות',
        terms: 'תנאים',
        accessibility: 'הצהרת נגישות',
      },
      copyright: '© 2024 AccessiShield. כל הזכויות שמורות.',
    },
    cta: {
      title: 'מוכן להפוך את האתר לנגיש?',
      subtitle: 'סריקה חינמית עכשיו, דוח מלא ב-200 ש"ח. בלי אותיות קטנות.',
      button: 'התחל סריקה חינמית',
    },
    common: {
      loading: 'טוען...',
      error: 'שגיאה',
      retry: 'נסה שוב',
      close: 'סגור',
      save: 'שמור',
      cancel: 'ביטול',
      confirm: 'אישור',
      copy: 'העתק',
      copied: 'הועתק!',
      download: 'הורד',
      share: 'שתף',
    },
  },
  en: {
    nav: {
      home: 'Home',
      scanner: 'Free Scan',
      pricing: 'Pricing',
      howItWorks: 'How It Works',
      login: 'Login',
    },
    hero: {
      badge: 'ISO 5568 / WCAG 2.1 Compliant',
      title: 'Your site is losing customers. And exposed to lawsuits.',
      subtitle: 'Free 30-second scan reveals exactly where your code fails accessibility - and gives you the precise fix for just $55.',
      ctaScan: 'Scan My Site Free',
      ctaDemo: 'View Sample Report',
      trustText: 'No credit card required • Instant results • Full technical report',
    },
    scanner: {
      title: 'Free Accessibility Scan',
      subtitle: 'Enter your URL and get a detailed report of the top 3 most severe violations in seconds',
      placeholder: 'https://your-site.com',
      button: 'Start Scan',
      scanning: 'Scanning...',
      resultsTitle: 'Scan Results',
      violationsFound: 'Found {count} accessibility violations',
      noViolations: 'No violations found - your site is accessible!',
      topViolations: 'Top violations:',
      impactCritical: 'Critical',
      impactSerious: 'Serious',
      impactModerate: 'Moderate',
      impactMinor: 'Minor',
      viewFullReport: 'View Full Report & Fix',
      price: 'Just $55',
      or: 'or',
      priceUsd: '200 ILS',
    },
    report: {
      title: 'Full Accessibility Report',
      subtitle: 'The precise fix for every violation found',
      violationDetails: 'Violation Details',
      codeExample: 'Problematic Code Example',
      fixCode: 'Fixed Code',
      jsWidget: 'JS Fix Widget (One Line)',
      downloadPdf: 'Download PDF',
      copyWidget: 'Copy Widget',
      widgetCopied: 'Copied! Paste into your site <head>',
    },
    pricing: {
      title: 'Simple, Transparent Pricing',
      subtitle: 'No subscriptions, no surprises. One-time payment for full report + fix.',
      plan: {
        name: 'Full Accessibility Report',
        price: '55',
        currency: 'USD',
        features: [
          'Full axe-core scan (WCAG 2.1 AA)',
          'Top 10 violations detailed with code',
          'Precise fix code for each violation',
          'Single-line JS widget for dynamic fix',
          'Professional PDF report download',
          'Free re-scans for 3 months',
        ],
        cta: 'Get My Report Now',
      },
    },
    howItWorks: {
      title: 'How It Works',
      steps: [
        {
          number: '1',
          title: 'Free Scan',
          desc: 'Enter your URL - we run axe-core and find every violation',
        },
        {
          number: '2',
          title: 'Instant Results',
          desc: 'See the 3 most severe violations with exact code snippets',
        },
        {
          number: '3',
          title: 'Secure Payment',
          desc: '$55 via PayPal - get full report + fix widget',
        },
        {
          number: '4',
          title: 'Fix & Deploy',
          desc: 'Copy the fixed code or paste the widget - done',
        },
      ],
    },
    footer: {
      brand: 'AccessiShield',
      tagline: 'Accessibility isn\'t optional. It\'s the law.',
      links: {
        product: 'Product',
        scanner: 'Free Scanner',
        pricing: 'Pricing',
        api: 'API',
        company: 'Company',
        about: 'About',
        blog: 'Blog',
        careers: 'Careers',
        legal: 'Legal',
        privacy: 'Privacy',
        terms: 'Terms',
        accessibility: 'Accessibility Statement',
      },
      copyright: '© 2024 AccessiShield. All rights reserved.',
    },
    cta: {
      title: 'Ready to make your site accessible?',
      subtitle: 'Free scan now, full report for $55. No fine print.',
      button: 'Start Free Scan',
    },
    common: {
      loading: 'Loading...',
      error: 'Error',
      retry: 'Try Again',
      close: 'Close',
      save: 'Save',
      cancel: 'Cancel',
      confirm: 'Confirm',
      copy: 'Copy',
      copied: 'Copied!',
      download: 'Download',
      share: 'Share',
    },
  },
} as const;

export type TranslationKey = keyof typeof translations.he;

export function getTranslation(lang: Language, key: string): string {
  const keys = key.split('.');
  let value: any = translations[lang];
  for (const k of keys) {
    value = value?.[k];
  }
  return value || key;
}

export function useTranslation() {
  const [lang, setLang] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const browserLang = navigator.language.startsWith('he') ? 'he' : 'en';
    setLang(browserLang);
  }, []);

  const t = (key: string) => getTranslation(lang, key);

  return { t, lang, setLang, mounted };
}

export const I18nContext = createContext<{
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
} | null>(null);

export function I18nProvider({ children, defaultLang = 'en' }: { children: ReactNode; defaultLang?: Language }) {
  const [lang, setLang] = useState<Language>(defaultLang);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const browserLang = navigator.language.startsWith('he') ? 'he' : 'en';
    setLang(browserLang);
  }, []);

  const t = (key: string) => getTranslation(lang, key);

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    return {
      lang: 'en' as Language,
      setLang: () => {},
      t: (key: string) => key,
    };
  }
  return context;
}