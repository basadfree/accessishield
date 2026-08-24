import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: 'ILS' | 'USD' = 'ILS', lang: 'he' | 'en' = 'he'): string {
  if (currency === 'ILS') {
    return lang === 'he' ? `₪${amount.toLocaleString('he-IL')}` : `₪${amount.toLocaleString('en-US')}`;
  }
  return lang === 'he' ? `$${amount.toLocaleString('he-IL')}` : `$${amount.toLocaleString('en-US')}`;
}

export function getImpactColor(impact: string): string {
  switch (impact) {
    case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
    case 'serious': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400';
    case 'moderate': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'minor': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
    default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400';
  }
}

export function getImpactLabel(impact: string, lang: 'he' | 'en'): string {
  const labels = {
    he: { critical: 'קריטי', serious: 'חמור', moderate: 'בינוני', minor: 'קל' },
    en: { critical: 'Critical', serious: 'Serious', moderate: 'Moderate', minor: 'Minor' },
  };
  return labels[lang][impact as keyof typeof labels.he] || impact;
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function generateReportUrl(domain: string): string {
  const base = process.env.NEXT_PUBLIC_REPORT_BASE_URL || 'https://accessishield.io/report';
  return `${base}/${domain}`;
}

export function extractDomain(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].split('?')[0];
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function debounce<T extends (...args: any[]) => any>(fn: T, ms: number): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
}