"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { GroupInfoDialog } from "./group-info-dialog";

interface ChatAreaProps {
  conversationId: Id<"conversations">;
  currentUserId: Id<"users">;
  onBack?: () => void;
}

export function ChatArea({
  conversationId,
  currentUserId,
  onBack,
}: ChatAreaProps) {
  const { user } = useUser();
  const conversation = useQuery(api.conversations.get, { conversationId, clerkId: user?.id });
  const markAsRead = useMutation(api.conversations.markAsRead);
  const [isMobile, setIsMobile] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Id<"messages"> | null>(null);
  const [showGroupInfo, setShowGroupInfo] = useState(false);

  // Always call useQuery hooks before any early returns to maintain hook order
  // Check if other user is online (must be called on every render)
  const onlineUsers = useQuery(api.presence.getOnlineUsers, { clerkId: user?.id });

  // Calculate other participants (safe even if conversation is undefined)
  const otherParticipants = conversation?.participants?.filter(
    (id) => id !== currentUserId
  ) || [];

  // Always call useQuery with the same structure to avoid hooks order issues
  // This hook must be called on every render, even when conversation is undefined
  const shouldFetchOtherUser = conversation && !conversation.isGroup && otherParticipants.length === 1;
  const otherUser = useQuery(
    api.users.get,
    shouldFetchOtherUser && otherParticipants[0]
      ? { userId: otherParticipants[0] }
      : "skip"
  );

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    const handleResize = () => checkMobile();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (conversation) {
      markAsRead({ conversationId, clerkId: user?.id });
    }
  }, [conversation, conversationId, markAsRead, user]);

  if (conversation === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Conversation not found</p>
        </div>
      </div>
    );
  }

  const displayName = conversation.isGroup
    ? conversation.groupName || "Group Chat"
    : otherUser?.name || "Unknown User";

  const displayImage = conversation.isGroup ? undefined : otherUser?.imageUrl;

  // Check if other user is online (onlineUsers hook is already called above)
  const isOtherUserOnline = !conversation.isGroup && 
    otherParticipants.length === 1 && 
    otherUser &&
    onlineUsers?.includes(otherUser._id);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b dark:bg-[#202C33] bg-card p-4">
        {isMobile && onBack && (
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="relative">
          <Avatar
            src={displayImage}
            alt={displayName}
            fallback={displayName.charAt(0).toUpperCase()}
            className="h-10 w-10"
          />
          {!conversation.isGroup && isOtherUserOnline && (
            <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-green-500" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold">{displayName}</p>
            {conversation.isGroup && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowGroupInfo(true)}
                title="Group info"
                className="h-6 w-6"
              >
                <Info className="h-4 w-4" />
              </Button>
            )}
          </div>
          {conversation.isGroup ? (
            <p className="text-sm text-muted-foreground">
              {conversation.participants.length} members
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {isOtherUserOnline ? "online" : "offline"}
            </p>
          )}
        </div>
      </div>

      {/* Group Info Dialog */}
      {conversation.isGroup && (
        <GroupInfoDialog
          open={showGroupInfo}
          onOpenChange={setShowGroupInfo}
          conversationId={conversationId}
          currentUserId={currentUserId}
        />
      )}

      {/* Messages */}
      <MessageList
        conversationId={conversationId}
        currentUserId={currentUserId}
        onReply={setReplyingTo}
        isGroup={conversation.isGroup}
        isOtherUserOnline={isOtherUserOnline || false}
      />

      {/* Input */}
      <MessageInput 
        conversationId={conversationId} 
        replyingTo={replyingTo}
        onClearReply={() => setReplyingTo(null)}
      />
    </div>
  );
}
