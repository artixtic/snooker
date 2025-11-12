/**
 * Service Worker Registration
 * 
 * Registers and manages the service worker for offline functionality.
 */

export function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.warn('Service Workers are not supported in this browser');
    return Promise.resolve(null);
  }

  return navigator.serviceWorker
    .register('/sw.js')
    .then((registration) => {
      console.log('[Service Worker] Registered successfully:', registration.scope);

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[Service Worker] New version available');
              // Optionally notify user to refresh
            }
          });
        }
      });

      return registration;
    })
    .catch((error) => {
      console.error('[Service Worker] Registration failed:', error);
      return null;
    });
}

export function unregisterServiceWorker(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return Promise.resolve(false);
  }

  return navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => {
      return Promise.all(registrations.map((reg) => reg.unregister())).then(() => true);
    })
    .catch((error) => {
      console.error('[Service Worker] Unregistration failed:', error);
      return false;
    });
}

export function clearServiceWorkerCache(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    if (navigator.serviceWorker.controller) {
      const channel = new MessageChannel();
      channel.port1.onmessage = (event) => {
        resolve(event.data.success);
      };
      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' }, [channel.port2]);
    } else {
      resolve(false);
    }
  });
}

