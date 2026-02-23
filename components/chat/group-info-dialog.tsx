"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar } from "@/components/ui/avatar";
import { useUser } from "@clerk/nextjs";
import { formatDate } from "@/lib/utils";

interface GroupInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: Id<"conversations">;
  currentUserId: Id<"users">;
}

export function GroupInfoDialog({
  open,
  onOpenChange,
  conversationId,
  currentUserId,
}: GroupInfoDialogProps) {
  const { user } = useUser();
  const conversation = useQuery(api.conversations.get, { conversationId, clerkId: user?.id });

  if (!conversation || !conversation.isGroup) {
    return null;
  }

  // Get all participants' user data
  const participants = conversation.participants || [];
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Group Info</DialogTitle>
          <DialogDescription>
            View group details and members
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* Group Name */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">Group Name</label>
            <p className="mt-1 text-lg font-semibold">{conversation.groupName || "Unnamed Group"}</p>
          </div>

          {/* Group Creation Date */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">Created</label>
            <p className="mt-1 text-sm">
              {formatDate(conversation.createdAt)}
            </p>
          </div>

          {/* Group Members */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-3 block">
              Members ({participants.length})
            </label>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {participants.map((participantId) => (
                <GroupMemberItem
                  key={participantId}
                  userId={participantId}
                  isCurrentUser={participantId === currentUserId}
                />
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function GroupMemberItem({
  userId,
  isCurrentUser,
}: {
  userId: Id<"users">;
  isCurrentUser: boolean;
}) {
  const member = useQuery(api.users.get, { userId });

  if (!member) {
    return (
      <div className="flex items-center gap-3 p-2 rounded-lg">
        <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
        <div className="flex-1">
          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
      <Avatar
        src={member.imageUrl}
        alt={member.name}
        fallback={member.name.charAt(0).toUpperCase()}
        className="h-10 w-10"
      />
      <div className="flex-1">
        <p className="font-medium">
          {member.name}
          {isCurrentUser && <span className="text-xs text-muted-foreground ml-2">(You)</span>}
        </p>
        <p className="text-sm text-muted-foreground">{member.email}</p>
      </div>
    </div>
  );
}
