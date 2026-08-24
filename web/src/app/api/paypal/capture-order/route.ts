import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

const PAYPAL_API = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(
    `${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');

  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  return data.access_token;
}

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const accessToken = await getAccessToken();

    const captureResponse = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Prefer': 'return=representation',
      },
    });

    const captureData = await captureResponse.json();

    if (!captureResponse.ok) {
      console.error('PayPal capture failed:', captureData);
      return NextResponse.json({ error: 'Failed to capture payment' }, { status: 500 });
    }

    const supabase = createClient();

    const purchaseUnit = captureData.purchase_units?.[0];
    const leadId = purchaseUnit?.custom_id || purchaseUnit?.reference_id;
    const captureId = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id;
    const payer = captureData.payer;

    if (leadId) {
      await supabase
        .from('payments')
        .update({
          paypal_capture_id: captureId,
          status: 'completed',
          payer_email: payer?.email_address,
          payer_name: payer?.name?.given_name ? `${payer.name.given_name} ${payer.name.surname}` : null,
          completed_at: new Date().toISOString(),
        })
        .eq('paypal_order_id', orderId);

      await supabase
        .from('leads')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('id', leadId);

      await generateReport(leadId, supabase);
    }

    return NextResponse.json({
      success: true,
      captureId,
      status: captureData.status,
    });
  } catch (error) {
    console.error('Capture order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function generateReport(leadId: string, supabase: any) {
  const { data: lead } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();

  if (!lead || !lead.scan_result) return;

  const violations = lead.scan_result.violations || [];
  const fixedViolations = violations.map((v: any) => ({
    ...v,
    fixed: true,
    fixCode: generateFixCode(v),
  }));

  const jsWidget = generateJSWidget(fixedViolations);

  const reportData = {
    lead_id: leadId,
    report_type: 'both',
    js_widget_code: jsWidget,
    violations_fixed: fixedViolations,
    generated_at: new Date().toISOString(),
  };

  await supabase.from('reports').insert(reportData);
}

function generateFixCode(violation: any): string {
  const fixes: Record<string, string> = {
    'image-alt': `// Before: <img src="image.jpg">\n// After: <img src="image.jpg" alt="Descriptive text describing the image">`,
    'button-name': `// Before: <button><svg>...</svg></button>\n// After: <button aria-label="Submit form"><svg>...</svg></button>`,
    'link-name': `// Before: <a href="/page"><svg>...</svg></a>\n// After: <a href="/page" aria-label="Go to page"><svg>...</svg></a>`,
    'label': `// Before: <input type="email" placeholder="Email">\n// After: <label for="email">Email</label><input type="email" id="email" placeholder="Email">`,
    'video-controls': `// Before: <video src="video.mp4"></video>\n// After: <video src="video.mp4" controls></video>`,
    'iframe-title': `// Before: <iframe src="..."></iframe>\n// After: <iframe src="..." title="Descriptive title"></iframe>`,
  };
  return fixes[violation.id] || `// Fix for ${violation.id}: ${violation.help}`;
}

function generateJSWidget(violations: any[]): string {
  const fixes = violations.map(v => `
    // Fix for ${v.id}: ${v.help}
    ${generateFixCodeForWidget(v)}
  `).join('\n');

  return `<!-- AccessiShield Accessibility Fix Widget -->
<script>
(function() {
  'use strict';
  
  ${fixes}
  
  // Auto-apply fixes on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyFixes);
  } else {
    applyFixes();
  }
  
  // Also watch for dynamic content
  const observer = new MutationObserver(applyFixes);
  observer.observe(document.body, { childList: true, subtree: true });
  
  function applyFixes() {
    // Image alt fixes
    document.querySelectorAll('img:not([alt])').forEach(img => {
      img.alt = img.getAttribute('data-accessishield-alt') || 'Image';
    });
    
    // Button labels
    document.querySelectorAll('button:not([aria-label]):empty').forEach(btn => {
      btn.setAttribute('aria-label', btn.getAttribute('data-accessishield-label') || 'Button');
    });
    
    // Link labels
    document.querySelectorAll('a:not([aria-label]):empty').forEach(link => {
      link.setAttribute('aria-label', link.getAttribute('data-accessishield-label') || 'Link');
    });
    
    // Form labels
    document.querySelectorAll('input:not([id])').forEach(input => {
      const id = 'accessishield-' + Math.random().toString(36).substr(2, 9);
      input.id = id;
      const label = document.createElement('label');
      label.htmlFor = id;
      label.textContent = input.placeholder || 'Input';
      label.style.position = 'absolute';
      label.style.width = '1px';
      label.style.height = '1px';
      label.style.padding = '0';
      label.style.margin = '-1px';
      label.style.overflow = 'hidden';
      label.style.clip = 'rect(0, 0, 0, 0)';
      label.style.whiteSpace = 'nowrap';
      label.style.border = '0';
      input.parentNode?.insertBefore(label, input);
    });
  }
})();
</script>`;
}

function generateFixCodeForWidget(violation: any): string {
  return `// ${violation.help}`;
}