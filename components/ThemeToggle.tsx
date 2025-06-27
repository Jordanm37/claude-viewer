'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-14 h-8 bg-premium-bg-secondary rounded-full opacity-50" />
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        "relative w-14 h-8 rounded-full transition-colors duration-200",
        "bg-premium-bg-secondary hover:bg-premium-bg-tertiary",
        "focus:outline-none focus:ring-2 focus:ring-premium-accent-blue focus:ring-offset-2",
        "dark:bg-premium-bg-secondary dark:hover:bg-premium-bg-tertiary"
      )}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {/* Track */}
      <div className="absolute inset-0 rounded-full" />
      
      {/* Icons */}
      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-xs">
        ☀
      </span>
      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs">
        ☾
      </span>
      
      {/* Thumb */}
      <div
        className={cn(
          "absolute top-0.5 left-0.5 w-7 h-7 rounded-full bg-white",
          "shadow-md transition-transform duration-200",
          "dark:bg-premium-bg-primary",
          isDark && "translate-x-6"
        )}
      />
    </button>
  );
}