'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';

export function useUrlSession() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { activeSessionId, setActiveSessionId } = useStore();
  const isInitialMount = useRef(true);
  const lastUrlSession = useRef<string | null>(null);
  
  // Read session ID from URL on mount and when URL changes externally
  useEffect(() => {
    const sessionFromUrl = searchParams.get('session');
    
    // Track the URL session to detect external changes
    if (sessionFromUrl !== lastUrlSession.current) {
      lastUrlSession.current = sessionFromUrl;
      
      if (sessionFromUrl && sessionFromUrl !== activeSessionId) {
        setActiveSessionId(sessionFromUrl);
      } else if (!sessionFromUrl && activeSessionId) {
        // Clear session if removed from URL
        setActiveSessionId(null);
      }
    }
  }, [searchParams, setActiveSessionId]); // Remove activeSessionId from dependencies to prevent loop
  
  // Update URL when session changes (but not on initial mount or URL changes)
  useEffect(() => {
    // Skip on initial mount to prevent clearing URL params
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    const currentSession = searchParams.get('session');
    
    // Only update URL if the session actually changed from user interaction
    if (activeSessionId !== currentSession) {
      const params = new URLSearchParams(searchParams);
      
      if (activeSessionId) {
        params.set('session', activeSessionId);
      } else {
        params.delete('session');
      }
      
      const newUrl = params.toString() ? `?${params.toString()}` : '/';
      router.push(newUrl, { scroll: false });
      
      // Update our tracking ref
      lastUrlSession.current = activeSessionId;
    }
  }, [activeSessionId, searchParams, router]);
}