import "server-only";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { serverEnv, features } from "@/lib/env";

/**
 * Cloudflare R2 (S3-compatible) object storage. Used for user-uploaded images
 * (avatars). Server-only — holds the R2 credentials.
 *
 * R2 exposes an S3 API at https://<account>.r2.cloudflarestorage.com with a
 * fixed region of "auto". Objects are served publicly from R2_PUBLIC_URL.
 */
let client: S3Client | null = null;

function getClient(): S3Client {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${serverEnv.r2AccountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: serverEnv.r2AccessKeyId,
        secretAccessKey: serverEnv.r2SecretAccessKey,
      },
    });
  }
  return client;
}

/**
 * Upload bytes to R2 under `key` and return the public URL. Throws if storage
 * isn't configured (callers should gate on `features.hasStorage`).
 */
export async function uploadObject(
  key: string,
  body: Uint8Array,
  contentType: string,
): Promise<string> {
  if (!features.hasStorage) {
    throw new Error("Object storage (R2) is not configured.");
  }
  await getClient().send(
    new PutObjectCommand({
      Bucket: serverEnv.r2Bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  return `${serverEnv.r2PublicUrl.replace(/\/$/, "")}/${key}`;
}
