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
    expect(second?.username).toBe("pixel_artist");
    expect(second?.displayName).toBe("New Name");
    expect(second?.practiceStartedAt).toBe(first?.practiceStartedAt);
  });

  it("rejects unauthenticated profile creation", async () => {
    const t = convexTest(schema, modules);

    await expect(t.mutation(api.users.getOrCreate, { username: "intruder" })).rejects.toThrow(
      "Unauthenticated",
    );
  });
});
