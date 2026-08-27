/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const createPropertyListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: any) => data)
  .handler(async ({ data, context }: { data: any; context: any }) => {
    // Check if the user is an agent/admin
    const { data: userRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .single();

    const isAgent = userRole?.role === "agent" || userRole?.role === "admin";
    const isAgentSubmission = isAgent && data.isAgentSubmission;

    const { data: property, error } = await supabaseAdmin
      .from("properties")
      .insert({
        owner_id: isAgentSubmission ? null : context.userId,
        created_by_agent_id: isAgentSubmission ? context.userId : null,
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
        is_approved: isAgentSubmission ? true : false,
        created_at: new Date().toISOString(),
      } as any)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { success: true, propertyId: property.id };
  });
