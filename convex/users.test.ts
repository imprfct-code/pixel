import { convexTest } from "convex-test";
import { describe, expect, it } from "vite-plus/test";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

describe("users", () => {
  it("creates one profile per Clerk identity and keeps its start date", async () => {
    const t = convexTest(schema, modules).withIdentity({
      issuer: "https://clerk.pixel.test",
      subject: "user_1",
      tokenIdentifier: "https://clerk.pixel.test|user_1",
    });

    const firstId = await t.mutation(api.users.getOrCreate, {
      username: "Pixel.Artist!",
      displayName: "First Name",
    });
    const first = await t.query(api.users.current);
    const secondId = await t.mutation(api.users.getOrCreate, {
      username: "pixel_artist",
      displayName: "New Name",
    });
    const second = await t.query(api.users.current);

    expect(firstId).toBe(secondId);
    expect(first?.username).toBe("pixelartist");
    expect(second?.username).toBe("pixelartist");
    expect(second?.displayName).toBe("First Name");
    expect(second?.practiceStartedAt).toBe(first?.practiceStartedAt);
  });

  it("rejects unauthenticated profile creation", async () => {
    const t = convexTest(schema, modules);

    await expect(t.mutation(api.users.getOrCreate, { username: "intruder" })).rejects.toThrow(
      "Unauthenticated",
    );
  });

  it("updates profile fields and protects usernames", async () => {
    const base = convexTest(schema, modules);
    const first = base.withIdentity({
      issuer: "https://clerk.pixel.test",
      subject: "user_1",
      tokenIdentifier: "https://clerk.pixel.test|user_1",
    });
    const second = base.withIdentity({
      issuer: "https://clerk.pixel.test",
      subject: "user_2",
      tokenIdentifier: "https://clerk.pixel.test|user_2",
    });

    await first.mutation(api.users.getOrCreate, { username: "first" });
    await second.mutation(api.users.getOrCreate, { username: "second" });
    await first.mutation(api.users.updateProfile, {
      username: "new.name",
      displayName: "New Name",
      bio: "Pixel studies",
      website: "https://pixel.test",
    });

    expect(await first.query(api.users.current)).toMatchObject({
      username: "newname",
      displayName: "New Name",
      bio: "Pixel studies",
      website: "https://pixel.test",
    });
    await expect(second.mutation(api.users.updateProfile, { username: "newname" })).rejects.toThrow(
      "Username already taken",
    );
  });

  it("serves a public profile without exposing private entries", async () => {
    const base = convexTest(schema, modules);
    const owner = base.withIdentity({
      issuer: "https://clerk.pixel.test",
      subject: "user_public",
      tokenIdentifier: "https://clerk.pixel.test|user_public",
    });

    await owner.mutation(api.users.getOrCreate, {
      username: "public-artist",
      displayName: "Public Artist",
      avatarUrl: "https://images.pixel.test/avatar.png",
    });
    const profile = await base.query(api.entries.publicProfile, { username: "PUBLIC-ARTIST" });

    expect(profile?.user).toMatchObject({
      username: "public-artist",
      displayName: "Public Artist",
      avatarUrl: "https://images.pixel.test/avatar.png",
    });
    expect(profile?.entries).toEqual([]);
    expect(
      (await base.query(api.entries.feed, { paginationOpts: { numItems: 24, cursor: null } })).page,
    ).toEqual([]);
  });
});
