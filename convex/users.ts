import { v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";

function cleanUsername(value: string) {
  const username = value
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 32);
  return username || "pixel-artist";
}

function cleanOptional(value: string | undefined, limit: number) {
  return value?.trim().slice(0, limit) || undefined;
}

async function usernameOwner(ctx: MutationCtx, username: string) {
  return ctx.db
    .query("users")
    .withIndex("by_username", (q) => q.eq("username", username))
    .first();
}

export const getOrCreate = mutation({
  args: {
    username: v.string(),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const existing = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    const username = cleanUsername(args.username);
    const displayName = cleanOptional(args.displayName, 80);
    const owner = await usernameOwner(ctx, username);

    if (existing) {
      await ctx.db.patch(existing._id, {
        username: owner && owner._id !== existing._id ? existing.username : username,
        displayName,
        avatarUrl: args.avatarUrl,
      });
      return existing._id;
    }

    const availableUsername = owner
      ? `${username.slice(0, 25)}-${identity.subject.slice(-6).toLowerCase()}`
      : username;

    return ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      username: availableUsername,
      displayName,
      avatarUrl: args.avatarUrl,
      practiceStartedAt: Date.now(),
    });
  },
});

export const updateAvatar = mutation({
  args: { avatarUrl: v.string() },
  handler: async (ctx, { avatarUrl }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new Error("Profile not found");
    if (!/^https:\/\//i.test(avatarUrl)) throw new Error("Invalid avatar URL");
    await ctx.db.patch(user._id, { avatarUrl: avatarUrl.slice(0, 1000) });
  },
});

export const updateProfile = mutation({
  args: {
    username: v.string(),
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
    website: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new Error("Profile not found");

    const username = cleanUsername(args.username);
    const owner = await usernameOwner(ctx, username);
    if (owner && owner._id !== user._id) throw new Error("Username already taken");

    const website = cleanOptional(args.website, 160);
    if (website && !/^https?:\/\//i.test(website)) {
      throw new Error("Website must start with http:// or https://");
    }

    await ctx.db.patch(user._id, {
      username,
      displayName: cleanOptional(args.displayName, 80),
      bio: cleanOptional(args.bio, 240),
      website,
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
