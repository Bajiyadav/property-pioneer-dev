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
  images: z.array(z.string().url()).max(12).default([]),
  status: z.enum(["draft", "available"]).optional(),
});

export const getMyListings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { listOwnerProperties } = await import("./owner.server");
    return listOwnerProperties(context.userId);
  });

export const createListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => listingSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { createOwnerProperty } = await import("./owner.server");
    return createOwnerProperty(context.userId, data);
  });

export const editListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), patch: listingSchema.partial() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { updateOwnerProperty } = await import("./owner.server");
    return updateOwnerProperty(context.userId, data.id, data.patch);
  });

export const removeListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { deleteOwnerProperty } = await import("./owner.server");
    return deleteOwnerProperty(context.userId, data.id);
  });

export const uploadListingImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
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
