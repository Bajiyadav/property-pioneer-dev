import { toListingType } from "@/modules/property/services/propertyQueries";
import type { Property, PropertyStatus } from "@/modules/property/services/propertyService";

/**
 * Server-only owner listing operations.
 *
 * These run with the service-role client so they can write to `properties` and
 * to storage. Every function takes `ownerId` from the verified JWT — never from
 * client input — and scopes writes to `owner_id = ownerId`, so an owner can
 * only ever touch their own listings even though RLS is bypassed here.
 */

/** Service-role client. Types are generated from the live schema, so no cast. */
async function adminDb() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export interface OwnerListingInput {
  title: string;
  description: string;
  price: number;
  city: string;
  address: string;
  bedrooms: number;
  bathrooms: number;
  area_sqft: number;
  property_type: string;
  listing_type: "rent" | "sale";
  images: string[];
  status?: "draft" | "available";
}

const OWNER_COLUMNS =
  "id,title,description,price,city,address,bedrooms,bathrooms,area_sqft,property_type,listing_type,status,images,is_approved,is_featured,created_at";

/**
 * Rows come back with `listing_type` as free-text, so normalise once here at the
 * data-access boundary rather than making every consumer cast.
 */
const PROPERTY_STATUSES: PropertyStatus[] = [
  "draft",
  "pending",
  "available",
  "reserved",
  "rented",
  "sold",
  "archived",
  "rejected",
];

function toPropertyStatus(value: string): PropertyStatus {
  return (PROPERTY_STATUSES as string[]).includes(value) ? (value as PropertyStatus) : "available";
}

function normaliseRow(row: { listing_type: string; status: string }): Property {
  return {
    ...row,
    listing_type: toListingType(row.listing_type),
    status: toPropertyStatus(row.status),
  } as Property;
}

export async function listOwnerProperties(ownerId: string) {
  const db = await adminDb();
  const { data, error } = await db
    .from("properties")
    .select(OWNER_COLUMNS)
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []).map(normaliseRow);
}

export async function createOwnerProperty(ownerId: string, input: OwnerListingInput) {
  const db = await adminDb();
  const { data, error } = await db
    .from("properties")
    .insert({
      ...input,
      owner_id: ownerId,
      // New listings are never self-published: an admin must approve them
      // before RLS will expose them to the public feed.
      is_approved: false,
      is_featured: false,
      status: input.status ?? "available",
    })
    .select(OWNER_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateOwnerProperty(
  ownerId: string,
  id: string,
  patch: Partial<OwnerListingInput>,
) {
  const db = await adminDb();
  // Editing content sends the listing back for re-approval.
  const { data, error } = await db
    .from("properties")
    .update({ ...patch, is_approved: false })
    .eq("id", id)
    .eq("owner_id", ownerId)
    .select(OWNER_COLUMNS);
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error("Listing not found, or it is not yours to edit.");
  return data[0];
}

export async function deleteOwnerProperty(ownerId: string, id: string) {
  const db = await adminDb();
  const { data, error } = await db
    .from("properties")
    .delete()
    .eq("id", id)
    .eq("owner_id", ownerId)
    .select("id");
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error("Listing not found, or it is not yours to delete.");
  return { ok: true, id };
}

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Uploads a base64 image on the owner's behalf and returns its public URL.
 * Goes through the service-role client so the storage bucket needs no
 * per-user RLS policy; the path is namespaced by owner id.
 */
export async function uploadOwnerImage(ownerId: string, dataUrl: string, filename: string) {
  const match = /^data:([a-zA-Z0-9/+.-]+);base64,(.+)$/.exec(dataUrl);
  if (!match) throw new Error("Image must be a base64 data URL.");
  const [, mime, b64] = match;
  if (!ALLOWED_MIME.includes(mime)) throw new Error(`Unsupported image type: ${mime}`);

  const bytes = Buffer.from(b64, "base64");
  if (bytes.byteLength > MAX_BYTES) throw new Error("Image is larger than the 5 MB limit.");

  const ext = mime.split("/")[1].replace("jpeg", "jpg");
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-40);
  const path = `${ownerId}/${Date.now()}-${safe || "photo"}.${ext}`;

  const db = await adminDb();
  const { error } = await db.storage
    .from("property-images")
    .upload(path, bytes, { contentType: mime, upsert: false });
  if (error) throw new Error(error.message);

  const { data } = db.storage.from("property-images").getPublicUrl(path);
  return { url: data.publicUrl, path };
}
