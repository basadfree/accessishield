'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { cn, getImpactLabel, getImpactColor, generateReportUrl } from '@/lib/utils';
import { Download, Copy, Check, AlertCircle, Code, Eye, ShieldCheck, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

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

interface LeadData {
  domain: string;
  business_name: string;
  scan_result: {
    violations: Violation[];
    violationsCount: number;
  };
  violations_count: number;
}

interface ReportData {
  js_widget_code: string;
  violations_fixed: Violation[];
  generated_at: string;
}

export default function ReportPage() {
  const { t, lang } = useI18n();
  const params = useParams();
  const searchParams = useSearchParams();
  const domain = params.domain as string;
  const leadId = searchParams.get('leadId');

  const [lead, setLead] = useState<LeadData | null>(null);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresPayment, setRequiresPayment] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [domain, leadId]);

  const fetchReport = async () => {
    try {
      const url = leadId 
        ? `/api/report/${domain}?leadId=${leadId}`
        : `/api/report/${domain}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 402) {
          setRequiresPayment(true);
          setError(data.error);
          return;
        }
        throw new Error(data.error || 'Failed to load report');
      }

      setLead(data.lead);
      setReport(data.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!lead || !report) return;
    
    setGeneratingPdf(true);
    
    try {
      const element = document.getElementById('report-content');
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`accessishield-report-${domain}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleCopyWidget = async () => {
    if (!report?.js_widget_code) return;
    
    try {
      await navigator.clipboard.writeText(report.js_widget_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      alert('Failed to copy. Please select and copy manually.');
    }
  };

  const getImpactBadge = (impact: string) => (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
      getImpactColor(impact)
    )}>
      {getImpactLabel(impact, lang)}
    </span>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto mb-4" aria-hidden="true" />
          <p className="text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error && !lead) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900 px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {requiresPayment ? 'Payment Required' : 'Report Not Found'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          {requiresPayment && leadId && (
            <a
              href={`/payment?leadId=${leadId}`}
              className="btn-primary inline-block"
            >
              Complete Payment ($55 / 200 ILS)
            </a>
          )}
          {!requiresPayment && (
            <a href="/" className="btn-outline inline-block mt-4">
              Back to Scanner
            </a>
          )}
        </div>
      </div>
    );
  }

  if (!lead) return null;

  const violations = lead.scan_result?.violations || [];
  const fixedViolations = report?.violations_fixed || violations;

  return (
    <div className="min-h-screen bg-white dark:bg-dark-950">
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <a href="/" className="flex items-center gap-2 text-xl font-bold text-primary-600 dark:text-primary-400">
              <ShieldCheck className="h-8 w-8" aria-hidden="true" />
              <span>AccessiShield</span>
            </a>
            <a href="/" className="text-sm text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400">
              ← Back to Scanner
            </a>
          </div>
        </div>
      </header>

      <main id="report-content" className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400 text-sm font-medium mb-4">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            <span>{lang === 'he' ? 'דוח מלא - שולם' : 'Full Report - Paid'}</span>
          </div>
          <h1 className={cn(
            'text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2',
            lang === 'he' ? 'font-hebrew' : ''
          )}>
            Accessibility Report for <span className="text-primary-600 dark:text-primary-400">{lead.domain}</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Generated on {new Date(report?.generated_at || Date.now()).toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-US', { 
              year: 'numeric', month: 'long', day: 'numeric' 
            })}
          </p>
        </div>

        <div className="card mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-primary-600 dark:text-primary-400" aria-hidden="true" />
            {t('report.violationDetails')} ({lead.violations_count} found)
          </h2>
          <div className="space-y-6">
            {violations.map((violation, index) => (
              <div key={violation.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: 
                      violation.impact === 'critical' ? '#ef4444' :
                      violation.impact === 'serious' ? '#f97316' :
                      violation.impact === 'moderate' ? '#eab308' : '#3b82f6'
                    }}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono">
                        {violation.id}
                      </code>
                      {getImpactBadge(violation.impact)}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-3">{violation.description}</p>
                    <a href={violation.helpUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      {lang === 'he' ? 'תיעוד WCAG' : 'WCAG Documentation'}
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <Code className="h-4 w-4" aria-hidden="true" />
                      {t('report.codeExample')}
                    </h4>
                    <pre className="bg-gray-950 rounded-lg p-4 overflow-x-auto text-sm text-gray-100 max-h-64 overflow-y-auto">
                      <code>{violation.nodes[0]?.html || 'No HTML snippet available'}</code>
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-green-600" aria-hidden="true" />
                      {t('report.fixCode')}
                    </h4>
                    <pre className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 overflow-x-auto text-sm text-green-800 dark:text-green-300 max-h-64 overflow-y-auto border border-green-200 dark:border-green-800">
                      <code>{generateFixCode(violation)}</code>
                    </pre>
                  </div>
                </div>

                {violation.nodes[0]?.failureSummary && (
                  <div className="mt-4 p-4 rounded-lg bg-green-50 border border-green-200 dark:bg-green-950/30 dark:border-green-900/30">
                    <p className="font-medium text-green-800 dark:text-green-400 mb-1 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                      {lang === 'he' ? 'סיכום התיקון:' : 'Fix Summary:'}
                    </p>
                    <p className="text-green-700 dark:text-green-300 text-sm">{violation.nodes[0].failureSummary}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {report?.js_widget_code && (
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Code className="h-6 w-6" aria-hidden="true" />
                {t('report.jsWidget')}
              </h2>
              <button
                onClick={handleCopyWidget}
                className="btn-secondary flex items-center gap-2"
              >
                <Copy className="h-4 w-4" aria-hidden="true" />
                {copied ? t('common.copied') : t('common.copy')}
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              {lang === 'he' 
                ? 'הדבק שורה זו ב-<head> של האתר כדי לתקן דינמית את כל ההפרות שנמצאו'
                : 'Paste this single line into your site <head> to dynamically fix all found violations'
              }
            </p>
            <div className="bg-gray-950 rounded-lg p-4 overflow-x-auto max-h-64 overflow-y-auto">
              <pre className="text-sm text-gray-100"><code>{report.js_widget_code}</code></pre>
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleDownloadPdf}
            disabled={generatingPdf}
            className="btn-primary w-full sm:w-auto"
          >
            <Download className="h-5 w-5" aria-hidden="true" />
            {generatingPdf ? t('common.loading') : t('report.downloadPdf')}
          </button>
          <a href="/" className="btn-outline w-full sm:w-auto text-center">
            {lang === 'he' ? 'סרוק אתר נוסף' : 'Scan Another Site'}
          </a>
        </div>
      </main>
    </div>
  );
}

function generateFixCode(violation: Violation): string {
  const fixes: Record<string, string> = {
    'image-alt': '// Before: <img src="image.jpg">\n// After: <img src="image.jpg" alt="Descriptive text describing the image">',
    'button-name': '// Before: <button><svg>...</svg></button>\n// After: <button aria-label="Submit form"><svg>...</svg></button>',
    'link-name': '// Before: <a href="/page"><svg>...</svg></a>\n// After: <a href="/page" aria-label="Go to page"><svg>...</svg></a>',
    'label': '// Before: <input type="email" placeholder="Email">\n// After: <label for="email">Email</label><input type="email" id="email" placeholder="Email">',
    'video-controls': '// Before: <video src="video.mp4"></video>\n// After: <video src="video.mp4" controls></video>',
    'iframe-title': '// Before: <iframe src="..."></iframe>\n// After: <iframe src="..." title="Descriptive title"></iframe>',
  };
  return fixes[violation.id] || `// Fix for ${violation.id}: ${violation.help}`;
}