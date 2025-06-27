'use client';

import { Sidebar } from './session/Sidebar';
import { SessionView } from './session/SessionView';
import { useLiveUpdates } from '@/hooks/use-live-updates';
import { useUrlSession } from '@/hooks/use-url-session';

/**
 * App layout v2 that uses the sidebar components from shadcn/ui
 * The SidebarProvider is already in the Providers component in layout.tsx
 */
export function AppLayoutV2() {
  // Enable live updates when Claude is active
  useLiveUpdates();
  
  // Handle URL-based session routing
  useUrlSession();
  
  return (
    <div className="flex h-screen w-full">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <SessionView />
      </main>
    </div>
  );
}