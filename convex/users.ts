import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

function cleanUsername(value: string) {
  const username = value
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 32);
  return username || "pixel-artist";
}

export const getOrCreate = mutation({
  args: {
    username: v.string(),
    displayName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const existing = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    const username = cleanUsername(args.username);
    const displayName = args.displayName?.trim().slice(0, 80) || undefined;

    if (existing) {
      await ctx.db.patch(existing._id, { username, displayName });
      return existing._id;
    }

    return ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      username,
      displayName,
      practiceStartedAt: Date.now(),
    });
  },
});

export const current = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
  },
});
