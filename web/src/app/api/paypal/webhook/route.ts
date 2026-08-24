import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import crypto from 'crypto';

const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID;
const PAYPAL_API = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function verifyWebhook(headers: Headers, body: string): Promise<boolean> {
  if (!PAYPAL_WEBHOOK_ID) {
    console.warn('PAYPAL_WEBHOOK_ID not configured, skipping verification');
    return true;
  }

  const transmissionId = headers.get('paypal-transmission-id');
  const timestamp = headers.get('paypal-transmission-time');
  const certUrl = headers.get('paypal-cert-url');
  const authAlgo = headers.get('paypal-auth-algo');
  const transmissionSig = headers.get('paypal-transmission-sig');

  if (!transmissionId || !timestamp || !certUrl || !authAlgo || !transmissionSig) {
    return false;
  }

  try {
    const certResponse = await fetch(certUrl);
    const cert = await certResponse.text();
    
    const publicKey = crypto.createPublicKey(cert);
    const verify = crypto.createVerify('SHA256');
    
    const message = `${transmissionId}|${timestamp}|${PAYPAL_WEBHOOK_ID}|${crypto.createHash('sha256').update(body).digest('hex')}`;
    verify.update(message);
    verify.end();
    
    return verify.verify(publicKey, Buffer.from(transmissionSig, 'base64'));
  } catch (error) {
    console.error('Webhook verification failed:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headers = request.headers;

    const isValid = await verifyWebhook(headers, body);
    
    if (!isValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);
    const supabase = createClient();

    console.log('PayPal webhook received:', event.event_type);

    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED': {
        const capture = event.resource;
        const customId = capture.custom_id || capture.supplementary_data?.related_ids?.order_id;
        
        if (customId) {
          await supabase
            .from('payments')
            .update({
              paypal_capture_id: capture.id,
              status: 'completed',
              payer_email: capture.payer?.email_address,
              payer_name: capture.payer?.name?.given_name 
                ? `${capture.payer.name.given_name} ${capture.payer.name.surname}` 
                : null,
              completed_at: new Date().toISOString(),
            })
            .eq('paypal_order_id', capture.supplementary_data?.related_ids?.order_id);

          await supabase
            .from('leads')
            .update({
              status: 'paid',
              paid_at: new Date().toISOString(),
            })
            .eq('id', customId);
        }
        break;
      }

      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.REFUNDED': {
        const capture = event.resource;
        const orderId = capture.supplementary_data?.related_ids?.order_id;
        
        if (orderId) {
          await supabase
            .from('payments')
            .update({
              status: event.event_type === 'PAYMENT.CAPTURE.REFUNDED' ? 'refunded' : 'failed',
            })
            .eq('paypal_order_id', orderId);
        }
        break;
      }

      case 'CHECKOUT.ORDER.APPROVED': {
        const order = event.resource;
        const customId = order.purchase_units?.[0]?.custom_id;
        
        if (customId) {
          await supabase
            .from('payments')
            .update({ status: 'approved' })
            .eq('paypal_order_id', order.id);
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}