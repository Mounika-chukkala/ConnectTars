"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode, useMemo, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "";

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const { getToken, isLoaded } = useAuth();
  
  const convex = useMemo(() => {
    if (!convexUrl) {
      console.error("NEXT_PUBLIC_CONVEX_URL is not set!");
      return null;
    }

    return new ConvexReactClient(convexUrl);
  }, [convexUrl]);

  useEffect(() => {
    if (!convex || !isLoaded) return;
    
    const updateAuth = async () => {
      try {
        const token = await getToken({ template: "convex" });
        if (token) {
          convex.setAuth(async () => token);
        } else {
          convex.clearAuth();
        }
      } catch (error) {
        console.error("Error fetching Convex token:", error);
        convex.clearAuth();
      }
    };
    
    updateAuth();
    
    // Refresh token periodically (every 55 minutes, tokens expire after 60)
    const interval = setInterval(updateAuth, 55 * 60 * 1000);
    return () => clearInterval(interval);
  }, [convex, getToken, isLoaded]);

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
