import type { Metadata } from 'next';
import Script from 'next/script';
import { Providers } from './providers-client';
import { ErrorBoundary } from '@/components/error-boundary';
import { DragEventFix } from '../components/drag-event-fix';

export const metadata: Metadata = {
  title: 'Snooker POS',
  description: 'Point of Sale System for Snooker Club',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
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
          <DragEventFix />
          <Providers>
            {children}
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
