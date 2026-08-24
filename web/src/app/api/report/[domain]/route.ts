import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ domain: string }> }
) {
  try {
    const { domain } = await params;
    const supabase = createClient();

    const { data: lead } = await supabase
      .from('leads')
      .select('*, reports(*)')
      .eq('domain', domain)
      .single();

    if (!lead) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    if (lead.status !== 'paid' && !lead.reports?.[0]) {
      return NextResponse.json(
        { error: 'Report not available. Payment required.', requiresPayment: true, leadId: lead.id },
        { status: 402 }
      );
    }

    const report = lead.reports?.[0];
    
    return NextResponse.json({
      lead: {
        domain: lead.domain,
        business_name: lead.business_name,
        scan_result: lead.scan_result,
        violations_count: lead.detected_violations_count,
      },
      report: report ? {
        js_widget_code: report.js_widget_code,
        violations_fixed: report.violations_fixed,
        generated_at: report.generated_at,
      } : null,
    });
  } catch (error) {
    console.error('Report API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}