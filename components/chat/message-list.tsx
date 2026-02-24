"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { MessageItem } from "./message-item";
import { TypingIndicator } from "./typing-indicator";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { formatDateSeparator } from "@/lib/utils";

interface MessageListProps {
  conversationId: Id<"conversations">;
  currentUserId: Id<"users">;
  onReply?: (messageId: Id<"messages">) => void;
  isGroup?: boolean;
  isOtherUserOnline?: boolean;
}

export function MessageList({
  conversationId,
  currentUserId,
  onReply,
  isGroup = false,
  isOtherUserOnline = false,
}: MessageListProps) {
  const { user } = useUser();
  const messagesData = useQuery(api.messages.list, { conversationId, clerkId: user?.id });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const markAsRead = useMutation(api.conversations.markAsRead);

  // Parse reactions from JSON string to avoid Convex validation issues
  const messages = messagesData?.map((msg: any) => ({
    ...msg,
    reactions: msg.reactionsJson ? JSON.parse(msg.reactionsJson) : {},
  })) || [];

  // Group messages by date and add date separators
  const messagesWithSeparators = useMemo(() => {
    if (messages.length === 0) return [];
    
    const result: Array<{ type: 'message' | 'separator'; data: any }> = [];
    let lastDate: string | null = null;

    messages.forEach((message: any) => {
      const messageDate = new Date(message.createdAt);
      const dateKey = new Date(
        messageDate.getFullYear(),
        messageDate.getMonth(),
        messageDate.getDate()
      ).toISOString();

      // Add date separator if date changed
      if (dateKey !== lastDate) {
        result.push({
          type: 'separator',
          data: {
            date: message.createdAt,
            label: formatDateSeparator(message.createdAt),
          },
        });
        lastDate = dateKey;
      }

      result.push({
        type: 'message',
        data: message,
      });
    });

    return result;
  }, [messages]);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [lastReadMessageTime, setLastReadMessageTime] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Initialize last read time when messages first load and user is at bottom
  useEffect(() => {
    if (messages.length > 0 && lastReadMessageTime === null && isAtBottom) {
      const lastMessage = messages[messages.length - 1];
      setLastReadMessageTime(lastMessage.createdAt);
    }
  }, [messages, lastReadMessageTime, isAtBottom]);

  const scrollToBottom = () => {
    if (messagesEndRef.current && containerRef.current) {
      // Scroll container to bottom smoothly
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
    setIsAtBottom(true);
    setShowScrollButton(false);
    setNewMessagesCount(0);
    // Update last read time when scrolling to bottom
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      setLastReadMessageTime(lastMessage.createdAt);
      // Mark conversation as read
      if (user?.id) {
        markAsRead({ conversationId, clerkId: user.id });
      }
    }
  };

  const checkScrollPosition = useCallback(() => {
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setIsAtBottom(isNearBottom);
    
    if (isNearBottom) {
      // Update last read time when at bottom
      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        setLastReadMessageTime(lastMessage.createdAt);
        // Mark conversation as read
        if (user?.id) {
          markAsRead({ conversationId, clerkId: user.id });
        }
      }
      setShowScrollButton(false);
      setNewMessagesCount(0);
    } else {
      setShowScrollButton(true);
      
      // Calculate unread messages count (only for individual chats)
      if (!isGroup && lastReadMessageTime !== null) {
        // Count messages from other user that are unread (created after lastReadMessageTime)
        const count = messages.filter(
          (msg: any) => 
            msg.senderId !== currentUserId && 
            !msg.isPending && 
            !msg.isDeleted &&
            msg.createdAt > lastReadMessageTime
        ).length;
        setNewMessagesCount(count);
      } else {
        setNewMessagesCount(0);
      }
    }
  }, [messages, isGroup, currentUserId, lastReadMessageTime, conversationId, user?.id, markAsRead]);

  // Auto-scroll to bottom when new messages arrive and user is at bottom
  useEffect(() => {
    if (isAtBottom && messages.length > 0 && containerRef.current) {
      // Use requestAnimationFrame for smoother scrolling
      requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.scrollTo({
            top: containerRef.current.scrollHeight,
            behavior: "smooth"
          });
        }
      });
      // Update last read time
      const lastMessage = messages[messages.length - 1];
      setLastReadMessageTime(lastMessage.createdAt);
      setNewMessagesCount(0);
      // Mark conversation as read
      if (user?.id) {
        markAsRead({ conversationId, clerkId: user.id });
      }
    }
  }, [messages, isAtBottom, conversationId, user?.id, markAsRead]);

  // Initial scroll position check
  useEffect(() => {
    checkScrollPosition();
  }, [checkScrollPosition]);

  if (messagesData === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden p-4 scrollbar-thin bg-gradient-to-b from-background via-background to-background/95"
        onScroll={checkScrollPosition}
      >
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground">No messages yet</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Start the conversation by sending a message
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messagesWithSeparators.map((item, index) => {
              if (item.type === 'separator') {
                return (
                  <div
                    key={`separator-${item.data.date}`}
                    className="flex items-center justify-center py-2"
                  >
                    <div className="rounded-full bg-muted px-4 py-1 text-xs text-muted-foreground">
                      {item.data.label}
                    </div>
                  </div>
                );
              }
              return (
                <MessageItem
                  key={item.data._id}
                  message={item.data}
                  currentUserId={currentUserId}
                  onReply={onReply}
                  isGroup={isGroup}
                  isOtherUserOnline={isOtherUserOnline}
                />
              );
            })}
            <TypingIndicator conversationId={conversationId} />
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground shadow-lg hover:bg-primary/90 flex items-center gap-2"
        >
          {!isGroup && newMessagesCount > 0 ? (
            <>
              <span>↓ New messages ({newMessagesCount})</span>
            </>
          ) : (
            <span className="text-lg">↓</span>
          )}
        </button>
      )}
    </div>
  );
}
