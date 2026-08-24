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
    const { leadId, amount, currency, returnUrl, cancelUrl } = await request.json();

    if (!leadId || !amount) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const supabase = createClient();

    const { data: lead } = await supabase
      .from('leads')
      .select('id, domain, business_name')
      .eq('id', leadId)
      .single();

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const accessToken = await getAccessToken();

    const orderResponse = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: leadId,
          description: `AccessiShield Accessibility Report for ${lead.business_name || lead.domain}`,
          custom_id: leadId,
          amount: {
            currency_code: currency || 'ILS',
            value: amount.toString(),
            breakdown: {
              item_total: {
                currency_code: currency || 'ILS',
                value: amount.toString(),
              },
            },
          },
          items: [{
            name: 'Full Accessibility Report + Fix Widget',
            description: `WCAG 2.1 AA audit report for ${lead.domain} with exact code fixes and JS widget`,
            quantity: '1',
            unit_amount: {
              currency_code: currency || 'ILS',
              value: amount.toString(),
            },
            category: 'DIGITAL_GOODS',
          }],
        }],
        application_context: {
          brand_name: 'AccessiShield',
          locale: 'en-US',
          landing_page: 'NO_PREFERENCE',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'PAY_NOW',
          return_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?leadId=${leadId}`,
          cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel?leadId=${leadId}`,
        },
      }),
    });

    const orderData = await orderResponse.json();

    if (!orderResponse.ok) {
      console.error('PayPal order creation failed:', orderData);
      return NextResponse.json({ error: 'Failed to create PayPal order' }, { status: 500 });
    }

    await supabase.from('payments').insert({
      lead_id: leadId,
      paypal_order_id: orderData.id,
      amount_ils: currency === 'ILS' ? amount : Math.round(amount * 3.7),
      amount_usd: currency === 'USD' ? amount : Math.round(amount / 3.7),
      currency: currency || 'ILS',
      status: 'created',
    });

    const approveLink = orderData.links?.find((link: any) => link.rel === 'approve')?.href;

    return NextResponse.json({
      orderId: orderData.id,
      approveUrl: approveLink,
    });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}