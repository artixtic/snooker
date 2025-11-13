'use client';

import { useEffect } from 'react';

/**
 * Component to unregister any existing service workers
 * This is needed to clean up service workers from the offline functionality that was removed
 */
export function UnregisterServiceWorker() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        // Unregister all service workers
        navigator.serviceWorker.getRegistrations()
          .then((registrations) => {
            for (const registration of registrations) {
              registration
                .unregister()
                .then((success) => {
                  if (success) {
                    console.log('Service worker unregistered successfully');
                  }
                })
                .catch((error) => {
                  // Silently ignore errors - service worker might not exist or already be unregistered
                  console.debug('Service worker unregister error (ignored):', error);
                });
            }
          })
          .catch((error) => {
            // Silently ignore errors - service worker API might not be fully available
            // This is common in Electron or when service workers are disabled
            console.debug('Could not get service worker registrations (ignored):', error);
          });
      } catch (error) {
        // Silently ignore any synchronous errors
        console.debug('Service worker cleanup error (ignored):', error);
      }
    }
  }, []);

  return null;
}

