import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    try {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        console.log("⚠️ No identity found in getCurrentUser");
        console.log("This means Convex auth is not configured with Clerk.");
        console.log("To fix:");
        console.log("1. Create Clerk JWT template named 'convex'");
        console.log("2. In Convex Dashboard → Settings → Auth → Enable Clerk");
        console.log("3. Add your Clerk JWT issuer domain");
        return null;
      }

      console.log("✅ Identity found:", { 
        subject: identity.subject, 
        issuer: identity.issuer,
        tokenIdentifier: identity.tokenIdentifier 
      });
      
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .first();
      
      if (!user) {
        console.log("⚠️ User not found in database for clerkId:", identity.subject);
        console.log("User exists in Clerk but not in Convex. This is normal on first login.");
      } else {
        console.log("✅ User found in Convex:", user._id);
      }
      
      return user;
    } catch (error) {
      console.error("❌ Error in getCurrentUser:", error);
      return null;
    }
  },
});

export const getOrCreateUser = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existing) {
      // Update user info if it changed
      await ctx.db.patch(existing._id, {
        name: args.name,
        email: args.email,
        imageUrl: args.imageUrl,
      });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      name: args.name,
      email: args.email,
      imageUrl: args.imageUrl,
      createdAt: Date.now(),
    });
  },
});
