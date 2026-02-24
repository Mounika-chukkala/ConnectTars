"use client";

import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SignOutPage() {
  const { signOut } = useClerk();
  const router = useRouter();

  useEffect(() => {
    signOut(() => {
      router.push("/sign-in");
    });
  }, [signOut, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-muted-foreground/20 border-t-muted-foreground"></div>
        <p className="text-muted-foreground">Signing out...</p>
      </div>
    </div>
  );
}
