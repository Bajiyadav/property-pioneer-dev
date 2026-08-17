import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Owner listing server functions.
 *
 * `requireSupabaseAuth` verifies the caller's JWT and injects `userId`, which is
 * the only owner identity these functions trust. A client cannot pass an
 * `owner_id` — it is always taken from the verified token.
 */

const listingSchema = z.object({
  title: z.string().trim().min(8).max(140),
  description: z.string().trim().min(20).max(4000),
  price: z.number().positive().max(1_000_000_000),
  city: z.string().trim().min(2).max(80),
  address: z.string().trim().min(3).max(200),
  bedrooms: z.number().int().min(0).max(20),
  bathrooms: z.number().int().min(0).max(20),
  area_sqft: z.number().int().min(50).max(1_000_000),
  property_type: z.string().trim().min(2).max(40),
  listing_type: z.enum(["rent", "sale"]),
  // Required, and validated as a real Indian mobile.
  //
  // This field did not exist here, so every listing was written with
  // `owner_phone` null even though both listing flows asked the owner for a
  // number. The contact API then fell back to a hard-coded number belonging to
  // nobody, which meant no enquiry ever reached an owner. A listing that cannot
  // be contacted has no purpose, so this is not optional.
  owner_phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, "").replace(/^91/, ""))
    .refine((v) => /^[6-9]\d{9}$/.test(v), "Enter a valid 10-digit Indian mobile number"),
  images: z.array(z.string().url()).max(12).default([]),
  status: z.enum(["draft", "available"]).optional(),
  video_url: z.string().url().optional().nullable(),
  video_thumbnail_url: z.string().url().optional().nullable(),
  video_duration: z.number().int().nonnegative().optional().nullable(),
  video_status: z.enum(["pending", "approved", "rejected"]).optional(),
  video_uploaded_at: z.string().optional().nullable(),
  locality: z.string().trim().optional().nullable(),
  landmark: z.string().trim().optional().nullable(),
  metro_station: z.string().trim().optional().nullable(),
  it_park: z.string().trim().optional().nullable(),
  college: z.string().trim().optional().nullable(),
  hospital: z.string().trim().optional().nullable(),
});

export const getMyListings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { listOwnerProperties } = await import("./owner.server");
    return listOwnerProperties(context.userId);
  });

export const createListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => listingSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { createOwnerProperty } = await import("./owner.server");
    return createOwnerProperty(context.userId, data);
  });

export const editListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z.object({ id: z.string().uuid(), patch: listingSchema.partial() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { updateOwnerProperty } = await import("./owner.server");
    return updateOwnerProperty(context.userId, data.id, data.patch);
  });

export const removeListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { deleteOwnerProperty } = await import("./owner.server");
    return deleteOwnerProperty(context.userId, data.id);
  });

export const uploadListingImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        dataUrl: z.string().startsWith("data:image/"),
        filename: z.string().max(120).default("photo"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { uploadOwnerImage } = await import("./owner.server");
    return uploadOwnerImage(context.userId, data.dataUrl, data.filename);
  });

export const getSignedVideoUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        filename: z.string().max(120).default("video"),
        mime: z.string().max(50),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { createVideoUploadUrl } = await import("./owner.server");
    return createVideoUploadUrl(context.userId, data.filename, data.mime);
  });

export const getMyLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { listOwnerLeads } = await import("./owner.server");
    return listOwnerLeads(context.userId);
  });
