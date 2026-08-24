'use client';

import { useState, FormEvent } from 'react';
import { useI18n } from '@/lib/i18n';
import { cn, isValidUrl, extractDomain, generateReportUrl } from '@/lib/utils';
import { Loader2, AlertCircle, CheckCircle, ChevronRight, Eye, Code, Download, ShieldCheck } from 'lucide-react';

interface Violation {
  id: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  description: string;
  help: string;
  helpUrl: string;
  nodes: Array<{
    html: string;
    target: string[];
    failureSummary: string;
  }>;
  tags: string[];
}

interface ScanResult {
  url: string;
  violationsCount: number;
  violations: Violation[];
  incompleteCount: number;
  passesCount: number;
  scanDurationMs: number;
  error?: string;
}

export function Scanner() {
  const { t, lang } = useI18n();
  const [url, setUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedViolation, setExpandedViolation] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!isValidUrl(url)) {
      setError('Please enter a valid URL (including https://)');
      return;
    }

    setIsScanning(true);
    setResult(null);

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Scan failed');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const getImpactBadge = (impact: string) => (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
      impact === 'critical' && 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      impact === 'serious' && 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      impact === 'moderate' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      impact === 'minor' && 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    )}>
      {impact.charAt(0).toUpperCase() + impact.slice(1)}
    </span>
  );

  return (
    <section id="scanner" className="py-20 lg:py-28 bg-gray-50 dark:bg-dark-900" aria-labelledby="scanner-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 id="scanner-title" className={cn(
            'text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4',
            lang === 'he' ? 'font-hebrew' : ''
          )}>
            {t('scanner.title')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            {t('scanner.subtitle')}
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="card space-y-6">
            <div>
              <label htmlFor="url" className="label">
                {t('scanner.placeholder')}
              </label>
              <div className="relative">
                <input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://your-site.co.il"
                  className="input pr-12"
                  disabled={isScanning}
                  aria-describedby="url-help"
                />
                <button
                  type="submit"
                  disabled={isScanning || !url.trim()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 btn-primary px-4 py-2 text-sm"
                  aria-label={isScanning ? t('scanner.scanning') : t('scanner.button')}
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      <span>{t('scanner.scanning')}</span>
                    </>
                  ) : (
                    t('scanner.button')
                  )}
                </button>
              </div>
              <p id="url-help" className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                {t('scanner.placeholder')}
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-900/30 dark:text-red-400" role="alert">
                <AlertCircle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            {result && (
              <div className="space-y-6 pt-6 border-t border-gray-200 dark:border-gray-700 animate-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {t('scanner.resultsTitle')}
                  </h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Scanned in {result.scanDurationMs}ms
                  </span>
                </div>

                {result.violationsCount === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 dark:bg-green-950/30 dark:text-green-400 mb-4">
                      <CheckCircle className="h-8 w-8" aria-hidden="true" />
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      {t('scanner.noViolations')}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      Your site passes all WCAG 2.1 AA checks!
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-primary-50 border border-primary-200 dark:bg-primary-950/30 dark:border-primary-900/30">
                      <AlertCircle className="h-6 w-6 text-primary-600 dark:text-primary-400 flex-shrink-0" aria-hidden="true" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {t('scanner.violationsFound').replace('{count}', result.violationsCount.toString())}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t('scanner.topViolations')}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4" role="list" aria-label="Top accessibility violations">
                      {result.violations.slice(0, 3).map((violation, index) => (
                        <div
                          key={violation.id}
                          className="card relative overflow-hidden"
                          role="listitem"
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                              style={{ backgroundColor: 
                                violation.impact === 'critical' ? '#ef4444' :
                                violation.impact === 'serious' ? '#f97316' :
                                violation.impact === 'moderate' ? '#eab308' : '#3b82f6'
                              }}
                            >
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                                  {violation.id}
                                </h4>
                                {getImpactBadge(violation.impact)}
                              </div>
                              <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                                {violation.description}
                              </p>
                              <button
                                onClick={() => setExpandedViolation(expandedViolation === violation.id ? null : violation.id)}
                                className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                                aria-expanded={expandedViolation === violation.id}
                                aria-controls={`violation-${violation.id}`}
                              >
                                {expandedViolation === violation.id ? (
                                  <>
                                    <ChevronRight className="h-4 w-4 rotate-90 transition-transform" aria-hidden="true" />
                                    {lang === 'he' ? 'הצג פחות' : 'Show less'}
                                  </>
                                ) : (
                                  <>
                                    <ChevronRight className="h-4 w-4 transition-transform" aria-hidden="true" />
                                    {lang === 'he' ? 'פרטים ותיקון' : 'Details & Fix'}
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          {expandedViolation === violation.id && (
                            <div id={`violation-${violation.id}`} className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 animate-in space-y-4">
                              <div>
                                <h5 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                  <Code className="h-4 w-4" aria-hidden="true" />
                                  {t('report.codeExample')}
                                </h5>
                                <pre className="bg-gray-950 rounded-lg p-4 overflow-x-auto text-sm text-gray-100 max-h-48 overflow-y-auto">
                                  <code>{violation.nodes[0]?.html || 'No HTML snippet available'}</code>
                                </pre>
                              </div>

                              <div>
                                <h5 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                  <ShieldCheck className="h-4 w-4 text-green-600" aria-hidden="true" />
                                  Fix Recommendation
                                </h5>
                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{violation.help}</p>
                                <a href={violation.helpUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
                                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                                  {lang === 'he' ? 'תיעוד מלא' : 'Full Documentation'}
                                </a>
                              </div>

                              {violation.nodes[0]?.failureSummary && (
                                <div className="rounded-lg bg-green-50 p-4 border border-green-200 dark:bg-green-950/30 dark:border-green-900/30">
                                  <p className="font-medium text-green-800 dark:text-green-400 mb-1 flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                                    {lang === 'he' ? 'סיכום התיקון הנדרש:' : 'Fix Summary:'}
                                  </p>
                                  <p className="text-green-700 dark:text-green-300 text-sm">{violation.nodes[0].failureSummary}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                      <a
                        href={generateReportUrl(extractDomain(url))}
                        className="w-full btn-primary text-center py-4 text-lg"
                      >
                        {t('scanner.viewFullReport')}
                        <span className="ml-2 text-sm font-normal opacity-80">
                          {t('scanner.price')} {t('scanner.or')} {t('scanner.priceUsd')}
                        </span>
                      </a>
                    </div>
                  </>
                )}
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}