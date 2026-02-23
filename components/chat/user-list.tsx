"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

interface UserListProps {
  currentUserId: Id<"users">;
  onSelectUser: (conversationId: Id<"conversations">) => void;
}

export function UserList({ currentUserId, onSelectUser }: UserListProps) {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const users = useQuery(api.users.list, { searchQuery, clerkId: user?.id });
  const onlineUsers = useQuery(api.presence.getOnlineUsers, { clerkId: user?.id });
  const getOrCreateConversation = useMutation(api.conversations.getOrCreate);

  const handleUserClick = async (userId: Id<"users">) => {
    try {
      const conversationId = await getOrCreateConversation({
        otherUserId: userId,
        clerkId: user?.id,
      });
      onSelectUser(conversationId);
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  };

  if (users === undefined) {
    return (
      <div className="flex flex-1 flex-col gap-2 p-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  const isOnline = (userId: Id<"users">) => {
    return onlineUsers?.includes(userId) || false;
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {users.length === 0 ? (
          <div className="flex h-full items-center justify-center p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "No users found" : "No other users yet"}
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y">
            {users.map((user) => (
              <button
                key={user._id}
                onClick={() => handleUserClick(user._id)}
                className="w-full p-4 text-left transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar
                      src={user.imageUrl}
                      alt={user.name}
                      fallback={user.name.charAt(0).toUpperCase()}
                      className="h-12 w-12"
                    />
                    {isOnline(user._id) && (
                      <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-green-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-foreground">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
