'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useStore } from '@/lib/store';

export function useLiveUpdates() {
  const queryClient = useQueryClient();
  const { setClaudeActive, activeSessionId } = useStore();
  const reconnectAttemptsRef = useRef(0);
  
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let lastActivity = Date.now();
    
    const connect = () => {
      console.log('[LiveUpdates] Connecting to SSE stream...');
      eventSource = new EventSource('/api/sessions/stream');
      
      eventSource.onopen = () => {
        console.log('[LiveUpdates] Connected successfully');
        reconnectAttemptsRef.current = 0;
        setClaudeActive(true);
        lastActivity = Date.now();
      };
      
      eventSource.onmessage = (event) => {
        lastActivity = Date.now();
        
        try {
          const data = JSON.parse(event.data);
          console.log('[LiveUpdates] Received event:', data.type, data);
          
          switch (data.type) {
            case 'new_messages':
              // Invalidate multiple possible query keys to handle ID format differences
              const possibleKeys = [
                ['session', data.sessionId],
                ['session', `${data.project}/${data.sessionId}`],
                ['session', activeSessionId], // Current active session
              ];
              
              console.log('[LiveUpdates] Invalidating queries for new messages:', possibleKeys);
              
              possibleKeys.forEach(key => {
                queryClient.invalidateQueries({ 
                  queryKey: key,
                  exact: true 
                });
              });
              
              // Also invalidate session lists
              queryClient.invalidateQueries({ queryKey: ['sessions'] });
              queryClient.invalidateQueries({ queryKey: ['sessions-v3'] });
              
              // Force refetch if this is the active session
              if (activeSessionId && (
                activeSessionId === data.sessionId || 
                activeSessionId.includes(data.sessionId) ||
                activeSessionId === `${data.project}/${data.sessionId}`
              )) {
                console.log('[LiveUpdates] Force refetching active session');
                queryClient.refetchQueries({ 
                  queryKey: ['session', activeSessionId],
                  exact: true 
                });
              }
              break;
              
            case 'new_session':
              console.log('[LiveUpdates] New session created:', data.sessionId);
              queryClient.invalidateQueries({ queryKey: ['sessions'] });
              queryClient.invalidateQueries({ queryKey: ['sessions-v3'] });
              break;
              
            case 'heartbeat':
              console.log('[LiveUpdates] Heartbeat received');
              break;
              
            default:
              console.log('[LiveUpdates] Unknown event type:', data.type);
          }
        } catch (error) {
          console.error('[LiveUpdates] Error parsing SSE data:', error);
        }
      };
      
      eventSource.onerror = (error) => {
        console.error('[LiveUpdates] Connection error:', error);
        eventSource?.close();
        setClaudeActive(false);
        
        // Exponential backoff for reconnection
        reconnectAttemptsRef.current++;
        const delay = Math.min(5000 * Math.pow(2, reconnectAttemptsRef.current - 1), 30000);
        console.log(`[LiveUpdates] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);
        
        reconnectTimeout = setTimeout(connect, delay);
      };
    };
    
    // Monitor for Claude activity
    const activityInterval = setInterval(() => {
      const inactive = Date.now() - lastActivity > 60000; // 1 minute
      setClaudeActive(!inactive);
      
      if (inactive) {
        console.log('[LiveUpdates] No activity for 1 minute, marking as inactive');
      }
    }, 5000);
    
    connect();
    
    return () => {
      console.log('[LiveUpdates] Cleaning up...');
      eventSource?.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      clearInterval(activityInterval);
      setClaudeActive(false);
    };
  }, [queryClient, setClaudeActive, activeSessionId]);
}