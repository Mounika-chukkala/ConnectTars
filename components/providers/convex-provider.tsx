"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode, useMemo, useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "";

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const { getToken, isLoaded } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  
  useEffect(() => {
    if (!isLoaded) return;
    
    const fetchToken = async () => {
      try {
        const clerkToken = await getToken({ template: "convex" });
        if (clerkToken) {
          console.log("✅ Convex token fetched successfully");
          setToken(clerkToken);
        } else {
          console.warn("⚠️ No Convex token returned. This means:");
          console.warn("1. Clerk JWT template named 'convex' doesn't exist");
          console.warn("2. Go to Clerk Dashboard → JWT Templates → Create 'convex' template");
          console.warn("3. Then configure Convex Dashboard → Settings → Auth → Add Clerk issuer");
          setToken(null);
        }
      } catch (error) {
        console.error("❌ Error fetching Convex token:", error);
        setToken(null);
      }
    };
    
    fetchToken();
    
    // Refresh token periodically (every 55 minutes, tokens expire after 60)
    const interval = setInterval(fetchToken, 55 * 60 * 1000);
    return () => clearInterval(interval);
  }, [getToken, isLoaded]);
  
  const convex = useMemo(() => {
    if (!convexUrl) {
      console.error("NEXT_PUBLIC_CONVEX_URL is not set!");
      return null;
    }

    return new ConvexReactClient(convexUrl);
  }, [convexUrl]);

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

  return <ConvexProvider client={convex} token={token || undefined}>{children}</ConvexProvider>;
}
