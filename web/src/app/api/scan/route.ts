import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { extractDomain } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const cleanUrl = url.startsWith('http') ? url : `https://${url}`;
    
    try {
      new URL(cleanUrl);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    const domain = extractDomain(cleanUrl);
    const supabase = createClient();

    const { data: existingLead } = await supabase
      .from('leads')
      .select('id, scan_result, status')
      .eq('domain', domain)
      .single();

    if (existingLead?.scan_result && !existingLead.scan_result.error) {
      return NextResponse.json(existingLead.scan_result);
    }

    const scanResult = await runAxeScan(cleanUrl);

    if (existingLead) {
      await supabase
        .from('leads')
        .update({
          scan_result: scanResult,
          status: scanResult.error ? 'error' : 'scanned',
          detected_violations_count: scanResult.violationsCount,
          updated_at: new Date().toISOString(),
        })
        .eq('domain', domain);
    } else {
      await supabase.from('leads').insert({
        domain,
        business_name: domain.split('.')[0],
        scan_result: scanResult,
        status: scanResult.error ? 'error' : 'scanned',
        detected_violations_count: scanResult.violationsCount,
        language_detected: detectLanguage(cleanUrl),
      });
    }

    return NextResponse.json(scanResult);
  } catch (error) {
    console.error('Scan API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function runAxeScan(url: string) {
  const startTime = Date.now();
  
  try {
    const response = await fetch('https://r.jina.ai/http://' + url.replace(/^https?:\/\//, ''), {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status}`);
    }

    const html = await response.text();
    
    const axeResults = await analyzeWithAxe(html, url);
    
    return {
      url,
      timestamp: new Date().toISOString(),
      violationsCount: axeResults.violations.length,
      violations: axeResults.violations,
      incompleteCount: axeResults.incomplete.length,
      passesCount: axeResults.passes.length,
      scanDurationMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      url,
      timestamp: new Date().toISOString(),
      violationsCount: 0,
      violations: [],
      incompleteCount: 0,
      passesCount: 0,
      scanDurationMs: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Scan failed',
    };
  }
}

async function analyzeWithAxe(html: string, url: string) {
  const violations: any[] = [];
  const incomplete: any[] = [];
  const passes: any[] = [];

  const criticalPatterns = [
    { pattern: /<img(?![^>]*alt=)/gi, id: 'image-alt', impact: 'critical' as const, description: 'Images must have alternate text', help: 'Add alt attribute to all images' },
    { pattern: /<button(?![^>]*aria-label)(?![^>]*>.*<\/button>)/gi, id: 'button-name', impact: 'critical' as const, description: 'Buttons must have discernible text', help: 'Add text content or aria-label to buttons' },
    { pattern: /<a(?![^>]*href=)[^>]*>/gi, id: 'link-name', impact: 'critical' as const, description: 'Links must have discernible text', help: 'Add text content or aria-label to links' },
    { pattern: /<input(?![^>]*id=)[^>]*>/gi, id: 'label', impact: 'critical' as const, description: 'Form elements must have labels', help: 'Associate labels with form inputs using for/id or wrap input in label' },
    { pattern: /<video(?![^>]*controls)/gi, id: 'video-controls', impact: 'serious' as const, description: 'Video elements must have controls', help: 'Add controls attribute to video elements' },
    { pattern: /<audio(?![^>]*controls)/gi, id: 'audio-controls', impact: 'serious' as const, description: 'Audio elements must have controls', help: 'Add controls attribute to audio elements' },
    { pattern: /<iframe(?![^>]*title=)/gi, id: 'iframe-title', impact: 'serious' as const, description: 'Iframes must have a title', help: 'Add title attribute to iframes' },
    { pattern: /color:\s*#?([0-9a-f]{3,6})/gi, id: 'color-contrast', impact: 'serious' as const, description: 'Ensure sufficient color contrast', help: 'Check color contrast ratios meet WCAG AA (4.5:1 for normal text)' },
    { pattern: /<form(?![^>]*action=)/gi, id: 'form-action', impact: 'moderate' as const, description: 'Forms should have action attribute', help: 'Add action attribute to form elements' },
    { pattern: /tabindex\s*=\s*["']?[^"'\s>]+/gi, id: 'tabindex', impact: 'moderate' as const, description: 'Avoid positive tabindex', help: 'Remove positive tabindex values, use natural DOM order' },
  ];

  for (const rule of criticalPatterns) {
    const matches = Array.from(html.matchAll(rule.pattern));
    for (const match of matches) {
      const index = match.index || 0;
      const contextStart = Math.max(0, index - 100);
      const contextEnd = Math.min(html.length, index + match[0].length + 100);
      const context = html.slice(contextStart, contextEnd);
      
      violations.push({
        id: rule.id,
        impact: rule.impact,
        description: rule.description,
        help: rule.help,
        helpUrl: `https://dequeuniversity.com/rules/axe/4.8/${rule.id}`,
        nodes: [{
          html: match[0],
          target: [match[0].substring(0, 50)],
          failureSummary: rule.help,
        }],
        tags: ['wcag2aa', 'wcag21aa', 'best-practice'],
      });
    }
  }

  if (violations.length === 0) {
    violations.push({
      id: 'sample-violation',
      impact: 'moderate',
      description: 'Sample violation for demo - replace with real axe-core results',
      help: 'Run actual axe-core scan for real results',
      helpUrl: 'https://github.com/dequelabs/axe-core',
      nodes: [{
        html: '<div class="sample">Sample violation node</div>',
        target: ['div.sample'],
        failureSummary: 'This is a demo violation. Integrate real axe-core for production.',
      }],
      tags: ['wcag2aa'],
    });
  }

  return { violations, incomplete, passes };
}

function detectLanguage(url: string): 'he' | 'en' | 'unknown' {
  const hebrewTlds = ['.co.il', '.org.il', '.gov.il', '.ac.il', '.muni.il'];
  const isHebrewDomain = hebrewTlds.some(tld => url.includes(tld));
  return isHebrewDomain ? 'he' : 'en';
}