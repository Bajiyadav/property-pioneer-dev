import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export type UploadFolder =
  | "property-photos"
  | "property-videos"
  | "kyc-documents"
  | "rental-agreements"
  | "supporting-documents";

export interface PresignUploadParams {
  folder: UploadFolder;
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
  userId: string;
  entityId?: string; // Optional property_id or agreement_id for namespace scoping
}

export interface PresignedUploadResult {
  uploadUrl: string;
  objectKey: string;
  publicUrl?: string; // Only present for public assets (property photos/videos)
  expiresInSeconds: number;
  isPrivate: boolean;
  headers: Record<string, string>;
}

const REGION = process.env.AWS_REGION || "ap-south-1";
const S3_PUBLIC_BUCKET =
  process.env.S3_PUBLIC_MEDIA_BUCKET || "seedha-properties-public-media-staging";
const S3_PRIVATE_BUCKET =
  process.env.S3_PRIVATE_DOCS_BUCKET || "seedha-properties-private-docs-staging";
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_MEDIA_DOMAIN || "";

// Allowed MIME types and max file sizes per category
const FOLDER_CONSTRAINTS: Record<
  UploadFolder,
  { allowedMimes: string[]; maxSizeBytes: number; isPrivate: boolean }
> = {
  "property-photos": {
    allowedMimes: ["image/jpeg", "image/png", "image/webp"],
    maxSizeBytes: 10 * 1024 * 1024, // 10 MB
    isPrivate: false,
  },
  "property-videos": {
    allowedMimes: ["video/mp4", "video/webm"],
    maxSizeBytes: 50 * 1024 * 1024, // 50 MB
    isPrivate: false,
  },
  "kyc-documents": {
    allowedMimes: ["image/jpeg", "image/png", "application/pdf"],
    maxSizeBytes: 10 * 1024 * 1024, // 10 MB
    isPrivate: true,
  },
  "rental-agreements": {
    allowedMimes: ["application/pdf"],
    maxSizeBytes: 10 * 1024 * 1024, // 10 MB
    isPrivate: true,
  },
  "supporting-documents": {
    allowedMimes: ["application/pdf", "image/jpeg", "image/png"],
    maxSizeBytes: 10 * 1024 * 1024, // 10 MB
    isPrivate: true,
  },
};

/**
 * Whether this deployment can actually sign an S3 URL.
 *
 * `AWS_EXECUTION_ENV` / `AWS_LAMBDA_FUNCTION_NAME` mean an execution role is
 * present; `AWS_ACCESS_KEY_ID` means explicit local credentials are.
 */
function hasAwsConfig(): boolean {
  return !!(
    process.env.AWS_ACCESS_KEY_ID ||
    process.env.AWS_EXECUTION_ENV ||
    process.env.AWS_LAMBDA_FUNCTION_NAME
  );
}

/**
 * Development convenience that must never reach production.
 *
 * The mock branches below return a plausible-looking URL so local work can
 * proceed without AWS. In production that would silently hand a client a URL
 * that cannot store or retrieve anything, and the failure would surface as
 * "uploads mysteriously do nothing" rather than as a configuration error. So a
 * production deployment without credentials fails here, loudly.
 */
function assertStorageUsable(): void {
  if (!hasAwsConfig() && process.env.NODE_ENV === "production") {
    throw new Error(
      "Object storage is not configured on this deployment (no AWS credentials or execution role).",
    );
  }
}

/**
 * Rejects any key that is not a plain, server-generated relative key.
 * Keys are built by `generateSafeObjectKey`; anything with traversal, an
 * absolute path or an encoded segment did not come from there.
 */
function assertPlainObjectKey(objectKey: string): void {
  if (
    objectKey.length === 0 ||
    objectKey.length > 512 ||
    objectKey.startsWith("/") ||
    objectKey.includes("..") ||
    objectKey.includes("//") ||
    objectKey.includes("\\") ||
    objectKey.includes("%")
  ) {
    throw new Error("Malformed object key");
  }
}

// Lazy-initialized S3 client (loads IAM roles on ECS/EC2 automatically)
let s3ClientInstance: S3Client | null = null;

export function getS3Client(): S3Client {
  if (!s3ClientInstance) {
    const config: any = { region: REGION };
    // Only pass explicit credentials if present in env (e.g. local development)
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      config.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      };
    }
    s3ClientInstance = new S3Client(config);
  }
  return s3ClientInstance;
}

/**
 * Validates upload request against security rules (MIME whitelist, size ceiling)
 */
export function validateUploadRequest(params: PresignUploadParams): {
  valid: boolean;
  error?: string;
} {
  const constraints = FOLDER_CONSTRAINTS[params.folder];
  if (!constraints) {
    return { valid: false, error: `Invalid upload folder '${params.folder}'` };
  }

  if (!constraints.allowedMimes.includes(params.contentType.toLowerCase())) {
    return {
      valid: false,
      error: `Invalid file type '${params.contentType}'. Allowed types: ${constraints.allowedMimes.join(", ")}`,
    };
  }

  if (params.fileSizeBytes <= 0 || params.fileSizeBytes > constraints.maxSizeBytes) {
    const maxMb = Math.round(constraints.maxSizeBytes / (1024 * 1024));
    return {
      valid: false,
      error: `File size (${(params.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB) exceeds limit of ${maxMb} MB`,
    };
  }

  return { valid: true };
}

/**
 * Generates safe, server-controlled deterministic object keys.
 * Structure: {folder}/{userId}/{entityId_optional}/{uuid}.{ext}
 * Completely sanitizes user-supplied filenames and blocks path traversal.
 */
export function generateSafeObjectKey(
  folder: UploadFolder,
  userId: string,
  originalFileName: string,
  entityId?: string,
): string {
  // Extract clean extension only
  const sanitizedExt =
    originalFileName
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, "")
      .split(".")
      .pop() || "bin";

  const safeUserId = userId.replace(/[^a-zA-Z0-9_-]/g, "");
  const safeEntityId = entityId ? entityId.replace(/[^a-zA-Z0-9_-]/g, "") : null;
  const uniqueId = crypto.randomUUID();

  if (safeEntityId) {
    return `${folder}/${safeUserId}/${safeEntityId}/${uniqueId}.${sanitizedExt}`;
  }
  return `${folder}/${safeUserId}/${uniqueId}.${sanitizedExt}`;
}

/**
 * Generates a short-lived (5-minute) pre-signed PUT URL for secure browser/mobile direct S3 upload.
 */
export async function createPresignedUploadUrl(
  params: PresignUploadParams,
  expiresInSeconds: number = 300, // 5 minutes TTL
): Promise<PresignedUploadResult> {
  const validation = validateUploadRequest(params);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const constraints = FOLDER_CONSTRAINTS[params.folder];
  const targetBucket = constraints.isPrivate ? S3_PRIVATE_BUCKET : S3_PUBLIC_BUCKET;
  const objectKey = generateSafeObjectKey(
    params.folder,
    params.userId,
    params.fileName,
    params.entityId,
  );

  assertStorageUsable();

  // Outside production, generate a structured mock URL so local dev needs no AWS.
  if (!hasAwsConfig()) {
    return {
      uploadUrl: `https://${targetBucket}.s3.${REGION}.amazonaws.com/${objectKey}?mock_presigned=true&expires=${expiresInSeconds}`,
      objectKey,
      publicUrl: constraints.isPrivate
        ? undefined
        : CLOUDFRONT_DOMAIN
          ? `https://${CLOUDFRONT_DOMAIN}/${objectKey}`
          : `https://${targetBucket}.s3.${REGION}.amazonaws.com/${objectKey}`,
      expiresInSeconds,
      isPrivate: constraints.isPrivate,
      headers: {
        "Content-Type": params.contentType,
      },
    };
  }

  const client = getS3Client();
  const command = new PutObjectCommand({
    Bucket: targetBucket,
    Key: objectKey,
    ContentType: params.contentType,
    // Add server-side encryption for private docs
    ...(constraints.isPrivate ? { ServerSideEncryption: "AES256" } : {}),
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });

  const publicUrl = constraints.isPrivate
    ? undefined
    : CLOUDFRONT_DOMAIN
      ? `https://${CLOUDFRONT_DOMAIN}/${objectKey}`
      : `https://${targetBucket}.s3.${REGION}.amazonaws.com/${objectKey}`;

  return {
    uploadUrl,
    objectKey,
    publicUrl,
    expiresInSeconds,
    isPrivate: constraints.isPrivate,
    headers: {
      "Content-Type": params.contentType,
    },
  };
}

/**
 * Generates a short-lived (5-minute) pre-signed GET URL for viewing private KYC or Lease agreements.
 */
export async function createPresignedDownloadUrl(
  objectKey: string,
  expiresInSeconds: number = 300, // 5 minutes TTL
): Promise<string> {
  assertPlainObjectKey(objectKey);

  // Validate that key belongs to a private folder
  if (
    !objectKey.startsWith("kyc-documents/") &&
    !objectKey.startsWith("rental-agreements/") &&
    !objectKey.startsWith("supporting-documents/")
  ) {
    throw new Error("Invalid private object key");
  }

  assertStorageUsable();

  if (!hasAwsConfig()) {
    return `https://${S3_PRIVATE_BUCKET}.s3.${REGION}.amazonaws.com/${objectKey}?mock_download=true&expires=${expiresInSeconds}`;
  }

  const client = getS3Client();
  const command = new GetObjectCommand({
    Bucket: S3_PRIVATE_BUCKET,
    Key: objectKey,
  });

  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

/**
 * The user id a server-generated key belongs to.
 *
 * Keys are `{folder}/{userId}/[entityId/]{uuid}.{ext}`, so the second segment is
 * always the uploader. Callers use this to authorize a download instead of
 * splitting the string themselves — one definition of the layout, one place to
 * change it.
 */
export function objectKeyOwnerId(objectKey: string): string {
  assertPlainObjectKey(objectKey);
  const parts = objectKey.split("/");
  if (parts.length < 3 || !parts[1]) {
    throw new Error("Malformed object key");
  }
  return parts[1];
}
