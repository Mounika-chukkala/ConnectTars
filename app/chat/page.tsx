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
  // Fallback: try to get user by clerkId if auth isn't configured
  const userByClerkId = useQuery(
    api.users.getByClerkId,
    user ? { clerkId: user.id } : "skip"
  );
  // Use currentUser if available and not null, otherwise fall back to userByClerkId
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

  // Create user if they don't exist yet
  useEffect(() => {
    if (!isLoaded || !user) return;
    
    // effectiveUser can be: undefined (loading), null (not found), or user object
    if (effectiveUser === undefined) {
      // Still loading, wait
      return;
    }

    if (effectiveUser === null && !isCreatingUser) {
      // User is signed in but doesn't exist in Convex yet - create them
      setIsCreatingUser(true);
      console.log("Creating user in Convex from chat page...", {
        clerkId: user.id,
        name: user.fullName || user.firstName || "User",
        email: user.emailAddresses[0]?.emailAddress || "",
      });
      
      getOrCreateUser({
        clerkId: user.id,
        name: user.fullName || user.firstName || user.emailAddresses[0]?.emailAddress || "User",
        email: user.emailAddresses[0]?.emailAddress || "",
        imageUrl: user.imageUrl,
      })
        .then((userId) => {
          console.log("✅ User created successfully from chat page:", userId);
          setIsCreatingUser(false);
          // The userByClerkId query should automatically refetch and find the user
        })
        .catch((error) => {
          console.error("Error creating user from chat page:", error);
          setIsCreatingUser(false);
        });
    }
  }, [isLoaded, user, effectiveUser, getOrCreateUser, isCreatingUser]);

  useEffect(() => {
    // Update presence when tab is visible and every 10 seconds
    if (effectiveUser) {
      const updatePresenceStatus = () => {
        // Only update if tab is visible
        if (document.visibilityState === "visible") {
          updatePresence({ clerkId: user?.id });
        }
      };

      // Update immediately
      updatePresenceStatus();

      // Update every 10 seconds
      const interval = setInterval(updatePresenceStatus, 10000);

      // Update when tab becomes visible
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
    // User creation might have failed, try redirecting back to home to retry
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
      <div className="flex w-16 flex-col items-center border-r dark:bg-[#202C33] bg-muted/50 py-2 md:w-20">
        <div className="flex flex-1 flex-col items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setActiveTab("messages")}
            className={`h-12 w-12 rounded-lg ${
              activeTab === "messages"
                ? "dark:bg-[#2A3942] bg-primary/10 text-primary dark:text-primary"
                : "text-muted-foreground dark:hover:bg-[#2A3942] hover:bg-primary/10"
            }`}
            title="Messages"
          >
            <MessageSquare className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setActiveTab("groups")}
            className={`h-12 w-12 rounded-lg ${
              activeTab === "groups"
                ? "dark:bg-[#2A3942] bg-muted text-primary"
                : "text-muted-foreground dark:hover:bg-[#2A3942] hover:bg-muted"
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
            className="h-12 w-12 rounded-lg text-muted-foreground dark:hover:bg-[#2A3942] hover:bg-muted p-0"
                title="User menu"
          >
            <Avatar
              src={user?.imageUrl}
              alt={user?.fullName || "User"}
              fallback={(user?.fullName || "U").charAt(0).toUpperCase()}
              className="h-10 w-10"
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
        } w-full flex-col border-r bg-[#111B21] dark:bg-[#111B21] bg-card md:flex md:w-80 lg:w-96`}
      >
        <div className="flex items-center justify-between border-b dark:border-[#2A3942] bg-[#202C33] dark:bg-[#202C33] bg-muted/50 p-4">
          <h1 className="text-lg font-semibold dark:text-white text-foreground">ConnectTars</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNewConversationDialog(true)}
              title="New Conversation"
              className="text-muted-foreground dark:hover:bg-[#2A3942] hover:bg-muted hover:text-foreground"
            >
              <Plus className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowUserList(!showUserList)}
              className="md:hidden text-muted-foreground dark:hover:bg-[#2A3942] hover:bg-muted hover:text-foreground"
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
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h2 className="mb-2 text-xl font-semibold">Select chat to open</h2>
              <p className="text-muted-foreground">
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
