import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const setTyping = mutation({
  args: {
    conversationId: v.id("conversations"),
    isTyping: v.boolean(),
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
      .query("typingIndicators")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .filter((q) => q.eq(q.field("userId"), currentUser._id))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        isTyping: args.isTyping,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("typingIndicators", {
        conversationId: args.conversationId,
        userId: currentUser._id,
        isTyping: args.isTyping,
        updatedAt: Date.now(),
      });
    }
  },
});

export const getTypingUsers = query({
  args: {
    conversationId: v.id("conversations"),
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
      return [];
    }

    const typingIndicators = await ctx.db
      .query("typingIndicators")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("isTyping"), true),
          q.neq(q.field("userId"), currentUser._id)
        )
      )
      .collect();

    // Filter out stale typing indicators (older than 2 seconds)
    const now = Date.now();
    const twoSecondsAgo = now - 2000;

    const activeTyping = typingIndicators
      .filter((indicator) => indicator.updatedAt > twoSecondsAgo)
      .map((indicator) => indicator.userId);

    return activeTyping;
  },
});

// Get typing status for all conversations (for sidebar) - returns which OTHER users are typing
export const getConversationsTypingStatus = query({
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
      return {};
    }

    // Get all typing indicators where OTHER users (not current user) are typing
    const typingIndicators = await ctx.db
      .query("typingIndicators")
      .filter((q) =>
        q.and(
          q.neq(q.field("userId"), currentUser._id),
          q.eq(q.field("isTyping"), true)
        )
      )
      .collect();

    // Filter out stale typing indicators (older than 2 seconds)
    const now = Date.now();
    const twoSecondsAgo = now - 2000;

    const activeTyping = typingIndicators
      .filter((indicator) => indicator.updatedAt > twoSecondsAgo);

    // Return a map of conversationId -> userId who is typing
    const typingMap: Record<string, Id<"users">> = {};
    activeTyping.forEach((indicator) => {
      typingMap[indicator.conversationId] = indicator.userId;
    });

    return typingMap;
  },
});
