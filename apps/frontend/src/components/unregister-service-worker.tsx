'use client';

import { useEffect } from 'react';

/**
 * Component to unregister any existing service workers
 * This is needed to clean up service workers from the offline functionality that was removed
 */
export function UnregisterServiceWorker() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Unregister all service workers
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration
            .unregister()
            .then((success) => {
              if (success) {
                console.log('Service worker unregistered successfully');
              }
            })
            .catch((error) => {
              console.error('Error unregistering service worker:', error);
            });
        }
      });

      // Also try to unregister by scope
      navigator.serviceWorker
        .unregister('/sw.js')
        .then((success) => {
          if (success) {
            console.log('Service worker /sw.js unregistered successfully');
          }
        })
        .catch((error) => {
          // Ignore errors - service worker might not exist
        });
    }
  }, []);

  return null;
}

