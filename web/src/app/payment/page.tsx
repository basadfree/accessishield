'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Loader2, CreditCard, ShieldCheck, Lock } from 'lucide-react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

export default function PaymentPage() {
  const { t, lang } = useI18n();
  const searchParams = useSearchParams();
  const router = useRouter();
  const leadId = searchParams.get('leadId');
  const [sdkReady, setSdkReady] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!leadId) {
      router.push('/');
    }
  }, [leadId, router]);

  const createOrder = async () => {
    if (!leadId) return;
    
    setCreatingOrder(true);
    setError(null);
    
    try {
      const response = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          amount: 200,
          currency: 'ILS',
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create order');
      }

      return data.orderId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order');
      return undefined;
    } finally {
      setCreatingOrder(false);
    }
  };

  const onApprove = async (data: any) => {
    try {
      const response = await fetch('/api/paypal/capture-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: data.orderID }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Payment capture failed');
      }

      router.push(`/report/${searchParams.get('domain') || ''}?leadId=${leadId}&paid=true`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    }
  };

  if (!sdkReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary-600 mx-auto mb-4" aria-hidden="true" />
          <p className="text-gray-600 dark:text-gray-400">Loading PayPal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 py-12 px-4">
      <div className="mx-auto max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-100 text-primary-600 dark:bg-primary-950/30 dark:text-primary-400 mb-4">
            <CreditCard className="h-8 w-8" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {lang === 'he' ? 'השלם תשלום מאובטח' : 'Complete Secure Payment'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {lang === 'he' ? 'דוח נגישות מלא + ווידג\'ט תיקון' : 'Full Accessibility Report + Fix Widget'}
          </p>
        </div>

        <div className="card space-y-4">
          <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
            <ShieldCheck className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" aria-hidden="true" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {lang === 'he' ? 'דוח נגישות מלא' : 'Full Accessibility Report'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {lang === 'he' ? 'כולל קוד תיקון מדויק + ווידג\'ט JS' : 'Exact fix code + JS widget included'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <Lock className="h-6 w-6 text-gray-400" aria-hidden="true" />
              <span className="font-medium text-gray-900 dark:text-white">
                {lang === 'he' ? 'סכום לתשלום' : 'Amount Due'}
              </span>
            </div>
            <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              200 ₪
            </span>
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-900/30 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <PayPalButtons
            createOrder={createOrder}
            onApprove={onApprove}
            onError={(err) => {
              console.error('PayPal error:', err);
              setError('Payment error. Please try again.');
            }}
            onCancel={() => {
              setError('Payment cancelled');
            }}
            style={{
              layout: 'vertical',
              color: 'blue',
              shape: 'rect',
              label: 'pay',
              tagline: false,
            }}
            disabled={creatingOrder}
          />

          <p className="text-center text-xs text-gray-500 dark:text-gray-400">
            {lang === 'he' 
              ? 'מאובטח על ידי PayPal • ללא שמירת פרטי כרטיס • סקירות חינם 3 חודשים'
              : 'Secured by PayPal • No card details stored • Free re-scans for 3 months'
            }
          </p>
        </div>
      </div>
    </div>
  );
}