"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode, useMemo } from "react";
import { useAuth } from "@clerk/nextjs";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "";

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const { getToken, isLoaded } = useAuth();
  
  const convex = useMemo(() => {
    if (!convexUrl) {
      console.error("NEXT_PUBLIC_CONVEX_URL is not set!");
      return null;
    }

    return new ConvexReactClient(convexUrl, {
      async fetchToken() {
        if (!isLoaded) {
          console.log("Clerk not loaded yet, waiting...");
          return undefined;
        }
        try {
          const token = await getToken({ template: "convex" });
          if (token) {
            console.log("✅ Convex token fetched successfully");
            // Log token details for debugging (first 20 chars only)
            console.log("Token preview:", token.substring(0, 20) + "...");
          } else {
            console.warn("⚠️ No Convex token returned. This means:");
            console.warn("1. Clerk JWT template named 'convex' doesn't exist");
            console.warn("2. Go to Clerk Dashboard → JWT Templates → Create 'convex' template");
            console.warn("3. Then configure Convex Dashboard → Settings → Auth → Add Clerk issuer");
          }
          return token || undefined;
        } catch (error) {
          console.error("❌ Error fetching Convex token:", error);
          console.error("Error details:", error);
          return undefined;
        }
      },
    });
  }, [getToken, isLoaded]);

  if (!convex) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">Error: NEXT_PUBLIC_CONVEX_URL is not configured</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Please set NEXT_PUBLIC_CONVEX_URL in your .env.local file
          </p>
        </div>
      </div>
    );
  }

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
