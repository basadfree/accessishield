'use client';

import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Shield, Twitter, Github, Linkedin } from 'lucide-react';

export function Footer() {
  const { t, lang } = useI18n();

  return (
    <footer className="bg-gray-950 text-gray-300" role="contentinfo">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold text-white mb-4" aria-label="AccessiShield Home">
              <Shield className="h-8 w-8 text-primary-400" aria-hidden="true" />
              <span>{t('footer.brand')}</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              {t('footer.tagline')}
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Twitter">
                <Twitter className="h-5 w-5" aria-hidden="true" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="GitHub">
                <Github className="h-5 w-5" aria-hidden="true" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="LinkedIn">
                <Linkedin className="h-5 w-5" aria-hidden="true" />
              </a>
            </div>
          </div>

          <nav aria-label="Product links">
            <h4 className="font-semibold text-white mb-4">{t('footer.links.product')}</h4>
            <ul className="space-y-3">
              <li><Link href="#scanner" className="text-gray-400 hover:text-white transition-colors text-sm">{t('footer.links.scanner')}</Link></li>
              <li><Link href="#pricing" className="text-gray-400 hover:text-white transition-colors text-sm">{t('footer.links.pricing')}</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white transition-colors text-sm">{t('footer.links.api')}</Link></li>
            </ul>
          </nav>

          <nav aria-label="Company links">
            <h4 className="font-semibold text-white mb-4">{t('footer.links.company')}</h4>
            <ul className="space-y-3">
              <li><Link href="#" className="text-gray-400 hover:text-white transition-colors text-sm">{t('footer.links.about')}</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white transition-colors text-sm">{t('footer.links.blog')}</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white transition-colors text-sm">{t('footer.links.careers')}</Link></li>
            </ul>
          </nav>

          <nav aria-label="Legal links">
            <h4 className="font-semibold text-white mb-4">{t('footer.links.legal')}</h4>
            <ul className="space-y-3">
              <li><Link href="#" className="text-gray-400 hover:text-white transition-colors text-sm">{t('footer.links.privacy')}</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white transition-colors text-sm">{t('footer.links.terms')}</Link></li>
              <li><Link href="#" className="text-gray-400 hover:text-white transition-colors text-sm">{t('footer.links.accessibility')}</Link></li>
            </ul>
          </nav>
        </div>

        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            {t('footer.copyright')}
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>Made with accessibility in mind</span>
          </div>
        </div>
      </div>
    </footer>
  );
}