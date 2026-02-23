import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    conversationId: v.id("conversations"),
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let currentUser;
    
    // Try to get user via auth first
    const identity = await ctx.auth.getUserIdentity();
    if (identity) {
      currentUser = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .first();
    }
    
    // Fallback: use clerkId from args if auth isn't configured
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

    // Get other participants for read receipt checking (only for individual chats)
    const otherParticipants = conversation.participants.filter(
      (id) => id !== currentUser._id
    );
    
    // Get last read time for other user (only for individual chats)
    let otherUserLastReadAt: number | null = null;
    if (!conversation.isGroup && otherParticipants.length === 1) {
      const readStatus = await ctx.db
        .query("conversationReads")
        .withIndex("by_conversation_user", (q) =>
          q.eq("conversationId", args.conversationId).eq("userId", otherParticipants[0])
        )
        .first();
      otherUserLastReadAt = readStatus?.lastReadAt || null;
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("asc")
      .collect();

    // Get reactions for all messages
    const messagesWithReactions = await Promise.all(
      messages.map(async (message) => {
        const reactions = await ctx.db
          .query("messageReactions")
          .withIndex("by_message", (q) => q.eq("messageId", message._id))
          .collect();

        // Group reactions by emoji
        // Use a plain object (not a Convex value) to avoid field name validation issues
        const reactionGroups: { [key: string]: number } = {};
        reactions.forEach((reaction) => {
          if (reaction.emoji) {
            reactionGroups[reaction.emoji] =
              (reactionGroups[reaction.emoji] || 0) + 1;
          }
        });

        // Get replied message if exists
        let repliedMessage = null;
        if (message.replyTo) {
          const replied = await ctx.db.get(message.replyTo);
          if (replied) {
            const repliedSender = await ctx.db.get(replied.senderId);
            repliedMessage = {
              _id: replied._id,
              content: replied.content,
              senderName: repliedSender?.name || "Unknown",
              isDeleted: replied.isDeleted,
            };
          }
        }

        // Return message with reactions as a separate field
        // Use JSON serialization to ensure Convex treats it as a plain string, not validated
        const messageData = {
          _id: message._id,
          _creationTime: message._creationTime,
          conversationId: message.conversationId,
          senderId: message.senderId,
          content: message.content,
          messageType: (message.messageType || "text") as "text" | "image" | "video" | "audio",
          fileId: message.fileId,
          fileName: message.fileName,
          fileSize: message.fileSize,
          fileUrl: message.fileUrl,
          thumbnailUrl: message.thumbnailUrl,
          duration: message.duration,
          isDeleted: message.isDeleted,
          createdAt: message.createdAt,
          replyTo: message.replyTo,
        };

        // Determine read status for own messages in individual chats
        let isRead = false;
        let isDelivered = false;
        if (message.senderId === currentUser._id && !conversation.isGroup && otherUserLastReadAt) {
          isRead = message.createdAt <= otherUserLastReadAt;
          // For delivered, we'll check online status on the client side
          isDelivered = true; // Assume delivered if we have read status info
        }

        // Add reactions as a JSON string to avoid Convex validation
        return {
          ...messageData,
          reactionsJson: JSON.stringify(reactionGroups),
          userReactions: reactions
            .filter((r) => r.userId === currentUser._id)
            .map((r) => r.emoji),
          repliedMessage,
          isGroup: conversation.isGroup,
          isRead,
          isDelivered,
        };
      })
    );

    return messagesWithReactions;
  },
});

export const get = query({
  args: {
    messageId: v.id("messages"),
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let currentUser;
    
    // Try to get user via auth first
    const identity = await ctx.auth.getUserIdentity();
    if (identity) {
      currentUser = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .first();
    }
    
    // Fallback: use clerkId from args if auth isn't configured
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

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    const conversation = await ctx.db.get(message.conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    if (!conversation.participants.includes(currentUser._id)) {
      throw new Error("Not a participant");
    }

    const sender = await ctx.db.get(message.senderId);
    
    return {
      _id: message._id,
      content: message.content,
      senderName: sender?.name || "Unknown",
      isDeleted: message.isDeleted,
    };
  },
});

export const send = mutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
    messageType: v.optional(v.union(v.literal("text"), v.literal("image"), v.literal("video"), v.literal("audio"), v.literal("document"))),
    fileId: v.optional(v.id("_storage")),
    fileName: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    fileUrl: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    duration: v.optional(v.number()),
    clerkId: v.optional(v.string()),
    replyTo: v.optional(v.id("messages")),
  },
  handler: async (ctx, args) => {
    let currentUser;
    
    // Try to get user via auth first
    const identity = await ctx.auth.getUserIdentity();
    if (identity) {
      currentUser = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .first();
    }
    
    // Fallback: use clerkId from args if auth isn't configured
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

    // Get file URL if fileId is provided
    let fileUrl = args.fileUrl;
    if (args.fileId && !fileUrl) {
      const url = await ctx.storage.getUrl(args.fileId);
      fileUrl = url || undefined;
    }

    const messageType = args.messageType || "text";

    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: currentUser._id,
      content: args.content.trim() || (messageType !== "text" ? `${messageType} message` : ""),
      messageType,
      fileId: args.fileId,
      fileName: args.fileName,
      fileSize: args.fileSize,
      fileUrl: fileUrl,
      thumbnailUrl: args.thumbnailUrl,
      duration: args.duration,
      isDeleted: false,
      createdAt: Date.now(),
      replyTo: args.replyTo,
    });

    // Update conversation's last message time
    await ctx.db.patch(args.conversationId, {
      lastMessageAt: Date.now(),
    });

    return messageId;
  },
});

export const deleteMessage = mutation({
  args: {
    messageId: v.id("messages"),
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let currentUser;
    
    // Try to get user via auth first
    const identity = await ctx.auth.getUserIdentity();
    if (identity) {
      currentUser = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .first();
    }
    
    // Fallback: use clerkId from args if auth isn't configured
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

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    if (message.senderId !== currentUser._id) {
      throw new Error("Can only delete your own messages");
    }

    await ctx.db.patch(args.messageId, {
      isDeleted: true,
    });
  },
});

export const addReaction = mutation({
  args: {
    messageId: v.id("messages"),
    emoji: v.string(),
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let currentUser;
    
    // Try to get user via auth first
    const identity = await ctx.auth.getUserIdentity();
    if (identity) {
      currentUser = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .first();
    }
    
    // Fallback: use clerkId from args if auth isn't configured
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

    // Remove any existing reaction from this user for this message (only one reaction per user)
    const existingReactions = await ctx.db
      .query("messageReactions")
      .withIndex("by_user_message", (q) =>
        q.eq("userId", currentUser._id).eq("messageId", args.messageId)
      )
      .collect();

    // Delete all existing reactions from this user
    for (const reaction of existingReactions) {
      await ctx.db.delete(reaction._id);
    }

    // Check if the same emoji was clicked (toggle off)
    const wasSameEmoji = existingReactions.some(r => r.emoji === args.emoji);

    // Only add new reaction if it's a different emoji
    if (!wasSameEmoji) {
      await ctx.db.insert("messageReactions", {
        messageId: args.messageId,
        userId: currentUser._id,
        emoji: args.emoji,
        createdAt: Date.now(),
      });
    }
  },
});
