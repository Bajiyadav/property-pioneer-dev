/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const createPropertyListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: any) => data)
  .handler(async ({ data, context }: { data: any; context: any }) => {
    const { data: property, error } = await supabaseAdmin
      .from("properties")
      .insert({
        owner_id: context.userId,
        title: data.title,
        description: data.description,
        price: Number(data.price),
        bedrooms: Number(data.bedrooms),
        bathrooms: Number(data.bathrooms),
        area_sqft: Number(data.area_sqft || data.area),
        city: data.city,
        locality: data.locality,
        address: data.address,
        property_type: data.propertyType || data.property_type,
        listing_type: data.listing_type || "rent",
        amenities: data.amenities || [],
        images: data.images || data.photos || [],
        video_url: data.videoUrl || data.video_url,
        owner_phone: data.ownerPhone || data.owner_phone,
        owner_name: data.ownerName || data.owner_name,
        owner_email: data.ownerEmail || data.owner_email,
        status: "pending",
        is_approved: false,
        created_at: new Date().toISOString(),
      } as any)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { success: true, propertyId: property.id };
  });
