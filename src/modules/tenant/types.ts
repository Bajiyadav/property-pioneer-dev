export interface TenantProfile {
  id?: string;
  user_id?: string;
  phone_number: string;
  full_name: string;
  email: string;
  company_name: string;
  profession: string;
  annual_salary_min?: number;
  annual_salary_max?: number;
  budget_min: number;
  budget_max: number;
  preferred_bhk: string[];
  move_in_date: string;
  is_vegetarian: boolean;
  pets_allowed: boolean;
  preferred_furnishing: "fully-furnished" | "semi-furnished" | "unfurnished" | "any";
  preferred_building_type: string;
  special_amenities: string[];

  // Mandatory Location
  primary_city: string;
  primary_locality: string;
  primary_latitude?: number;
  primary_longitude?: number;
  secondary_cities: string[];

  // Commute
  office_name: string;
  office_latitude?: number;
  office_longitude?: number;
  max_commute_minutes: number;

  profile_completeness: number; // 0-100%
  created_at?: string;
  updated_at?: string;
}

export interface MatchBreakdown {
  locationMatch: number; // 0-100
  budgetMatch: number; // 0-100
  bhkMatch: number; // 0-100
  amenityMatch: number; // 0-100
  totalScore: number; // 0-100 (weighted sum)
}

export interface MatchedProperty {
  id: string;
  title: string;
  price: number;
  deposit: number;
  city: string;
  locality: string;
  address: string;
  bhk_type: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  area_sqft: number;
  furnishing_status: string;
  amenities: string[];
  images: string[];
  owner_name: string;
  owner_phone?: string;
  matchScore: number;
  matchBreakdown: MatchBreakdown;
  commuteTimeMinutes?: number;
  commuteLabel?: string;
  highlights: string[];
}
