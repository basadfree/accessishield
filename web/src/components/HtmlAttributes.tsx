'use client';

import { useEffect } from 'react';
import { useI18n } from '@/lib/i18n';

export function HtmlAttributes() {
  const { lang } = useI18n();

  useEffect(() => {
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  return null;
}