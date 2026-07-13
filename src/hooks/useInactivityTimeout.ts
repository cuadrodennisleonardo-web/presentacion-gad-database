import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';
import { INACTIVITY_TIMEOUT_MS } from '@/lib/constants';

/**
 * Hook that auto-logs-out the user after a period of inactivity.
 * Tracks mouse movement, keyboard input, clicks, scroll, and touch events.
 * Resets the timer on any interaction.
 */
export function useInactivityTimeout() {
  const { signOut, isAuthenticated } = useAuth();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningCallbackRef = useRef<(() => void) | null>(null);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
      warningRef.current = null;
    }
  }, []);

  const resetTimer = useCallback(() => {
    clearTimers();

    if (!isAuthenticated) return;

    // Show a warning 2 minutes before auto-logout
    const warningTime = INACTIVITY_TIMEOUT_MS - 2 * 60 * 1000;
    if (warningTime > 0) {
      warningRef.current = setTimeout(() => {
        // Dispatch a custom event that UI components can listen to
        window.dispatchEvent(new CustomEvent('inactivity-warning', {
          detail: { secondsRemaining: 120 }
        }));
      }, warningTime);
    }

    // Auto logout after the full timeout
    timeoutRef.current = setTimeout(() => {
      signOut();
      // Redirect will happen automatically via ProtectedRoute
    }, INACTIVITY_TIMEOUT_MS);
  }, [isAuthenticated, signOut, clearTimers]);

  useEffect(() => {
    if (!isAuthenticated) {
      clearTimers();
      return;
    }

    const events: (keyof WindowEventMap)[] = [
      'mousemove',
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ];

    // Throttle the reset to avoid excessive timer restarts
    let lastReset = Date.now();
    const throttledReset = () => {
      const now = Date.now();
      if (now - lastReset > 5000) { // Only reset every 5 seconds max
        lastReset = now;
        resetTimer();
      }
    };

    events.forEach((event) => {
      window.addEventListener(event, throttledReset, { passive: true });
    });

    // Start the timer
    resetTimer();

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, throttledReset);
      });
      clearTimers();
    };
  }, [isAuthenticated, resetTimer, clearTimers]);

  return { warningCallbackRef };
}
