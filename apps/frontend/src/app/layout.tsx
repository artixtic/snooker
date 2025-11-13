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
              // Suppress Electron service worker storage errors
              if (typeof window !== 'undefined') {
                const originalConsoleError = console.error;
                console.error = function(...args) {
                  // Suppress Electron service worker storage errors
                  if (args[0] && typeof args[0] === 'string' && 
                      (args[0].includes('service_worker_storage') || 
                       args[0].includes('Failed to delete the database'))) {
                    return; // Silently ignore
                  }
                  originalConsoleError.apply(console, args);
                };
              }
              
              if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
                try {
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for(var i = 0; i < registrations.length; i++) {
                      registrations[i].unregister().catch(function() {
                        // Ignore errors - service worker might not exist
                      });
                    }
                  }).catch(function() {
                    // Ignore errors - service worker API might not be fully available
                  });
                } catch(e) {
                  // Silently ignore any errors during service worker cleanup
                }
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
