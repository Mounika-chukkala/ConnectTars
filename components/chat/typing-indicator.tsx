"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";

interface TypingIndicatorProps {
  conversationId: Id<"conversations">;
}

export function TypingIndicator({ conversationId }: TypingIndicatorProps) {
  const { user } = useUser();
  const typingUserIds = useQuery(api.typing.getTypingUsers, {
    conversationId,
    clerkId: user?.id,
  });

  if (!typingUserIds || typingUserIds.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div className="flex gap-1">
        <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
        <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
        <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
      </div>
      <span className="text-sm text-muted-foreground">typing...</span>
    </div>
  );
}
