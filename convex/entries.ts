import { paginationOptsValidator } from "convex/server";
import { validatePracticeDate } from "../shared/dates";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { action, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { userFromAuth } from "./auth";
import { r2 } from "./r2";
import { entryAssets, validateExtraAssets, sourceUpload, animationUpload } from "./entryAssets";
import { visibility } from "./schema";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_DIMENSION = 4096;

function optionalText(value: string | undefined, max: number) {
  const cleaned = value?.trim().slice(0, max);
  return cleaned || undefined;
}

async function entryPayload(entry: Doc<"entries">, owner = false) {
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
    createdAt: new Date(entry.createdAt).toISOString(),
    practiceDate: entry.practiceDate,
    imageUrl: await r2.getUrl(entry.objectKey),
    sourceFilename: entry.source?.filename,
    sourceUrl: owner && entry.source ? await r2.getUrl(entry.source.objectKey) : undefined,
    animation: entry.animation
      ? {
          url: await r2.getUrl(entry.animation.objectKey),
          columns: entry.animation.columns,
          frameDurations: entry.animation.frameDurations,
        }
      : undefined,
  };
}

function userPayload(user: Doc<"users">) {
  return {
    id: user._id,
    username: user.username,
    displayName: user.displayName ?? null,
    bio: user.bio ?? null,
    website: user.website ?? null,
    avatarUrl: user.avatarUrl,
    practiceStartedAt: new Date(user.practiceStartedAt).toISOString(),
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
      entries.filter((entry) => entry.status === "ready").map(async (entry) => entryPayload(entry)),
    );
  },
});

export const getMine = query({
  args: { entryId: v.id("entries") },
  handler: async (ctx, { entryId }) => {
    const user = await userFromAuth(ctx);
    const entry = await ctx.db.get("entries", entryId);
    if (!entry || entry.userId !== user._id || entry.status !== "ready") return null;
    return entryPayload(entry, true);
  },
});

export const view = query({
  args: { entryId: v.id("entries") },
  handler: async (ctx, { entryId }) => {
    const entry = await ctx.db.get("entries", entryId);
    if (!entry || entry.status !== "ready") return null;

    const identity = await ctx.auth.getUserIdentity();
    const viewer = identity
      ? await ctx.db
          .query("users")
          .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
          .unique()
      : null;
    const canEdit = viewer?._id === entry.userId;

    if (entry.visibility === "private" && !canEdit) {
      return { status: "private" as const };
    }
    const author = await ctx.db.get("users", entry.userId);
    if (!author) return null;

    return {
      status: "ready" as const,
      canEdit,
      entry: await entryPayload(entry, canEdit),
      author: userPayload(author),
    };
  },
});

export const publicProfile = query({
  args: { username: v.string() },
  handler: async (ctx, { username }) => {
    const normalized = username
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "")
      .slice(0, 32);
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", normalized))
      .unique();
    if (!user) return null;
    const entries = await ctx.db
      .query("entries")
      .withIndex("by_user_created", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    return {
      user: userPayload(user),
      entries: await Promise.all(
        entries
          .filter((entry) => entry.status === "ready" && entry.visibility === "public")
          .map(async (entry) => entryPayload(entry)),
      ),
    };
  },
});

export const feed = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, { paginationOpts }) => {
    const result = await ctx.db
      .query("entries")
      .withIndex("by_visibility_status_created", (q) =>
        q.eq("visibility", "public").eq("status", "ready"),
      )
      .order("desc")
      .paginate({ ...paginationOpts, numItems: Math.min(paginationOpts.numItems, 60) });
    const authors = await Promise.all(
      [...new Set(result.page.map((entry) => entry.userId))].map((id) => ctx.db.get("users", id)),
    );
    const usersById = new Map(authors.flatMap((user) => (user ? [[user._id, user] as const] : [])));
    const page = await Promise.all(
      result.page.flatMap((entry) => {
        const author = usersById.get(entry.userId);
        return author
          ? [
              (async () => ({
                entry: await entryPayload(entry),
                author: userPayload(author),
              }))(),
            ]
          : [];
      }),
    );
    return { ...result, page };
  },
});

export const updateMine = mutation({
  args: {
    entryId: v.id("entries"),
    practiceDate: v.optional(v.string()),
    title: v.optional(v.string()),
    note: v.optional(v.string()),
    visibility,
  },
  handler: async (ctx, args) => {
    const user = await userFromAuth(ctx);
    const entry = await ctx.db.get("entries", args.entryId);
    if (!entry || entry.userId !== user._id || entry.status !== "ready") {
      throw new Error("Work not found");
    }
    await ctx.db.patch(entry._id, {
      practiceDate:
        args.practiceDate === undefined
          ? entry.practiceDate
          : validatePracticeDate(args.practiceDate),
      title: optionalText(args.title, 100),
      note: optionalText(args.note, 500),
      visibility: args.visibility,
    });
  },
});

export const removeMine = mutation({
  args: { entryId: v.id("entries") },
  handler: async (ctx, { entryId }) => {
    const user = await userFromAuth(ctx);
    const entry = await ctx.db.get("entries", entryId);
    if (!entry || entry.userId !== user._id) throw new Error("Work not found");
    for (const asset of entryAssets(entry)) await r2.deleteObject(ctx, asset.objectKey);
    await ctx.db.delete(entry._id);
  },
});

export const beginUpload = mutation({
  args: {
    source: v.optional(sourceUpload),
    animation: v.optional(animationUpload),
    originalFilename: v.string(),
    mimeType: v.union(
      v.literal("image/png"),
      v.literal("image/gif"),
      v.literal("image/jpeg"),
      v.literal("image/webp"),
      v.literal("image/avif"),
    ),
    width: v.number(),
    height: v.number(),
    fileSize: v.number(),
    practiceDate: v.optional(v.string()),
    title: v.optional(v.string()),
    note: v.optional(v.string()),
    visibility,
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

    validateExtraAssets(args);
    const { source, animation, ...imageArgs } = args;
    const entryId = await ctx.db.insert("entries", {
      ...imageArgs,
      practiceDate:
        args.practiceDate === undefined ? undefined : validatePracticeDate(args.practiceDate),
      originalFilename: args.originalFilename.slice(0, 200),
      title: optionalText(args.title, 100),
      note: optionalText(args.note, 500),
      userId: user._id,
      objectKey: "pending",
      status: "uploading",
      createdAt: Date.now(),
    });
    const extension = {
      "image/png": "png",
      "image/gif": "gif",
      "image/jpeg": "jpg",
      "image/webp": "webp",
      "image/avif": "avif",
    }[args.mimeType];
    const objectKey = `users/${user._id}/entries/${entryId}/original.${extension}`;
    const base = `users/${user._id}/entries/${entryId}`;
    const sourceAsset = source
      ? { ...source, filename: source.filename.slice(0, 200), objectKey: `${base}/source.aseprite` }
      : undefined;
    const animationAsset = animation
      ? { ...animation, objectKey: `${base}/animation.png` }
      : undefined;
    await ctx.db.patch(entryId, { objectKey, source: sourceAsset, animation: animationAsset });
    const { url } = await r2.generateUploadUrl(objectKey);
    return {
      entryId,
      uploadUrl: url,
      sourceUploadUrl: sourceAsset
        ? (await r2.generateUploadUrl(sourceAsset.objectKey)).url
        : undefined,
      animationUploadUrl: animationAsset
        ? (await r2.generateUploadUrl(animationAsset.objectKey)).url
        : undefined,
    };
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

    for (const asset of entryAssets(entry)) {
      await r2.syncMetadata(ctx, asset.objectKey);
      const metadata = await r2.getMetadata(ctx, asset.objectKey);
      if (!metadata) throw new Error("R2 upload could not be verified");
      if (metadata.size !== asset.fileSize) throw new Error("Uploaded file size does not match");
      if (metadata.contentType !== asset.mimeType)
        throw new Error("Uploaded file type does not match");
    }

    await ctx.runMutation(internal.entries.completeUpload, args);
    return entryId;
  },
});
