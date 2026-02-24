"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ConversationSidebar } from "@/components/chat/conversation-sidebar";
import { ChatArea } from "@/components/chat/chat-area";
import { UserList } from "@/components/chat/user-list";
import { Button } from "@/components/ui/button";
import { LogOut, Users, MessageSquare, Plus, User } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { NewConversationDialog } from "@/components/chat/new-conversation-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { ProfileDialog } from "@/components/chat/profile-dialog";

export default function ChatPage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [selectedConversationId, setSelectedConversationId] = useState<Id<"conversations"> | null>(null);
  const [showUserList, setShowUserList] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showNewConversationDialog, setShowNewConversationDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<"messages" | "groups">("messages");
  const [showProfileDialog, setShowProfileDialog] = useState(false);

  const currentUser = useQuery(api.auth.getCurrentUser);
  const userByClerkId = useQuery(
    api.users.getByClerkId,
    user ? { clerkId: user.id } : "skip"
  );
  const effectiveUser = currentUser !== null && currentUser !== undefined ? currentUser : userByClerkId;
  const getOrCreateUser = useMutation(api.auth.getOrCreateUser);
  const updatePresence = useMutation(api.presence.updatePresence);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.push("/sign-in");
      return;
    }
  }, [isLoaded, user, router]);

  useEffect(() => {
    if (!isLoaded || !user) return;
    
    if (effectiveUser === undefined) {
      return;
    }

    if (effectiveUser === null && !isCreatingUser) {
      setIsCreatingUser(true);
      
      getOrCreateUser({
        clerkId: user.id,
        name: user.fullName || user.firstName || user.emailAddresses[0]?.emailAddress || "User",
        email: user.emailAddresses[0]?.emailAddress || "",
        imageUrl: user.imageUrl,
      })
        .then((userId) => {
          setIsCreatingUser(false);
        })
        .catch((error) => {
          console.error("Error creating user from chat page:", error);
          setIsCreatingUser(false);
        });
    }
  }, [isLoaded, user, effectiveUser, getOrCreateUser, isCreatingUser]);

  useEffect(() => {
    if (effectiveUser) {
      const updatePresenceStatus = () => {
        if (document.visibilityState === "visible") {
          updatePresence({ clerkId: user?.id });
        }
      };

      updatePresenceStatus();
      const interval = setInterval(updatePresenceStatus, 10000);
      document.addEventListener("visibilitychange", updatePresenceStatus);

      return () => {
        clearInterval(interval);
        document.removeEventListener("visibilitychange", updatePresenceStatus);
      };
    }
  }, [effectiveUser, updatePresence, user]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!isLoaded || effectiveUser === undefined || isCreatingUser) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">
            {isCreatingUser ? "Creating your account..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  if (!effectiveUser && user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Setting up your account...</p>
        </div>
      </div>
    );
  }

  if (!effectiveUser) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">User not found. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen overflow-hidden bg-background">
      {/* Theme Toggle - Top Right Corner */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Left Navigation Panel */}
      <div className="flex w-16 flex-col items-center border-r border-border/50 bg-gradient-to-b from-card via-card to-card/95 dark:from-[#202C33] dark:via-[#1a2529] dark:to-[#1a2529] backdrop-blur-sm py-3 md:w-20">
        <div className="flex flex-1 flex-col items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setActiveTab("messages")}
            className={`h-12 w-12 rounded-xl transition-all ${
              activeTab === "messages"
                ? "bg-primary/10 text-primary shadow-md"
                : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
            }`}
            title="Messages"
          >
            <MessageSquare className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setActiveTab("groups")}
            className={`h-12 w-12 rounded-xl transition-all ${
              activeTab === "groups"
                ? "bg-primary/10 text-primary shadow-md"
                : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
            }`}
            title="Groups"
          >
            <Users className="h-6 w-6" />
          </Button>
        </div>
        <div className="mt-auto">
          <DropdownMenu
            trigger={
          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 rounded-xl text-muted-foreground hover:bg-primary/10 hover:ring-2 hover:ring-primary/20 transition-all p-0"
            title="User menu"
          >
            <Avatar
              src={user?.imageUrl}
              alt={user?.fullName || "User"}
              fallback={(user?.fullName || "U").charAt(0).toUpperCase()}
              className="h-10 w-10 ring-2 ring-primary/20 dark:ring-primary/30"
            />
          </Button>
            }
            align="end"
          >
            {effectiveUser && (
              <DropdownMenuItem
                onClick={() => setShowProfileDialog(true)}
              >
                <User className="mr-2 h-4 w-4" />
                Manage Profile
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => {
                signOut(() => {
                  router.push("/sign-in");
                });
              }}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenu>
        </div>
      </div>

      {/* Sidebar - Conversation List */}
      <div
        className={`${
          isMobile && showUserList ? "hidden" : isMobile && selectedConversationId ? "hidden" : "flex"
        } w-full flex-col border-r border-border/50 bg-gradient-to-b from-card via-card to-card/95 dark:from-[#111B21] dark:via-[#0d1519] dark:to-[#0d1519] md:flex md:w-80 lg:w-96`}
      >
        <div className="flex items-center justify-between border-b border-border/50 bg-gradient-to-r from-card via-card to-card/95 dark:from-[#202C33] dark:via-[#1a2529] dark:to-[#1a2529] backdrop-blur-sm p-4 shadow-sm">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">ConnectTars</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNewConversationDialog(true)}
              title="New Conversation"
              className="h-9 w-9 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all rounded-lg"
            >
              <Plus className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowUserList(!showUserList)}
              className="md:hidden h-9 w-9 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all rounded-lg"
            >
              <Users className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <ConversationSidebar
          currentUserId={effectiveUser._id}
          selectedConversationId={selectedConversationId}
          onSelectConversation={setSelectedConversationId}
          activeTab={activeTab}
        />
      </div>

      {/* User List (Mobile overlay) */}
      {showUserList && (
        <div
          className={`${
            isMobile ? "fixed inset-0 z-50 bg-background" : "hidden"
          } md:relative md:flex md:w-64 md:flex-col md:border-r`}
        >
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="text-lg font-semibold">Users</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowUserList(false)}
              className="md:hidden"
            >
              ←
            </Button>
          </div>
          <UserList
            currentUserId={effectiveUser._id}
            onSelectUser={(conversationId) => {
              setSelectedConversationId(conversationId);
              setShowUserList(false);
            }}
          />
        </div>
      )}

      {/* Chat Area */}
      <div className={`flex flex-1 flex-col ${
        isMobile && !selectedConversationId ? "hidden" : ""
      }`}>
        {selectedConversationId ? (
          <ChatArea
            conversationId={selectedConversationId}
            currentUserId={effectiveUser._id}
            onBack={() => {
              setSelectedConversationId(null);
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
            <div className="text-center p-8">
              <div className="mx-auto mb-6 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>
              <h2 className="mb-2 text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Select a chat</h2>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Choose a conversation from the sidebar to start chatting
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Profile Dialog */}
      {effectiveUser && (
        <ProfileDialog
          open={showProfileDialog}
          onOpenChange={setShowProfileDialog}
          currentUserId={effectiveUser._id}
        />
      )}

      {/* New Conversation Dialog */}
      <NewConversationDialog
        open={showNewConversationDialog}
        onOpenChange={setShowNewConversationDialog}
        currentUserId={effectiveUser._id}
        onSelectConversation={(conversationId) => {
          setSelectedConversationId(conversationId);
          if (isMobile) {
            setShowUserList(false);
          }
        }}
      />
    </div>
  );
}
