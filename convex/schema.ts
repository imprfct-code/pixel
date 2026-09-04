import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const visibility = v.union(v.literal("private"), v.literal("unlisted"), v.literal("public"));

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    username: v.string(),
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
    website: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    practiceStartedAt: v.number(),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_username", ["username"]),
  entries: defineTable({
    userId: v.id("users"),
    objectKey: v.string(),
    originalFilename: v.string(),
    mimeType: v.union(v.literal("image/png"), v.literal("image/gif")),
    width: v.number(),
    height: v.number(),
    fileSize: v.number(),
    title: v.optional(v.string()),
    note: v.optional(v.string()),
    visibility,
    milestone: v.boolean(),
    status: v.union(v.literal("uploading"), v.literal("ready")),
    createdAt: v.number(),
  }).index("by_user_created", ["userId", "createdAt"]),
});
