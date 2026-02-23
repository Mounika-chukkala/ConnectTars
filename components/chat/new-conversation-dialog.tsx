"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar } from "@/components/ui/avatar";
import { Search, Users, UserPlus } from "lucide-react";
import { useUser } from "@clerk/nextjs";

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: Id<"users">;
  onSelectConversation: (conversationId: Id<"conversations">) => void;
}

export function NewConversationDialog({
  open,
  onOpenChange,
  currentUserId,
  onSelectConversation,
}: NewConversationDialogProps) {
  const { user } = useUser();
  const [mode, setMode] = useState<"select" | "group">("select");
  const [searchQuery, setSearchQuery] = useState("");
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<Id<"users">[]>([]);

  const users = useQuery(api.users.list, { searchQuery, clerkId: user?.id });
  const onlineUsers = useQuery(api.presence.getOnlineUsers, { clerkId: user?.id });
  const getOrCreateConversation = useMutation(api.conversations.getOrCreate);
  const createGroup = useMutation(api.conversations.createGroup);

  const handleUserClick = async (userId: Id<"users">) => {
    if (mode === "group") {
      // Toggle member selection
      if (selectedMembers.includes(userId)) {
        setSelectedMembers(selectedMembers.filter((id) => id !== userId));
      } else {
        setSelectedMembers([...selectedMembers, userId]);
      }
    } else {
      // Create 1-on-1 conversation
      try {
        const conversationId = await getOrCreateConversation({
          otherUserId: userId,
          clerkId: user?.id,
        });
        onSelectConversation(conversationId);
        onOpenChange(false);
        setSearchQuery("");
      } catch (error) {
        console.error("Error creating conversation:", error);
        alert("Failed to create conversation. Please try again.");
      }
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      alert("Please enter a group name");
      return;
    }

    if (selectedMembers.length < 2) {
      alert("Please select at least 2 other people for the group (3 people total including you)");
      return;
    }

    try {
      const conversationId = await createGroup({
        memberIds: selectedMembers,
        groupName: groupName.trim(),
        clerkId: user?.id,
      });
      onSelectConversation(conversationId);
      onOpenChange(false);
      setMode("select");
      setGroupName("");
      setSelectedMembers([]);
      setSearchQuery("");
    } catch (error) {
      console.error("Error creating group:", error);
      alert("Failed to create group. Please try again.");
    }
  };

  const isOnline = (userId: Id<"users">) => {
    return onlineUsers?.includes(userId) || false;
  };

  const isSelected = (userId: Id<"users">) => {
    return selectedMembers.includes(userId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "group" ? "Create Group" : "New Conversation"}
          </DialogTitle>
          <DialogDescription>
            {mode === "group"
              ? "Select at least 2 people to create a group"
              : "Start a conversation with someone"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button
            variant={mode === "select" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setMode("select");
              setSelectedMembers([]);
              setGroupName("");
            }}
            className="flex-1"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            One-on-One
          </Button>
          <Button
            variant={mode === "group" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("group")}
            className="flex-1"
          >
            <Users className="mr-2 h-4 w-4" />
            Group
          </Button>
        </div>

        {mode === "group" && (
          <div className="mb-4">
            <Input
              placeholder="Group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="mb-2"
            />
            {selectedMembers.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {selectedMembers.length} member{selectedMembers.length !== 1 ? "s" : ""} selected
                {selectedMembers.length < 2 && " (need at least 2)"}
              </p>
            )}
          </div>
        )}

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {users === undefined ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="flex h-32 items-center justify-center">
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "No users found" : "No other users"}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {users.map((user) => (
                <button
                  key={user._id}
                  onClick={() => handleUserClick(user._id)}
                  className={`w-full p-3 text-left transition-colors rounded-lg hover:bg-muted/50 ${
                    mode === "group" && isSelected(user._id)
                      ? "bg-primary/10 border border-primary"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar
                        src={user.imageUrl}
                        alt={user.name}
                        fallback={user.name.charAt(0).toUpperCase()}
                        className="h-10 w-10"
                      />
                      {isOnline(user._id) && (
                        <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-green-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">{user.name}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                    {mode === "group" && isSelected(user._id) && (
                      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <span className="text-xs text-primary-foreground">✓</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {mode === "group" && (
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setMode("select");
                setGroupName("");
                setSelectedMembers([]);
                setSearchQuery("");
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateGroup}
              disabled={!groupName.trim() || selectedMembers.length < 2}
              className="flex-1"
            >
              Create Group
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
