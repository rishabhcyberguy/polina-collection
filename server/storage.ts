// Persistent media uses Firebase Storage on Vercel. Manus Preview keeps the
// Manus-managed storage adapter so existing preview behavior and media paths remain intact.

import { randomUUID } from "node:crypto";
import { ENV } from "./_core/env";
import { getFirebaseStorageBucket } from "./firebase-services";

const SIGNED_READ_TTL_MS = 15 * 60 * 1000;

function getForgeConfig() {
  const forgeUrl = ENV.forgeApiUrl;
  const forgeKey = ENV.forgeApiKey;

  if (!forgeUrl || !forgeKey) {
    throw new Error("Storage config missing: set MANUS_API_URL and MANUS_API_KEY");
  }

  return { forgeUrl: forgeUrl.replace(/\/+$/, ""), forgeKey };
}

function normalizeKey(relKey: string): string {
  let key = relKey;
  while (key.startsWith("/")) key = key.slice(1);
  const hasControlCharacter = Array.from(key).some((character) => {
    const code = character.charCodeAt(0);
    return code < 32 || code === 127;
  });
  if (
    !key
    || key.length > 512
    || key.includes("\\")
    || hasControlCharacter
    || key.split("/").some((segment) => !segment || segment === "." || segment === "..")
  ) {
    throw new Error("Invalid storage object key.");
  }
  return key;
}

function appendHashSuffix(relKey: string): string {
  const hash = randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const key = appendHashSuffix(normalizeKey(relKey));

  if (process.env.VERCEL === "1") {
    const bytes = Buffer.from(data);
    await getFirebaseStorageBucket().file(key).save(bytes, {
      resumable: false,
      metadata: {
        contentType,
        cacheControl: "public, max-age=31536000, immutable",
      },
    });
    return { key, url: `/manus-storage/${key}` };
  }

  const { forgeUrl, forgeKey } = getForgeConfig();
  const presignUrl = new URL("v1/storage/presign/put", forgeUrl + "/");
  presignUrl.searchParams.set("path", key);

  const presignResp = await fetch(presignUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` },
  });
  if (!presignResp.ok) {
    const msg = await presignResp.text().catch(() => presignResp.statusText);
    throw new Error(`Storage presign failed (${presignResp.status}): ${msg}`);
  }

  const { url: s3Url } = (await presignResp.json()) as { url: string };
  if (!s3Url) throw new Error("Forge returned empty presign URL");

  const blob = new Blob([typeof data === "string" ? data : data as any], { type: contentType });
  const uploadResp = await fetch(s3Url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: blob,
  });
  if (!uploadResp.ok) {
    throw new Error(`Storage upload to S3 failed (${uploadResp.status})`);
  }

  return { key, url: `/manus-storage/${key}` };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: `/manus-storage/${key}` };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const key = normalizeKey(relKey);
  const [url] = await getFirebaseStorageBucket().file(key).getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + SIGNED_READ_TTL_MS,
  });
  if (!url) throw new Error("Firebase Storage did not return a signed download URL.");
  return url;
}
