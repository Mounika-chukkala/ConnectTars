"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useUser } from "@clerk/nextjs";

interface MessageReactionsProps {
  messageId: Id<"messages">;
  currentReactions: Record<string, number>;
  userReactions: string[];
  onClose?: () => void;
  compact?: boolean;
}

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

export function MessageReactions({
  messageId,
  currentReactions,
  userReactions,
  onClose,
  compact = false,
}: MessageReactionsProps) {
  const { user } = useUser();
  const addReaction = useMutation(api.messages.addReaction);

  const handleReactionClick = async (emoji: string) => {
    try {
      await addReaction({ messageId, emoji, clerkId: user?.id });
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error("Error adding reaction:", error);
    }
  };

  // WhatsApp-style horizontal bar above message
  if (compact) {
    // Show existing reactions as clickable emojis
    // Safely handle reactions object - ensure it's a plain object
    const safeReactions = currentReactions && typeof currentReactions === 'object' ? currentReactions : {};
    const reactionEntries = Object.entries(safeReactions).filter(([_, count]) => count > 0);
    
    if (reactionEntries.length === 0) {
      return null;
    }

    return (
      <div className="mb-1 flex items-center gap-1">
        {reactionEntries.map(([emoji, count]) => (
          <button
            key={emoji}
            onClick={() => handleReactionClick(emoji)}
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-sm transition-colors ${
              userReactions && userReactions.includes(emoji)
                ? "bg-primary/20 dark:bg-primary/30"
                : "bg-muted/50 dark:bg-[#2A3942]/50 hover:bg-muted dark:hover:bg-[#2A3942]"
            }`}
            title={`${count} reaction${count !== 1 ? "s" : ""}`}
          >
            <span className="text-base">{emoji}</span>
            {count > 1 && (
              <span className="text-xs text-muted-foreground">{count}</span>
            )}
          </button>
        ))}
      </div>
    );
  }

  // Reaction picker - horizontal bar of emojis (appears on click, absolute positioned)
  return (
    <div className="flex items-center gap-1 rounded-lg border bg-card p-2 shadow-lg whitespace-nowrap">
      {REACTION_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => handleReactionClick(emoji)}
          className={`rounded-full p-1.5 text-xl transition-all hover:scale-110 shrink-0 ${
            userReactions && userReactions.includes(emoji)
              ? "bg-primary/20 dark:bg-primary/30"
              : "hover:bg-muted"
          }`}
          title={`React with ${emoji}`}
        >
          {emoji}
        </button>
      ))}
      {onClose && (
        <button
          onClick={onClose}
          className="ml-1 rounded-full p-1 hover:bg-muted shrink-0"
          title="Close"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
