export interface ListingFormData {
  owner_name?: string;
  project_name?: string;
  city: string;
  pincode?: string;
  locality: string;
  address: string;
  landmark?: string;
  property_type: string;
  listing_type?: "rent" | "sale";
  bhk_type?: string;
  bedrooms: number;
  bathrooms: number;
  floor_number: string;
  total_rooms?: number;
  area_sqft: number;
  area_unit?: string;
  furnishing_status: "fully-furnished" | "semi-furnished" | "unfurnished";
  preferred_tenant?: string[];
  food_preference?: string;
  price: number;
  deposit: number;
  maintenance?: number;
  maintenance_included?: boolean;
  amenities: string[];
  images: string[];
  title: string;
  description: string;
  property_age?: string;
  total_floors?: number;
  exact_floor?: number;
  balconies?: number;
  parking_covered?: number;
  parking_open?: number;
  facing?: string;
  available_from?: string;
  rent_negotiable?: boolean;
}

export interface StepProps {
  data: ListingFormData;
  updateData: (data: Partial<ListingFormData>) => void;
}
