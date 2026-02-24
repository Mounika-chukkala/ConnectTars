import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
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
      return [];
    }

    // Get all conversations and filter by participant
    const allConversations = await ctx.db.query("conversations").collect();

    // Filter conversations where user is a participant
    const userConversations = allConversations.filter((conv) =>
      conv.participants.includes(currentUser._id)
    );

    // Get the last message for each conversation
    const conversationsWithLastMessage = await Promise.all(
      userConversations.map(async (conv) => {
        const lastMessage = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) =>
            q.eq("conversationId", conv._id)
          )
          .order("desc")
          .first();

        // Get unread count
        const lastRead = await ctx.db
          .query("conversationReads")
          .withIndex("by_conversation_user", (q) =>
            q.eq("conversationId", conv._id).eq("userId", currentUser._id)
          )
          .first();

        const lastReadAt = lastRead?.lastReadAt || 0;

        const unreadCount = lastMessage
          ? await ctx.db
              .query("messages")
              .withIndex("by_conversation", (q) =>
                q.eq("conversationId", conv._id)
              )
              .filter((q) =>
                q.and(
                  q.gt(q.field("createdAt"), lastReadAt),
                  q.neq(q.field("senderId"), currentUser._id),
                  q.eq(q.field("isDeleted"), false)
                )
              )
              .collect()
              .then((msgs) => msgs.length)
          : 0;

        return {
          ...conv,
          lastMessage,
          unreadCount,
        };
      })
    );

    // Sort by last message time
    conversationsWithLastMessage.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt || a.createdAt;
      const bTime = b.lastMessage?.createdAt || b.createdAt;
      return bTime - aTime;
    });

    return conversationsWithLastMessage;
  },
});

export const get = query({
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
      throw new Error("User not found");
    }

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    if (!conversation.participants.includes(currentUser._id)) {
      throw new Error("Not a participant");
    }

    return conversation;
  },
});

export const getOrCreate = mutation({
  args: {
    otherUserId: v.id("users"),
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
      throw new Error("User not found");
    }

    // Check if conversation already exists
    // Query all conversations and filter by participants
    const allConversations = await ctx.db.query("conversations").collect();

    const existing = allConversations.find(
      (conv) =>
        !conv.isGroup &&
        conv.participants.length === 2 &&
        conv.participants.includes(currentUser._id) &&
        conv.participants.includes(args.otherUserId)
    );

    if (existing) {
      return existing._id;
    }

    // Create new conversation
    return await ctx.db.insert("conversations", {
      participants: [currentUser._id, args.otherUserId],
      isGroup: false,
      createdAt: Date.now(),
    });
  },
});

export const createGroup = mutation({
  args: {
    memberIds: v.array(v.id("users")),
    groupName: v.string(),
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
      throw new Error("User not found");
    }

    const allParticipants = [currentUser._id, ...args.memberIds];

    return await ctx.db.insert("conversations", {
      participants: allParticipants,
      isGroup: true,
      groupName: args.groupName,
      createdAt: Date.now(),
    });
  },
});

export const markAsRead = mutation({
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
      // Silently fail if user not found (auth not configured)
      return;
    }

    const existing = await ctx.db
      .query("conversationReads")
      .withIndex("by_conversation_user", (q) =>
        q.eq("conversationId", args.conversationId).eq("userId", currentUser._id)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        lastReadAt: Date.now(),
      });
    } else {
      await ctx.db.insert("conversationReads", {
        conversationId: args.conversationId,
        userId: currentUser._id,
        lastReadAt: Date.now(),
      });
    }
  },
});
