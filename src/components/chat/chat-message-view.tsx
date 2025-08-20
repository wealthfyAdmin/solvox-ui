'use client';

import {
  type RefObject,
  useEffect,
  useRef,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { cn } from '@/lib/utils';

export function useAutoScroll(scrollContentContainerRef: RefObject<Element | null>) {
  const shouldAutoScrollRef = useRef(true);
  const lastScrollTopRef = useRef(0);

  const scrollToBottom = useCallback(() => {
    const container = scrollContentContainerRef.current;
    if (container && shouldAutoScrollRef.current) {
      container.scrollTop = container.scrollHeight;
      lastScrollTopRef.current = container.scrollHeight;
    }
  }, [scrollContentContainerRef]);

  useEffect(() => {
    const container = scrollContentContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;

      shouldAutoScrollRef.current = isNearBottom;
      lastScrollTopRef.current = scrollTop;
    };

    const resizeObserver = new ResizeObserver(() => {
      setTimeout(scrollToBottom, 10);
    });

    resizeObserver.observe(container);
    container.addEventListener('scroll', handleScroll, { passive: true });

    scrollToBottom();

    return () => {
      resizeObserver.disconnect();
      container.removeEventListener('scroll', handleScroll);
    };
  }, [scrollContentContainerRef, scrollToBottom]);

  const forceScrollToBottom = useCallback(() => {
    shouldAutoScrollRef.current = true;
    scrollToBottom();
  }, [scrollToBottom]);

  return { forceScrollToBottom };
}

// Define what parent can call via ref
export interface ChatMessageViewHandle {
  forceScrollToBottom: () => void;
}

interface ChatProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
}

// ✅ Wrapped with forwardRef
export const ChatMessageView = forwardRef<ChatMessageViewHandle, ChatProps>(
  ({ className, children, ...props }, ref) => {
    const scrollContentRef = useRef<HTMLDivElement>(null);
    const { forceScrollToBottom } = useAutoScroll(scrollContentRef);

    // Expose to parent via ref
    useImperativeHandle(ref, () => ({
      forceScrollToBottom,
    }), [forceScrollToBottom]);

    return (
      <div
        ref={scrollContentRef}
        className={cn(
          'flex-1 overflow-y-auto scroll-smooth p-4 space-y-2',
          'scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600',
          'scrollbar-track-transparent hover:scrollbar-thumb-gray-400',
          className
        )}
        {...props}
      >
        <div className="min-h-full flex flex-col justify-end">
          {children}
        </div>
      </div>
    );
  }
);

ChatMessageView.displayName = 'ChatMessageView';
