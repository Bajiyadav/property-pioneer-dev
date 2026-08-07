export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

/**
 * Generated from the live `iyttetfaavokzyexvqam` schema.
 *
 * Regenerate after any migration:
 *   supabase gen types typescript --project-id <ref> > src/integrations/supabase/types.ts
 *
 * Keeping this in sync is what lets the data layer drop its `as unknown as
 * SupabaseClient` escapes — an untyped client silently accepts a column that
 * does not exist.
 */
export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.5" };
  public: {
    Tables: {
      audit_logs: {
        Row: {
          id: string;
          event: string;
          outcome: string;
          actor_id: string | null;
          subject_type: string | null;
          subject_id: string | null;
          ip_address: string | null;
          user_agent: string | null;
          details: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          event?: string;
          outcome?: string;
          actor_id?: string | null;
          subject_type?: string | null;
          subject_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          details?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          event?: string;
          outcome?: string;
          actor_id?: string | null;
          subject_type?: string | null;
          subject_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          details?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      enquiries: {
        Row: {
          id: string;
          property_id: string;
          name: string;
          phone: string;
          message: string;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id?: string;
          name?: string;
          phone?: string;
          message?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          name?: string;
          phone?: string;
          message?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
        ];
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          property_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          property_id?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          property_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          body: string | null;
          kind: string;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          title?: string;
          body?: string | null;
          kind?: string;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          body?: string | null;
          kind?: string;
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      properties: {
        Row: {
          id: string;
          title: string;
          description: string;
          price: number;
          city: string;
          address: string;
          bedrooms: number;
          bathrooms: number;
          area_sqft: number;
          property_type: string;
          listing_type: string;
          status: string;
          images: string[];
          owner_id: string | null;
          owner_name: string | null;
          owner_phone: string | null;
          owner_email: string | null;
          is_approved: boolean;
          is_featured: boolean;
          owner_verification_status: string | null;
          property_verification_status: string | null;
          verified_by: string | null;
          verified_at: string | null;
          verification_notes: string | null;
          phone_verified: boolean | null;
          email_verified: boolean | null;
          id_verified: boolean | null;
          is_zero_brokerage: boolean | null;
          is_premium: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title?: string;
          description?: string;
          price?: number;
          city?: string;
          address?: string;
          bedrooms?: number;
          bathrooms?: number;
          area_sqft?: number;
          property_type?: string;
          listing_type?: string;
          status?: string;
          images?: string[];
          owner_id?: string | null;
          owner_name?: string | null;
          owner_phone?: string | null;
          owner_email?: string | null;
          is_approved?: boolean;
          is_featured?: boolean;
          owner_verification_status?: string | null;
          property_verification_status?: string | null;
          verified_by?: string | null;
          verified_at?: string | null;
          verification_notes?: string | null;
          phone_verified?: boolean | null;
          email_verified?: boolean | null;
          id_verified?: boolean | null;
          is_zero_brokerage?: boolean | null;
          is_premium?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          price?: number;
          city?: string;
          address?: string;
          bedrooms?: number;
          bathrooms?: number;
          area_sqft?: number;
          property_type?: string;
          listing_type?: string;
          status?: string;
          images?: string[];
          owner_id?: string | null;
          owner_name?: string | null;
          owner_phone?: string | null;
          owner_email?: string | null;
          is_approved?: boolean;
          is_featured?: boolean;
          owner_verification_status?: string | null;
          property_verification_status?: string | null;
          verified_by?: string | null;
          verified_at?: string | null;
          verification_notes?: string | null;
          phone_verified?: boolean | null;
          email_verified?: boolean | null;
          id_verified?: boolean | null;
          is_zero_brokerage?: boolean | null;
          is_premium?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: Database["public"]["Enums"]["app_role"];
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      has_role: {
        Args: { _user_id: string; _role: Database["public"]["Enums"]["app_role"] };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "admin" | "moderator" | "user" | "customer" | "owner" | "agent";
    };
    CompositeTypes: { [_ in never]: never };
  };
};
