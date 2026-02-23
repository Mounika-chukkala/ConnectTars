"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";

export default function Home() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const currentUser = useQuery(api.auth.getCurrentUser);
  // Fallback: try to get user by clerkId if auth isn't configured
  const userByClerkId = useQuery(
    api.users.getByClerkId,
    user ? { clerkId: user.id } : "skip"
  );
  const getOrCreateUser = useMutation(api.auth.getOrCreateUser);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  
  // Use currentUser if available and not null, otherwise fall back to userByClerkId
  // If currentUser is null (auth not configured), use userByClerkId
  const effectiveUser = currentUser !== null && currentUser !== undefined ? currentUser : userByClerkId;

  // Debug logging
  useEffect(() => {
    console.log("=== AUTH DEBUG ===");
    console.log("Auth state:", { isLoaded, isSignedIn, hasUser: !!user, clerkId: user?.id });
    console.log("Convex user (via auth):", currentUser);
    console.log("Convex user (via clerkId):", userByClerkId);
    console.log("Effective user:", effectiveUser);
    console.log("isCreatingUser:", isCreatingUser);
    
    if (currentUser === null && user) {
      console.log("🔄 Auth returned null, using fallback query with clerkId:", user.id);
    }
    
    if (effectiveUser) {
      console.log("✅ User found! Should redirect to /chat");
    } else if (effectiveUser === null && user && !isCreatingUser) {
      console.log("⚠️ User not found, will create user");
    }
  }, [isLoaded, isSignedIn, user, currentUser, userByClerkId, effectiveUser, isCreatingUser]);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    // effectiveUser can be: undefined (loading), null (not found), or user object
    if (effectiveUser === undefined) {
      // Still loading, wait
      return;
    }

    if (user && effectiveUser === null && !isCreatingUser) {
      // User is signed in but doesn't exist in Convex yet - create them
      setIsCreatingUser(true);
      console.log("Creating user in Convex...", {
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
          console.log("✅ User created successfully:", userId);
          setIsCreatingUser(false);
          // The userByClerkId query should automatically refetch and find the user
          console.log("Waiting for query to refetch...");
        })
        .catch((error) => {
          console.error("Error creating user:", error);
          console.error("Error details:", {
            message: error.message,
            stack: error.stack,
          });
          setIsCreatingUser(false);
        });
      return;
    }

    if (effectiveUser) {
      // User exists, navigate to chat
      console.log("🚀 Redirecting to /chat with user:", effectiveUser._id);
      router.push("/chat");
      return;
    }
  }, [isLoaded, isSignedIn, user, effectiveUser, router, getOrCreateUser, isCreatingUser]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
