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
  const userByClerkId = useQuery(
    api.users.getByClerkId,
    user ? { clerkId: user.id } : "skip"
  );
  const getOrCreateUser = useMutation(api.auth.getOrCreateUser);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  
  const effectiveUser = currentUser !== null && currentUser !== undefined ? currentUser : userByClerkId;

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    if (effectiveUser === undefined) {
      return;
    }

    if (user && effectiveUser === null && !isCreatingUser) {
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
          console.error("Error creating user:", error);
          setIsCreatingUser(false);
        });
      return;
    }

    if (effectiveUser) {
      router.push("/chat");
      return;
    }
  }, [isLoaded, isSignedIn, user, effectiveUser, router, getOrCreateUser, isCreatingUser]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-muted-foreground/20 border-t-muted-foreground"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
