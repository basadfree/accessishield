'use client';

import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import { useEffect, useState } from 'react';

export default function PaymentLayout({ children }: { children: React.ReactNode }) {
  const [sdkReady, setSdkReady] = useState(false);

  useEffect(() => {
    setSdkReady(true);
  }, []);

  if (!sdkReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4" aria-hidden="true" />
          <p className="text-gray-600 dark:text-gray-400">Loading PayPal...</p>
        </div>
      </div>
    );
  }

  return (
    <PayPalScriptProvider
      options={{
        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
        currency: 'ILS',
        intent: 'capture',
        components: 'buttons',
        vault: false,
      }}
    >
      {children}
    </PayPalScriptProvider>
  );
}