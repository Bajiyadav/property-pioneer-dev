export interface ListingFormData {
  // Owner identity (Private)
  owner_name?: string;
  /** Owner's WhatsApp number. Enquiries are delivered here. */
  owner_phone?: string;
  owner_email?: string;

  // Step 1: Property Details
  listing_type?: "rent" | "sale";
  property_type: string;
  property_category?: string;
  bhk_type?: string;
  bedrooms: number;
  bathrooms: number;
  balconies?: number;
  floor_number: string;
  total_floors?: number;
  exact_floor?: number;
  property_age?: string;
  facing?: string;
  area_sqft: number;
  carpet_area_sqft?: number;
  area_unit?: string;
  furnishing_status: "fully-furnished" | "semi-furnished" | "unfurnished";
  parking_covered?: number;
  parking_open?: number;

  // Step 2: Locality Details
  project_name?: string;
  city: string;
  locality: string;
  address: string;
  landmark?: string;
  pincode?: string;
  approx_latitude?: number;
  approx_longitude?: number;

  // Step 3: Rent / Sale Details
  price: number;
  deposit: number;
  maintenance?: number;
  maintenance_included?: boolean;
  rent_negotiable?: boolean;
  ownership_status?: "Freehold" | "Leasehold" | "Power of Attorney" | "Co-operative Society";
  preferred_tenant?: string[];
  food_preference?: string;
  available_from?: string;

  // Step 4: Amenities
  amenities: string[];

  // Step 5: Gallery
  images: string[];
  cover_image_index?: number;
  video_url?: string;

  // Step 6: Schedule
  visit_availability?: "Immediate" | "Within 15 Days" | "Within 30 Days" | "After Specific Date";
  visit_days?: string[];
  visit_time_slots?: string[];
  contact_preference?: "all" | "whatsapp_only" | "call_only";

  // Step 7: Review & Submit
  title: string;
  description: string;
  owner_declaration?: boolean;
  total_rooms?: number;
}

export interface StepProps {
  data: ListingFormData;
  updateData: (data: Partial<ListingFormData>) => void;
}
