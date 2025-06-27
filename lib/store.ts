import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SessionThread } from '@/types/session';

interface BookmarkedSession {
  sessionId: string;
  title: string;
  timestamp: string;
}

interface AppState {
  // Current session
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  
  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Bookmarks
  bookmarks: BookmarkedSession[];
  addBookmark: (session: BookmarkedSession) => void;
  removeBookmark: (sessionId: string) => void;
  
  // UI State
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  
  // Live updates
  isClaudeActive: boolean;
  setClaudeActive: (active: boolean) => void;
  
  // Theme
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Current session
      activeSessionId: null,
      setActiveSessionId: (id) => set({ activeSessionId: id }),
      
      // Search
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
      
      // Bookmarks
      bookmarks: [],
      addBookmark: (session) => set((state) => ({
        bookmarks: [...state.bookmarks.filter(b => b.sessionId !== session.sessionId), session]
      })),
      removeBookmark: (sessionId) => set((state) => ({
        bookmarks: state.bookmarks.filter(b => b.sessionId !== sessionId)
      })),
      
      // UI State
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      
      // Live updates
      isClaudeActive: false,
      setClaudeActive: (active) => set({ isClaudeActive: active }),
      
      // Theme
      theme: 'dark',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'claude-viewer-settings',
      partialize: (state) => ({
        bookmarks: state.bookmarks,
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);