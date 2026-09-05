import { convexTest } from "convex-test";
import { describe, expect, it, vi } from "vite-plus/test";
import { api } from "./_generated/api";
import schema from "./schema";

const storage = vi.hoisted(() => ({
  deleteObject: vi.fn(async () => {}),
  syncMetadata: vi.fn(async () => {}),
  getMetadata: vi.fn(async (_ctx: unknown, key: string) => ({
    size: 100,
    contentType: key.endsWith(".aseprite") ? "application/octet-stream" : "image/png",
  })),
  getUrl: vi.fn(async (key: string) => `https://images.pixel.test/${key}`),
  generateUploadUrl: vi.fn(async () => ({ url: "https://images.pixel.test/upload" })),
}));
vi.mock("./r2", () => ({ r2: storage }));

const modules = import.meta.glob("./**/*.ts");
const image = {
  originalFilename: "study.png",
  mimeType: "image/png" as const,
  width: 32,
  height: 32,
  fileSize: 100,
  visibility: "private" as const,
};

async function setup() {
  const base = convexTest(schema, modules);
  const owner = base.withIdentity({ subject: "artist", tokenIdentifier: "pixel|artist" });
  const userId = await owner.mutation(api.users.getOrCreate, { username: "artist" });
  return { base, owner, userId };
}

describe("entries", () => {
  it("paginates only ready public work and signs only the returned images", async () => {
    const { base, userId } = await setup();
    await base.run(async (ctx) => {
      for (let index = 0; index < 70; index++) {
        await ctx.db.insert("entries", {
          ...image,
          userId,
          objectKey: `public-${index}`,
          visibility: "public",
          status: "ready",
          createdAt: index,
        });
      }
      await ctx.db.insert("entries", {
        ...image,
        userId,
        objectKey: "private",
        status: "ready",
        createdAt: 100,
      });
      await ctx.db.insert("entries", {
        ...image,
        userId,
        objectKey: "unlisted",
        visibility: "unlisted",
        status: "ready",
        createdAt: 101,
      });
      await ctx.db.insert("entries", {
        ...image,
        userId,
        objectKey: "pending",
        visibility: "public",
        status: "uploading",
        createdAt: 102,
      });
    });
    storage.getUrl.mockClear();
    const first = await base.query(api.entries.feed, {
      paginationOpts: { numItems: 24, cursor: null },
    });
    expect(first.page).toHaveLength(24);
    expect(first.isDone).toBe(false);
    expect(storage.getUrl).toHaveBeenCalledTimes(24);
    expect(first.page[0].entry.imageUrl).toContain("public-69");
    const second = await base.query(api.entries.feed, {
      paginationOpts: { numItems: 24, cursor: first.continueCursor },
    });
    expect(second.page).toHaveLength(24);
    expect(new Set([...first.page, ...second.page].map(({ entry }) => entry.id)).size).toBe(48);
    const third = await base.query(api.entries.feed, {
      paginationOpts: { numItems: 24, cursor: second.continueCursor },
    });
    expect(third.page).toHaveLength(22);
    expect(third.isDone).toBe(true);
  });

  it("saves and edits a work date without changing its upload timestamp", async () => {
    const { base, owner } = await setup();
    const { entryId } = await owner.mutation(api.entries.beginUpload, {
      ...image,
      practiceDate: "2024-02-29",
    });
    await base.run(async (ctx) => {
      await ctx.db.patch(entryId, { status: "ready" });
    });
    const before = await owner.query(api.entries.getMine, { entryId });
    expect(before?.practiceDate).toBe("2024-02-29");
    await owner.mutation(api.entries.updateMine, {
      entryId,
      visibility: "private",
      practiceDate: "2024-03-01",
    });
    expect(await owner.query(api.entries.getMine, { entryId })).toMatchObject({
      practiceDate: "2024-03-01",
      createdAt: before?.createdAt,
    });
    await expect(
      owner.mutation(api.entries.updateMine, {
        entryId,
        visibility: "private",
        practiceDate: "2025-02-29",
      }),
    ).rejects.toThrow("valid work date");
    const stranger = base.withIdentity({ subject: "other", tokenIdentifier: "pixel|other" });
    await stranger.mutation(api.users.getOrCreate, { username: "other" });
    await expect(
      stranger.mutation(api.entries.updateMine, {
        entryId,
        visibility: "public",
        practiceDate: "2024-03-02",
      }),
    ).rejects.toThrow("Work not found");
    expect(await base.query(api.entries.view, { entryId })).toEqual({ status: "private" });
  });

  it("keeps legacy dates optional and hides pending uploads", async () => {
    const { base, owner } = await setup();
    const { entryId } = await owner.mutation(api.entries.beginUpload, image);
    expect(await owner.query(api.entries.getMine, { entryId })).toBeNull();
    expect(await base.query(api.entries.view, { entryId })).toBeNull();
    await base.run(async (ctx) => {
      await ctx.db.patch(entryId, { status: "ready" });
    });
    expect(await owner.query(api.entries.getMine, { entryId })).not.toBeNull();
    await owner.mutation(api.entries.updateMine, {
      entryId,
      visibility: "unlisted",
      practiceDate: "2024-05-01",
    });
    expect((await base.query(api.entries.view, { entryId }))?.status).toBe("ready");
    expect((await base.query(api.entries.publicProfile, { username: "artist" }))?.entries).toEqual(
      [],
    );
  });
  it("requires all Aseprite assets, keeps the source private, and deletes them together", async () => {
    const { base, owner } = await setup();
    const { entryId, sourceUploadUrl, animationUploadUrl } = await owner.mutation(
      api.entries.beginUpload,
      {
        ...image,
        visibility: "public",
        source: { filename: "walk.aseprite", fileSize: 100 },
        animation: { fileSize: 100, columns: 2, frameDurations: [100, 250] },
      },
    );
    expect(sourceUploadUrl).toBeTruthy();
    expect(animationUploadUrl).toBeTruthy();
    storage.getMetadata
      .mockResolvedValueOnce({ size: 100, contentType: "image/png" })
      .mockResolvedValueOnce({ size: 50, contentType: "application/octet-stream" });
    await expect(owner.action(api.entries.finalizeUpload, { entryId })).rejects.toThrow(
      "file size",
    );
    expect(await owner.query(api.entries.getMine, { entryId })).toBeNull();
    await owner.action(api.entries.finalizeUpload, { entryId });
    const owned = await owner.query(api.entries.view, { entryId });
    expect(owned?.status === "ready" && owned.entry.sourceUrl).toContain("source.aseprite");
    const publicView = await base.query(api.entries.view, { entryId });
    expect(publicView?.status).toBe("ready");
    if (publicView?.status !== "ready") throw new Error("Missing public preview");
    expect(publicView.entry.sourceUrl).toBeUndefined();
    expect(publicView.entry.animation?.frameDurations).toEqual([100, 250]);
    expect(publicView.entry.animation?.url).toContain("animation.png");
    const profile = await base.query(api.entries.publicProfile, { username: "artist" });
    expect(profile?.entries[0].sourceUrl).toBeUndefined();
    const feed = await base.query(api.entries.feed, {
      paginationOpts: { numItems: 24, cursor: null },
    });
    expect(feed.page[0].entry.sourceUrl).toBeUndefined();
    storage.deleteObject.mockClear();
    await owner.mutation(api.entries.removeMine, { entryId });
    expect(storage.deleteObject).toHaveBeenCalledTimes(3);
    expect(await owner.query(api.entries.getMine, { entryId })).toBeNull();
  });

  it("rejects invalid animation metadata before allocating an upload", async () => {
    const { owner } = await setup();
    const source = { filename: "walk.ase", fileSize: 100 };
    for (const animation of [
      { fileSize: 100, columns: 0, frameDurations: [100, 100] },
      { fileSize: 100, columns: 2, frameDurations: [100, 0] },
      { fileSize: 100, columns: 2, frameDurations: Array.from({ length: 257 }, () => 100) },
    ]) {
      await expect(
        owner.mutation(api.entries.beginUpload, { ...image, source, animation }),
      ).rejects.toThrow("animation");
    }
    await expect(
      owner.mutation(api.entries.beginUpload, {
        ...image,
        source,
        animation: { fileSize: 100, columns: 2, frameDurations: [100, 100] },
        width: 4096,
        height: 4096,
      }),
    ).rejects.toThrow("animation");
  });
});
