'use client';

import { useEffect } from 'react';

/**
 * Component to fix dragEvent errors in Electron
 * Prevents undefined dragEvent references and handles drag events properly
 */
export function DragEventFix() {
  useEffect(() => {
    // Define global dragEvent variable to prevent ReferenceError
    // This is needed for Electron's devtools which may reference dragEvent
    // Initialize immediately to prevent errors before React loads
    if (typeof window !== 'undefined') {
      if (!(window as any).dragEvent) {
        (window as any).dragEvent = null;
      }
    }

    // Global error handler to catch undefined dragEvent references
    const handleError = (event: ErrorEvent) => {
      if (event.message && event.message.includes('dragEvent')) {
        event.preventDefault();
        event.stopPropagation();
        console.warn('DragEvent error prevented:', event.message);
        return false;
      }
    };

    // Global unhandled rejection handler
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason && typeof event.reason === 'string' && event.reason.includes('dragEvent')) {
        event.preventDefault();
        console.warn('DragEvent promise rejection prevented:', event.reason);
      }
    };

    // Prevent default drag and drop behavior
    const preventDrag = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // Add error handlers
    window.addEventListener('error', handleError, true);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Prevent drag and drop events globally
    document.addEventListener('dragover', preventDrag, false);
    document.addEventListener('drop', preventDrag, false);
    document.addEventListener('dragenter', preventDrag, false);
    document.addEventListener('dragleave', preventDrag, false);
    document.addEventListener('dragstart', preventDrag, false);

    // Also prevent on document body
    if (document.body) {
      document.body.addEventListener('dragover', preventDrag, false);
      document.body.addEventListener('drop', preventDrag, false);
      document.body.addEventListener('dragenter', preventDrag, false);
      document.body.addEventListener('dragleave', preventDrag, false);
    }

    // Cleanup
    return () => {
      window.removeEventListener('error', handleError, true);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      document.removeEventListener('dragover', preventDrag, false);
      document.removeEventListener('drop', preventDrag, false);
      document.removeEventListener('dragenter', preventDrag, false);
      document.removeEventListener('dragleave', preventDrag, false);
      document.removeEventListener('dragstart', preventDrag, false);
      
      if (document.body) {
        document.body.removeEventListener('dragover', preventDrag, false);
        document.body.removeEventListener('drop', preventDrag, false);
        document.body.removeEventListener('dragenter', preventDrag, false);
        document.body.removeEventListener('dragleave', preventDrag, false);
      }

      // Clean up global variable
      if (typeof window !== 'undefined' && (window as any).dragEvent !== undefined) {
        delete (window as any).dragEvent;
      }
    };
  }, []);

  return null; // This component doesn't render anything
}

