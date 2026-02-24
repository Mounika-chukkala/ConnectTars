"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { formatConversationTime } from "@/lib/utils";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";

interface ConversationSidebarProps {
  currentUserId: Id<"users">;
  selectedConversationId: Id<"conversations"> | null;
  onSelectConversation: (id: Id<"conversations">) => void;
  activeTab?: "messages" | "groups";
}

export function ConversationSidebar({
  currentUserId,
  selectedConversationId,
  onSelectConversation,
  activeTab = "messages",
}: ConversationSidebarProps) {
  const { user } = useUser();
  const conversations = useQuery(api.conversations.list, { clerkId: user?.id });
  const markAsRead = useMutation(api.conversations.markAsRead);
  const onlineUsers = useQuery(api.presence.getOnlineUsers, { clerkId: user?.id });
  const typingStatus = useQuery(api.typing.getConversationsTypingStatus, { clerkId: user?.id });

  // Filter conversations based on active tab
  const filteredConversations = conversations?.filter((conv) => {
    if (activeTab === "groups") {
      return conv.isGroup;
    }
    // In messages tab, show all conversations (both individual and groups)
    return true;
  }) || [];

  const handleSelectConversation = async (id: Id<"conversations">) => {
    onSelectConversation(id);
    await markAsRead({ conversationId: id, clerkId: user?.id });
  };

  if (conversations === undefined) {
    return (
      <div className="flex flex-1 flex-col gap-2 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-gradient-to-b from-card via-card to-card/95 dark:from-[#111B21] dark:via-[#111B21] dark:to-[#0d1519]">
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {filteredConversations.length === 0 ? (
          <div className="flex h-full items-center justify-center p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                No {activeTab === "groups" ? "groups" : "conversations"} yet
              </p>
              <p className="mt-2 text-xs text-muted-foreground/70">
                Start a new {activeTab === "groups" ? "group" : "conversation"} to get started
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filteredConversations.map((conv) => (
              <ConversationItem
                key={conv._id}
                conversation={conv}
                currentUserId={currentUserId}
                isSelected={selectedConversationId === conv._id}
                onClick={() => handleSelectConversation(conv._id)}
                onlineUsers={onlineUsers}
                isTyping={typingStatus?.[conv._id] !== undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ConversationItemProps {
  conversation: any;
  currentUserId: Id<"users">;
  isSelected: boolean;
  onClick: () => void;
  onlineUsers?: Id<"users">[];
  isTyping?: boolean;
}

function ConversationItem({
  conversation,
  currentUserId,
  isSelected,
  onClick,
  onlineUsers,
  isTyping = false,
}: ConversationItemProps) {
  const otherParticipants = conversation.participants.filter(
    (id: Id<"users">) => id !== currentUserId
  );
  const otherUser = useQuery(
    api.users.get,
    !conversation.isGroup && otherParticipants.length === 1
      ? { userId: otherParticipants[0] }
      : "skip"
  );

  // Check if other user is online
  const isOtherUserOnline = !conversation.isGroup && 
    otherParticipants.length === 1 && 
    otherUser &&
    onlineUsers?.includes(otherUser._id);

  const displayName = conversation.isGroup
    ? conversation.groupName
    : otherUser?.name || "Unknown User";

  const displayImage = conversation.isGroup
    ? undefined
    : otherUser?.imageUrl;

  const lastMessage = conversation.lastMessage;
  const preview = lastMessage
    ? lastMessage.isDeleted
      ? "This message was deleted"
      : lastMessage.content
    : "No messages yet";

  return (
    <button
      onClick={onClick}
      className={`w-full p-3.5 text-left transition-all duration-200 ${
        isSelected 
          ? "bg-muted/50 dark:bg-muted/30 border-l-4 border-foreground/30 dark:border-foreground/50 shadow-sm" 
          : "hover:bg-muted/50 dark:hover:bg-muted/30 border-l-4 border-transparent"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <Avatar
            src={displayImage}
            alt={displayName}
            fallback={displayName.charAt(0).toUpperCase()}
            className="h-12 w-12 ring-2 ring-muted-foreground/10 dark:ring-muted-foreground/20 transition-all"
          />
          {!conversation.isGroup && isOtherUserOnline && (
            <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-background bg-green-500 shadow-lg" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="truncate font-semibold text-foreground">{displayName}</p>
            {conversation.unreadCount > 0 && (
              <Badge variant="default" className="shrink-0 bg-foreground text-background text-xs font-semibold px-2 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
                {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="line-clamp-1 flex-1 text-sm text-muted-foreground">
              {isTyping ? (
                <span className="italic text-foreground font-medium animate-pulse">typing...</span>
              ) : (
                preview
              )}
            </p>
            {lastMessage && !isTyping && (
              <span className="text-xs text-muted-foreground/70 whitespace-nowrap shrink-0">
                {formatConversationTime(lastMessage.createdAt)}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
