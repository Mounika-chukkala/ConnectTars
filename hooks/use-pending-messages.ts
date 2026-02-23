"use client";

import { useState, useEffect, useCallback } from "react";
import { Id } from "@/convex/_generated/dataModel";

export interface PendingMessage {
  id: string; // Temporary ID for pending messages
  conversationId: Id<"conversations">;
  content: string;
  replyTo?: Id<"messages">;
  createdAt: number;
  status: "pending" | "failed";
}

const STORAGE_KEY = "pending_messages";

export function usePendingMessages() {
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);
  const [isOnline, setIsOnline] = useState(true);

  // Load pending messages from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setPendingMessages(parsed);
        } catch (error) {
          console.error("Error loading pending messages:", error);
        }
      }

      // Check initial online status
      setIsOnline(navigator.onLine);

      // Listen for online/offline events
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  // Save pending messages to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingMessages));
    }
  }, [pendingMessages]);

  const addPendingMessage = useCallback((
    conversationId: Id<"conversations">,
    content: string,
    replyTo?: Id<"messages">
  ): string => {
    const newMessage: PendingMessage = {
      id: `pending_${Date.now()}_${Math.random()}`,
      conversationId,
      content,
      replyTo,
      createdAt: Date.now(),
      status: "pending",
    };

    setPendingMessages((prev) => [...prev, newMessage]);
    return newMessage.id;
  }, []);

  const removePendingMessage = useCallback((id: string) => {
    setPendingMessages((prev) => prev.filter((msg) => msg.id !== id));
  }, []);

  const markAsFailed = useCallback((id: string) => {
    setPendingMessages((prev) =>
      prev.map((msg) =>
        msg.id === id ? { ...msg, status: "failed" as const } : msg
      )
    );
  }, []);

  const updateTimestamp = useCallback((id: string) => {
    setPendingMessages((prev) =>
      prev.map((msg) =>
        msg.id === id ? { ...msg, createdAt: Date.now(), status: "pending" as const } : msg
      )
    );
  }, []);

  const getPendingMessagesForConversation = useCallback(
    (conversationId: Id<"conversations">) => {
      return pendingMessages.filter(
        (msg) => msg.conversationId === conversationId
      );
    },
    [pendingMessages]
  );

  return {
    pendingMessages,
    isOnline,
    addPendingMessage,
    removePendingMessage,
    markAsFailed,
    updateTimestamp,
    getPendingMessagesForConversation,
  };
}
