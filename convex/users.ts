import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getByClerkId = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

export const list = query({
  args: {
    searchQuery: v.optional(v.string()),
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

    let usersQuery = ctx.db.query("users");

    const allUsers = await usersQuery.collect();
    
    // Filter out current user
    let filteredUsers = allUsers.filter((user) => user._id !== currentUser._id);

    // Filter by search query if provided
    if (args.searchQuery && args.searchQuery.trim() !== "") {
      const query = args.searchQuery.toLowerCase();
      filteredUsers = filteredUsers.filter(
        (user) =>
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
      );
    }

    return filteredUsers;
  },
});

export const get = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const updateName = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
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
      const clerkId = args.clerkId;
      currentUser = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
        .first();
    }

    if (!currentUser) {
      throw new Error("User not found");
    }

    // Verify the user is updating their own profile
    if (currentUser._id !== args.userId) {
      throw new Error("Unauthorized: Cannot update another user's profile");
    }

    // Update the user's name
    await ctx.db.patch(args.userId, {
      name: args.name.trim(),
    });

    return { success: true };
  },
});
