import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    imageUrl: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"]),

  conversations: defineTable({
    participants: v.array(v.id("users")),
    isGroup: v.boolean(),
    groupName: v.optional(v.string()),
    createdAt: v.number(),
    lastMessageAt: v.optional(v.number()),
  })
    .index("by_last_message", ["lastMessageAt"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
    messageType: v.optional(v.union(v.literal("text"), v.literal("image"), v.literal("video"), v.literal("audio"), v.literal("document"))),
    fileId: v.optional(v.id("_storage")),
    fileName: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    fileUrl: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    duration: v.optional(v.number()), // For audio/video
    isDeleted: v.boolean(),
    createdAt: v.number(),
    replyTo: v.optional(v.id("messages")),
  })
    .index("by_conversation", ["conversationId", "createdAt"])
    .index("by_sender", ["senderId"]),

  messageReactions: defineTable({
    messageId: v.id("messages"),
    userId: v.id("users"),
    emoji: v.string(),
    createdAt: v.number(),
  })
    .index("by_message", ["messageId"])
    .index("by_user_message", ["userId", "messageId"]),

  presence: defineTable({
    userId: v.id("users"),
    lastSeen: v.number(),
    isOnline: v.boolean(),
  })
    .index("by_user", ["userId"]),

  typingIndicators: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    isTyping: v.boolean(),
    updatedAt: v.number(),
  })
    .index("by_conversation", ["conversationId"]),

  conversationReads: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    lastReadAt: v.number(),
  })
    .index("by_conversation_user", ["conversationId", "userId"]),
});
