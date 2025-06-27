'use client';

import { useEffect } from 'react';
import { Sidebar } from './session/Sidebar';
import { SessionView } from './session/SessionView';
import { useLiveUpdates } from '@/hooks/use-live-updates';
import { useUrlSession } from '@/hooks/use-url-session';
import { Button } from './ui/button';
import { Menu, X } from 'lucide-react';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';

/**
 * Main application layout component that combines the sidebar and session view.
 * 
 * Features:
 * - Responsive sidebar with mobile hamburger menu
 * - Live session updates when Claude is active
 * - URL-based session routing for direct links
 * - Mobile-first design with overlay and scroll lock
 */
export function AppLayout() {
  const { sidebarOpen, setSidebarOpen } = useStore();
  
  // Enable live updates
  useLiveUpdates();
  
  // Handle URL session params
  useUrlSession();
  
  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);
  
  return (
    <div className="flex h-screen bg-premium-bg-primary w-full">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </Button>
      
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 transition-transform duration-200 md:relative md:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Sidebar />
      </div>
      
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Main content */}
      <div className="flex-1 overflow-hidden min-w-0 w-full">
        <SessionView />
      </div>
    </div>
  );
}