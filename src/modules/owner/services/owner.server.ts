import {
  createSchemaCapability,
  isExtendedColumnUnavailable,
  stripExtendedColumns,
} from "@/modules/property/services/propertySchema";
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
  /** Owner's WhatsApp number, digits only. The contact API reads this. */
  owner_phone: string;
  images: string[];
  status?: "draft" | "available";
  video_url?: string | null;
  video_thumbnail_url?: string | null;
  video_duration?: number | null;
  video_status?: "pending" | "approved" | "rejected";
  video_uploaded_at?: string | null;
  locality?: string | null;
  landmark?: string | null;
  metro_station?: string | null;
  it_park?: string | null;
  college?: string | null;
  hospital?: string | null;
  balconies?: number | null;
  exact_floor?: number | null;
  total_floors?: number | null;
  property_age?: string | null;
  facing?: string | null;
  parking_covered?: number | null;
  parking_open?: number | null;
  pincode?: string | null;
  available_from?: string | null;
  rent_negotiable?: boolean | null;
}

const BASE_OWNER_COLUMNS =
  "id,title,description,price,city,address,bedrooms,bathrooms,area_sqft,property_type,listing_type,status,images,is_approved,is_featured,created_at";

/**
 * Video and location columns from `20260815131921` and the extended video
 * fields from `properties/20260815190000`.
 */
const EXTENDED_OWNER_COLUMNS =
  "video_url,video_thumbnail_url,video_duration,video_status,video_uploaded_at,locality,landmark,metro_station,it_park,college,hospital,balconies,exact_floor,total_floors,property_age,facing,parking_covered,parking_open,pincode,available_from,rent_negotiable";

const OWNER_COLUMNS = `${BASE_OWNER_COLUMNS},${EXTENDED_OWNER_COLUMNS}`;

/** See `propertySchema.ts` — the owner dashboard hits the same schema gap. */
const schema = createSchemaCapability("owner-properties");

function ownerColumns(useExtended: boolean): string {
  return useExtended ? OWNER_COLUMNS : BASE_OWNER_COLUMNS;
}

/**
 * Runs a property query against the full schema, retrying against the base
 * column set if the video/location migration has not been applied.
 */
async function withSchemaFallback<T>(
  run: (columns: string) => PromiseLike<{ data: T | null; error: { code?: string } | null }>,
): Promise<{ data: T | null; error: { code?: string; message?: string } | null }> {
  const tryExtended = schema.shouldTry();
  const first = await run(ownerColumns(tryExtended));

  if (first.error && tryExtended && isExtendedColumnUnavailable(first.error)) {
    schema.record(false);
    return run(ownerColumns(false));
  }
  if (!first.error && tryExtended) schema.record(true);
  return first;
}

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
  const { data, error } = await withSchemaFallback((columns) =>
    db
      .from("properties")
      .select(columns)
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false })
      .limit(200),
  );
  if (error) throw new Error(error.message ?? "Could not load listings");
  return ((data ?? []) as unknown as Array<{ listing_type: string; status: string }>).map(
    normaliseRow,
  );
}

export async function createOwnerProperty(ownerId: string, input: OwnerListingInput) {
  const db = await adminDb();
  const { data, error } = await db
    .from("properties")
    .insert({
      // Drops video/location keys when a read has already proven the columns
      // absent, so creating a listing cannot fail on the un-applied migration.
      ...stripExtendedColumns(input, schema.state()),
      owner_id: ownerId,
      // New listings are never self-published: an admin must approve them
      // before RLS will expose them to the public feed.
      is_approved: false,
      is_featured: false,
      status: input.status ?? "available",
    })
    .select(ownerColumns(schema.shouldTry()))
    .single();
  if (error) throw new Error(error.message);

  // Listing a property is what makes someone an owner, so record the role here.
  //
  // This is the only place the owner role is issued, and it is issued by the
  // server on the strength of an action that actually happened — not chosen by
  // the caller at sign-up, which was the escalation closed in migration
  // 20260817000000. It matters because the owner dashboard is gated on the role:
  // without this, anyone who listed through /list-property could create a
  // property and then be locked out of managing it.
  //
  // Idempotent, and deliberately silent on failure: a bookkeeping error must not
  // undo a listing the user just created successfully.
  await grantOwnerRole(db, ownerId);

  return data;
}

/** Idempotently records the owner role for a user who has just listed. */
async function grantOwnerRole(db: Awaited<ReturnType<typeof adminDb>>, ownerId: string) {
  try {
    const { data: existing } = await db
      .from("user_roles")
      .select("role")
      .eq("user_id", ownerId)
      .eq("role", "owner")
      .maybeSingle();
    if (existing) return;

    await db.from("user_roles").insert({ user_id: ownerId, role: "owner" });
  } catch (err) {
    console.error("[owner] could not record the owner role for", ownerId, err);
  }
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
    .update({ ...stripExtendedColumns(patch, schema.state()), is_approved: false })
    .eq("id", id)
    .eq("owner_id", ownerId)
    .select(ownerColumns(schema.shouldTry()));
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

export async function createVideoUploadUrl(ownerId: string, filename: string, mime: string) {
  if (!["video/mp4", "video/webm", "video/quicktime"].includes(mime)) {
    throw new Error(`Unsupported video type: ${mime}`);
  }

  const ext = mime.split("/")[1].replace("quicktime", "mov");
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-40);
  // Just use a random UUID or timestamp for the path
  const propertyIdPlaceholder = "temp";
  const path = `${ownerId}/${propertyIdPlaceholder}/${Date.now()}-${safe || "video"}.${ext}`;

  const db = await adminDb();
  // Try property-videos first, fallback to property_videos
  let uploadRes = await db.storage.from("property-videos").createSignedUploadUrl(path);
  let targetBucket = "property-videos";
  if (uploadRes.error) {
    uploadRes = await db.storage.from("property_videos").createSignedUploadUrl(path);
    targetBucket = "property_videos";
  }

  if (uploadRes.error) throw new Error(uploadRes.error.message);

  const { data: publicData } = db.storage.from(targetBucket).getPublicUrl(path);

  return {
    signedUrl: uploadRes.data.signedUrl,
    path,
    token: uploadRes.data.token,
    publicUrl: publicData.publicUrl,
  };
}

export interface OwnerLead {
  id: string;
  name: string;
  phone: string;
  message: string;
  createdAt: string;
  propertyId: string;
  propertyTitle: string;
}

/**
 * Enquiries on this owner's listings.
 *
 * Scoped by resolving the owner's property ids first, so an owner can never see
 * a lead belonging to someone else's listing even though this runs with the
 * service role.
 */
export async function listOwnerLeads(ownerId: string): Promise<OwnerLead[]> {
  const db = await adminDb();

  const { data: props, error: propErr } = await db
    .from("properties")
    .select("id,title")
    .eq("owner_id", ownerId);
  if (propErr) throw new Error(propErr.message);
  if (!props?.length) return [];

  const titles = new Map(props.map((p) => [p.id, p.title]));
  const { data, error } = await db
    .from("enquiries")
    .select("id,name,phone,message,created_at,property_id")
    .in("property_id", [...titles.keys()])
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);

  return (data ?? []).map((e) => ({
    id: e.id,
    name: e.name,
    phone: e.phone,
    message: e.message,
    createdAt: e.created_at,
    propertyId: e.property_id,
    propertyTitle: titles.get(e.property_id) ?? "Listing",
  }));
}
