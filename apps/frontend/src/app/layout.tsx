import type { Metadata } from 'next';
import Script from 'next/script';
import { Providers } from './providers-client';
import { ErrorBoundary } from '@/components/error-boundary';
import { DragEventFix } from '../components/drag-event-fix';
import { UnregisterServiceWorker } from '@/components/unregister-service-worker';

export const metadata: Metadata = {
  title: 'Cue & Console',
  description: 'Premium Point of Sale System for Snooker & Gaming Club',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Unregister service workers immediately to prevent 404 errors */}
        <Script
          id="unregister-service-worker"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              // Unregister any existing service workers
              if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  for(var i = 0; i < registrations.length; i++) {
                    registrations[i].unregister();
                  }
                });
                navigator.serviceWorker.unregister('/sw.js').catch(function() {
                  // Ignore errors - service worker might not exist
                });
              }
            `,
          }}
        />
        {/* Initialize dragEvent globally before React loads to prevent ReferenceError in Electron */}
        <Script
          id="drag-event-fix-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              // Initialize dragEvent globally to prevent ReferenceError in Electron
              if (typeof window !== 'undefined' && !window.dragEvent) {
                window.dragEvent = null;
              }
            `,
          }}
        />
        <ErrorBoundary>
          <UnregisterServiceWorker />
          <DragEventFix />
          <Providers>
            {children}
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
