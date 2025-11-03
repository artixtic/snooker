import type { Metadata } from 'next';
import { Providers } from './providers-client';
import { ErrorBoundary } from '@/components/error-boundary';
import { OfflineIndicator } from '@/components/offline-indicator';

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
        <ErrorBoundary>
          <Providers>
            <OfflineIndicator />
            {children}
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
