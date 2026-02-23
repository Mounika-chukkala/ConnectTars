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
    <div className="flex flex-1 flex-col overflow-hidden bg-[#111B21] dark:bg-[#111B21] bg-card">
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex h-full items-center justify-center p-4">
            <div className="text-center">
              <p className="text-sm text-[#8696A0] dark:text-[#8696A0] text-muted-foreground">
                No {activeTab === "groups" ? "groups" : "conversations"} yet
              </p>
              <p className="mt-2 text-xs text-[#8696A0] dark:text-[#8696A0] text-muted-foreground">
                Start a new {activeTab === "groups" ? "group" : "conversation"} to get started
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[#2A3942] dark:divide-[#2A3942] divide-border">
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
      className={`w-full p-3 text-left transition-colors ${
        isSelected 
          ? "bg-[#2A3942] dark:bg-[#2A3942] bg-muted" 
          : "hover:bg-[#202C33] dark:hover:bg-[#202C33] hover:bg-muted/50"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="relative">
          <Avatar
            src={displayImage}
            alt={displayName}
            fallback={displayName.charAt(0).toUpperCase()}
            className="h-12 w-12"
          />
          {!conversation.isGroup && isOtherUserOnline && (
            <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-green-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-medium text-black dark:text-white text-foreground">{displayName}</p>
            {conversation.unreadCount > 0 && (
              <Badge variant="default" className="shrink-0 bg-[#25D366] dark:bg-[#25D366] bg-primary text-white">
                {conversation.unreadCount}
              </Badge>
            )}
          </div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="line-clamp-1 flex-1 text-sm text-[#8696A0] dark:text-[#8696A0] text-muted-foreground">
              {isTyping ? (
                <span className="italic text-primary">typing...</span>
              ) : (
                preview
              )}
            </p>
            {lastMessage && !isTyping && (
              <span className="text-xs text-[#8696A0] dark:text-[#8696A0] text-muted-foreground whitespace-nowrap shrink-0">
                {formatConversationTime(lastMessage.createdAt)}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
