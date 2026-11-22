import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./firebase-services", () => ({ getFirebaseStorageBucket: vi.fn() }));

import { getFirebaseStorageBucket } from "./firebase-services";
import { storageGet, storageGetSignedUrl, storagePut } from "./storage";

const save = vi.fn();
const getSignedUrl = vi.fn();
const file = vi.fn(() => ({ save, getSignedUrl }));
const bucket = { file };

beforeEach(() => {
  vi.stubEnv("VERCEL", "1");
  vi.mocked(getFirebaseStorageBucket).mockReturnValue(bucket as never);
  save.mockReset().mockResolvedValue(undefined);
  getSignedUrl.mockReset().mockResolvedValue(["https://storage.example/object?signature=test"]);
  file.mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Firebase Storage adapter", () => {
  it("uploads bytes with content type and returns a stable app media path", async () => {
    const data = Buffer.from("image-bytes");
    const result = await storagePut("polina/products/42/1730000000000.webp", data, "image/webp");

    expect(result.key).toMatch(/^polina\/products\/42\/1730000000000_[a-f0-9]{8}\.webp$/);
    expect(result.url).toBe(`/manus-storage/${result.key}`);
    expect(file).toHaveBeenCalledWith(result.key);
    expect(save).toHaveBeenCalledWith(data, {
      resumable: false,
      metadata: {
        contentType: "image/webp",
        cacheControl: "public, max-age=31536000, immutable",
      },
    });
  });

  it("signs a short-lived read URL for a product object path", async () => {
    const result = await storageGetSignedUrl("polina/products/42/1730000000000_a1b2c3d4.webp");

    expect(result).toBe("https://storage.example/object?signature=test");
    expect(file).toHaveBeenCalledWith("polina/products/42/1730000000000_a1b2c3d4.webp");
    expect(getSignedUrl).toHaveBeenCalledWith({
      version: "v4",
      action: "read",
      expires: expect.any(Number),
    });
  });

  it("preserves a relative media URL for stored object keys", async () => {
    await expect(storageGet("polina/products/42/image.webp")).resolves.toEqual({
      key: "polina/products/42/image.webp",
      url: "/manus-storage/polina/products/42/image.webp",
    });
  });

  it.each([
    "",
    "../secret",
    "polina//image.webp",
    "polina/../secret.webp",
    "polina\\secret.webp",
    "polina/\u0000image.webp",
  ])("rejects unsafe object key %j", async (key) => {
    await expect(storageGet(key)).rejects.toThrow("Invalid storage object key.");
  });
});
