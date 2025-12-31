import { useEffect } from 'react';
import { usePathname } from 'expo-router';
import { analytics } from '@/services/analytics';
import { performance } from '@/services/performance';

/**
 * Hook to automatically track screen views and performance
 * Use this in your screen components or add to root layout
 */
export function useScreenTracking(screenName?: string) {
  const pathname = usePathname();
  const screen = screenName || pathname || 'unknown';

  useEffect(() => {
    // Track screen view
    analytics.screen(screen);

    // Measure screen load time
    performance.mark(`${screen}_load_start`);
    
    return () => {
      performance.measure(`${screen}_load`, `${screen}_load_start`);
    };
  }, [screen]);
}

