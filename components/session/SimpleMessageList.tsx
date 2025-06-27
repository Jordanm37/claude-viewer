'use client';

import { useRef, useEffect } from 'react';
import { SessionMessage } from '@/types/session';
import { MessageBubble } from './MessageBubble';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';

interface SimpleMessageListProps {
  messages: SessionMessage[];
  isLoading?: boolean;
  autoScroll?: boolean;
}

export function SimpleMessageList({ 
  messages, 
  isLoading = false,
  autoScroll = true 
}: SimpleMessageListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      bottomRef.current.scrollIntoView({ 
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'end'
      });
    }
  }, [messages.length, autoScroll]);

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 overflow-hidden" ref={scrollAreaRef}>
      <div className="pb-4 max-w-full overflow-hidden space-y-1">
        {messages.map((message, index) => (
          <MessageBubble
            key={`${message.uuid}-${index}`}
            message={message}
            isFirst={index === 0}
            isLast={index === messages.length - 1}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}