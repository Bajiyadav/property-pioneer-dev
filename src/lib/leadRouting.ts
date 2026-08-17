import { supabase } from "@/integrations/supabase/client";

export interface LiveActivityInput {
  activity_type: "search" | "view_listing" | "draft_listing" | "enquiry" | "schedule_visit";
  locality: string;
  city?: string;
  latitude?: number | null;
  longitude?: number | null;
  property_id?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  search_query?: string | null;
}

export interface VisitScheduleInput {
  property_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  visit_type: "in_person" | "video_call";
  preferred_date: string;
  preferred_slot: string;
  locality: string;
  notes?: string;
}

export async function logLiveActivity(input: LiveActivityInput) {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id || null;

    const { error } = await supabase.from("live_activities").insert({
      user_id: userId,
      activity_type: input.activity_type,
      locality: input.locality || "Kukatpally",
      city: input.city || "Hyderabad",
      latitude: input.latitude || null,
      longitude: input.longitude || null,
      property_id: input.property_id || null,
      contact_name: input.contact_name || userData.user?.user_metadata?.full_name || null,
      contact_phone: input.contact_phone || userData.user?.user_metadata?.phone || null,
      contact_email: input.contact_email || userData.user?.email || null,
      search_query: input.search_query || null,
      status: "new",
    });

    if (error) {
      console.warn("Log live activity warning:", error.message);
    }
  } catch (err) {
    console.warn("Log live activity exception:", err);
  }
}

export async function scheduleCustomerVisit(input: VisitScheduleInput) {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id || null;

  const { data, error } = await supabase
    .from("visit_schedules")
    .insert({
      property_id: input.property_id,
      customer_id: userId,
      customer_name: input.customer_name,
      customer_phone: input.customer_phone,
      customer_email: input.customer_email || userData.user?.email || null,
      visit_type: input.visit_type,
      preferred_date: input.preferred_date,
      preferred_slot: input.preferred_slot,
      locality: input.locality,
      notes: input.notes || null,
      status: "scheduled",
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  // Log activity
  await logLiveActivity({
    activity_type: "schedule_visit",
    locality: input.locality,
    property_id: input.property_id,
    contact_name: input.customer_name,
    contact_phone: input.customer_phone,
    contact_email: input.customer_email,
    search_query: `${input.visit_type === "video_call" ? "Video Tour" : "In-Person Visit"} on ${input.preferred_date} (${input.preferred_slot})`,
  });

  return data;
}

export async function fetchLiveActivities(localityFilter?: string) {
  let query = supabase
    .from("live_activities")
    .select("*, properties(title, city, price, locality)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (localityFilter && localityFilter !== "all") {
    query = query.eq("locality", localityFilter);
  }

  const { data, error } = await query;
  if (error) {
    console.warn("fetchLiveActivities:", error.message);
    return [];
  }
  return data || [];
}

export async function fetchVisitSchedules(localityFilter?: string) {
  let query = supabase
    .from("visit_schedules")
    .select("*, properties(title, city, locality, address, owner_id)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (localityFilter && localityFilter !== "all") {
    query = query.eq("locality", localityFilter);
  }

  const { data, error } = await query;
  if (error) {
    console.warn("fetchVisitSchedules:", error.message);
    return [];
  }
  return data || [];
}
