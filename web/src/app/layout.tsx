import type { Metadata, Viewport } from 'next';
import { Inter, Assistant } from 'next/font/google';
import './globals.css';
import { I18nProvider } from '@/lib/i18n';
import { Footer } from '@/components/Footer';
import { HtmlAttributes } from '@/components/HtmlAttributes';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const assistant = Assistant({ subsets: ['hebrew'], variable: '--font-assistant', display: 'swap' });

export const metadata: Metadata = {
  title: {
    default: 'AccessiShield - Free Accessibility Scan & WCAG 2.1 Fix',
    template: '%s | AccessiShield',
  },
  description: 'Scan your website for free. Get instant WCAG 2.1 AA compliance report with exact code fixes. One-time payment of $55/200 ILS for full report + JS widget.',
  keywords: ['accessibility', 'WCAG', 'axe-core', 'compliance', 'screen reader', 'accessibility audit', 'web accessibility'],
  authors: [{ name: 'AccessiShield' }],
  creator: 'AccessiShield',
  publisher: 'AccessiShield',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://accessishield.io',
    siteName: 'AccessiShield',
    title: 'AccessiShield - Free Accessibility Scan & WCAG 2.1 Fix',
    description: 'Scan your website for free. Get instant WCAG 2.1 AA compliance report with exact code fixes.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AccessiShield - Accessibility Compliance Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AccessiShield - Free Accessibility Scan',
    description: 'Scan your website for free. Get instant WCAG 2.1 AA compliance report with exact code fixes.',
    images: ['/og-image.png'],
  },
  verification: {
    google: 'google-site-verification-code',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#020617' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://unpkg.com" />
      </head>
      <body className={`${inter.variable} ${assistant.variable} antialiased`}>
        <HtmlAttributes />
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
      </body>
    </html>
  );
}