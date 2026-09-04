import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { action, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { userFromAuth } from "./auth";
import { r2 } from "./r2";
import { visibility } from "./schema";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_DIMENSION = 4096;

function optionalText(value: string | undefined, max: number) {
  const cleaned = value?.trim().slice(0, max);
  return cleaned || undefined;
}

function entryPayload(entry: Doc<"entries">, imageUrl: string) {
  return {
    id: entry._id,
    title: entry.title ?? null,
    note: entry.note ?? null,
    originalFilename: entry.originalFilename,
    mimeType: entry.mimeType,
    width: entry.width,
    height: entry.height,
    fileSize: entry.fileSize,
    visibility: entry.visibility,
    milestone: entry.milestone,
    createdAt: new Date(entry.createdAt).toISOString(),
    imageUrl,
  };
}

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await userFromAuth(ctx);
    const entries = await ctx.db
      .query("entries")
      .withIndex("by_user_created", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    return Promise.all(
      entries
        .filter((entry) => entry.status === "ready")
        .map(async (entry) => entryPayload(entry, await r2.getUrl(entry.objectKey))),
    );
  },
});

export const getMine = query({
  args: { entryId: v.id("entries") },
  handler: async (ctx, { entryId }) => {
    const user = await userFromAuth(ctx);
    const entry = await ctx.db.get("entries", entryId);
    if (!entry || entry.userId !== user._id || entry.status !== "ready") return null;
    return entryPayload(entry, await r2.getUrl(entry.objectKey));
  },
});

export const beginUpload = mutation({
  args: {
    originalFilename: v.string(),
    mimeType: v.union(v.literal("image/png"), v.literal("image/gif")),
    width: v.number(),
    height: v.number(),
    fileSize: v.number(),
    title: v.optional(v.string()),
    note: v.optional(v.string()),
    visibility,
    milestone: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await userFromAuth(ctx);
    if (!Number.isInteger(args.width) || !Number.isInteger(args.height)) {
      throw new Error("Image dimensions must be whole numbers");
    }
    if (
      args.width < 1 ||
      args.height < 1 ||
      args.width > MAX_DIMENSION ||
      args.height > MAX_DIMENSION
    ) {
      throw new Error(`Images must be at most ${MAX_DIMENSION}×${MAX_DIMENSION}`);
    }
    if (args.fileSize < 1 || args.fileSize > MAX_FILE_SIZE) {
      throw new Error("Images must be 10 MB or smaller");
    }

    const entryId = await ctx.db.insert("entries", {
      ...args,
      originalFilename: args.originalFilename.slice(0, 200),
      title: optionalText(args.title, 100),
      note: optionalText(args.note, 500),
      userId: user._id,
      objectKey: "pending",
      status: "uploading",
      createdAt: Date.now(),
    });
    const extension = args.mimeType === "image/gif" ? "gif" : "png";
    const objectKey = `users/${user._id}/entries/${entryId}/original.${extension}`;
    await ctx.db.patch(entryId, { objectKey });
    const { url } = await r2.generateUploadUrl(objectKey);
    return { entryId, uploadUrl: url };
  },
});

export const uploadForFinalize = internalQuery({
  args: { entryId: v.id("entries"), tokenIdentifier: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
      .unique();
    const entry = await ctx.db.get("entries", args.entryId);
    if (!user || !entry || entry.userId !== user._id || entry.status !== "uploading") {
      throw new Error("Upload not found");
    }
    return entry;
  },
});

export const completeUpload = internalMutation({
  args: { entryId: v.id("entries"), tokenIdentifier: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", args.tokenIdentifier))
      .unique();
    const entry = await ctx.db.get("entries", args.entryId);
    if (!user || !entry || entry.userId !== user._id || entry.status !== "uploading") {
      throw new Error("Upload not found");
    }
    await ctx.db.patch(entry._id, { status: "ready" });
  },
});

export const finalizeUpload = action({
  args: { entryId: v.id("entries") },
  handler: async (ctx, { entryId }): Promise<Id<"entries">> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");
    const args = { entryId, tokenIdentifier: identity.tokenIdentifier };
    const entry = await ctx.runQuery(internal.entries.uploadForFinalize, args);

    await r2.syncMetadata(ctx, entry.objectKey);
    const metadata = await r2.getMetadata(ctx, entry.objectKey);
    if (!metadata) throw new Error("R2 upload could not be verified");
    if (metadata.size !== undefined && metadata.size !== entry.fileSize) {
      throw new Error("Uploaded file size does not match");
    }
    if (metadata.contentType && metadata.contentType !== entry.mimeType) {
      throw new Error("Uploaded file type does not match");
    }

    await ctx.runMutation(internal.entries.completeUpload, args);
    return entryId;
  },
});
