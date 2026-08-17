export interface ListingFormData {
  city: string;
  locality: string;
  address: string;
  landmark?: string;
  property_type: string;
  listing_type?: "rent" | "sale";
  bedrooms: number;
  bathrooms: number;
  floor_number: string;
  total_rooms?: number;
  area_sqft: number;
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
}

export interface StepProps {
  data: ListingFormData;
  updateData: (data: Partial<ListingFormData>) => void;
}
