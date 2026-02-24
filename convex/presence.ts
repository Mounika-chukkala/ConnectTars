import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const updatePresence = mutation({
  args: {
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let currentUser;
    
    const identity = await ctx.auth.getUserIdentity();
    if (identity) {
      currentUser = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .first();
    }
    
    if (!currentUser && args.clerkId) {
      const clerkId = args.clerkId; // Type guard
      currentUser = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
        .first();
    }

    if (!currentUser) {
      // Silently fail if user not found (auth not configured)
      return;
    }

    const existing = await ctx.db
      .query("presence")
      .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        lastSeen: Date.now(),
        isOnline: true,
      });
    } else {
      await ctx.db.insert("presence", {
        userId: currentUser._id,
        lastSeen: Date.now(),
        isOnline: true,
      });
    }
  },
});

export const getOnlineUsers = query({
  args: {
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let currentUser;
    
    const identity = await ctx.auth.getUserIdentity();
    if (identity) {
      currentUser = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .first();
    }
    
    if (!currentUser && args.clerkId) {
      const clerkId = args.clerkId; // Type guard
      currentUser = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
        .first();
    }

    const onlinePresence = await ctx.db
      .query("presence")
      .filter((q) => q.eq(q.field("isOnline"), true))
      .collect();

    // Filter out users who haven't been seen in the last 30 seconds
    const now = Date.now();
    const thirtySecondsAgo = now - 30000;

    const activeUsers = onlinePresence
      .filter((p) => p.lastSeen > thirtySecondsAgo)
      .map((p) => p.userId);

    return activeUsers;
  },
});
