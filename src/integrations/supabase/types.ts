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
      rental_agreements: {
        Row: {
          id: string;
          user_id: string;
          agreement_number: string;
          agreement_type: string;
          tenant_type: string;
          status: string;
          owner_details: Json;
          tenants: Json;
          property_details: Json;
          rental_terms: Json;
          clauses: Json;
          custom_terms: Json | null;
          payment_status: string;
          payment_amount: number;
          payment_reference: string | null;
          original_agreement_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          agreement_number?: string;
          agreement_type: string;
          tenant_type: string;
          status?: string;
          owner_details: Json;
          tenants: Json;
          property_details: Json;
          rental_terms: Json;
          clauses: Json;
          custom_terms?: Json | null;
          payment_status?: string;
          payment_amount?: number;
          payment_reference?: string | null;
          original_agreement_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          agreement_number?: string;
          agreement_type?: string;
          tenant_type?: string;
          status?: string;
          owner_details?: Json;
          tenants?: Json;
          property_details?: Json;
          rental_terms?: Json;
          clauses?: Json;
          custom_terms?: Json | null;
          payment_status?: string;
          payment_amount?: number;
          payment_reference?: string | null;
          original_agreement_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      kyc_documents: {
        Row: {
          id: string;
          owner_id: string;
          document_type: string;
          file_path: string;
          status: string;
          rejection_reason: string | null;
          uploaded_at: string;
          verified_at: string | null;
        };
        Insert: {
          id?: string;
          owner_id: string;
          document_type: string;
          file_path: string;
          status?: string;
          rejection_reason?: string | null;
          uploaded_at?: string;
          verified_at?: string | null;
        };
        Update: {
          id?: string;
          owner_id?: string;
          document_type?: string;
          file_path?: string;
          status?: string;
          rejection_reason?: string | null;
          uploaded_at?: string;
          verified_at?: string | null;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          inquiry_id: string | null;
          sender_id: string;
          receiver_id: string;
          content: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          inquiry_id?: string | null;
          sender_id: string;
          receiver_id: string;
          content: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          inquiry_id?: string | null;
          sender_id?: string;
          receiver_id?: string;
          content?: string;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
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
      employee_access: {
        Row: {
          id: string;
          user_id: string;
          role: string;
          regions: string[];
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: string;
          regions?: string[];
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: string;
          regions?: string[];
          created_at?: string;
          created_by?: string | null;
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
          video_url: string | null;
          video_thumbnail_url: string | null;
          video_duration: number | null;
          video_status: "pending" | "approved" | "rejected";
          video_uploaded_at: string | null;
          locality: string | null;
          landmark: string | null;
          metro_station: string | null;
          it_park: string | null;
          college: string | null;
          hospital: string | null;
          region: string | null;
          created_at: string;
          updated_at: string;
          project_name: string | null;
          bhk_type: string | null;
          area_unit: string | null;
          media_status: string | null;
          media_notes: string | null;
          approx_latitude: number | null;
          approx_longitude: number | null;
          balconies: number | null;
          exact_floor: number | null;
          total_floors: number | null;
          property_age: string | null;
          facing: string | null;
          parking_covered: number | null;
          parking_open: number | null;
          pincode: string | null;
          available_from: string | null;
          rent_negotiable: boolean | null;
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
          video_url?: string | null;
          video_thumbnail_url?: string | null;
          video_duration?: number | null;
          video_status?: "pending" | "approved" | "rejected";
          video_uploaded_at?: string | null;
          locality?: string | null;
          landmark?: string | null;
          metro_station?: string | null;
          it_park?: string | null;
          college?: string | null;
          hospital?: string | null;
          region?: string | null;
          created_at?: string;
          updated_at?: string;
          project_name?: string | null;
          bhk_type?: string | null;
          area_unit?: string | null;
          media_status?: string | null;
          media_notes?: string | null;
          approx_latitude?: number | null;
          approx_longitude?: number | null;
          balconies?: number | null;
          exact_floor?: number | null;
          total_floors?: number | null;
          property_age?: string | null;
          facing?: string | null;
          parking_covered?: number | null;
          parking_open?: number | null;
          pincode?: string | null;
          available_from?: string | null;
          rent_negotiable?: boolean | null;
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
          video_url?: string | null;
          video_thumbnail_url?: string | null;
          video_duration?: number | null;
          video_status?: "pending" | "approved" | "rejected";
          video_uploaded_at?: string | null;
          locality?: string | null;
          landmark?: string | null;
          metro_station?: string | null;
          it_park?: string | null;
          college?: string | null;
          hospital?: string | null;
          region?: string | null;
          created_at?: string;
          updated_at?: string;
          project_name?: string | null;
          bhk_type?: string | null;
          area_unit?: string | null;
          media_status?: string | null;
          media_notes?: string | null;
          approx_latitude?: number | null;
          approx_longitude?: number | null;
          balconies?: number | null;
          exact_floor?: number | null;
          total_floors?: number | null;
          property_age?: string | null;
          facing?: string | null;
          parking_covered?: number | null;
          parking_open?: number | null;
          pincode?: string | null;
          available_from?: string | null;
          rent_negotiable?: boolean | null;
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
      agent_applications: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          email: string;
          phone: string;
          city: string;
          experience_years: string;
          preferred_areas: string[];
          languages: string[];
          message: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          email: string;
          phone: string;
          city?: string;
          experience_years: string;
          preferred_areas?: string[];
          languages?: string[];
          message?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          email?: string;
          phone?: string;
          city?: string;
          experience_years?: string;
          preferred_areas?: string[];
          languages?: string[];
          message?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      // Mirrors 20260818140100_recover_agent_workflow_tables.sql, which is the
      // migration that actually creates this table. The previous definition
      // described columns that migration never creates (preferred_date,
      // preferred_time_slot, visitor_id, owner_id, agent_id), so TypeScript
      // was validating writes against a shape the database does not have.
      property_visits: {
        Row: {
          id: string;
          property_id: string;
          user_id: string | null;
          visitor_name: string;
          visitor_phone: string;
          visitor_email: string | null;
          visit_type: string;
          visit_date: string;
          visit_time: string;
          status: string;
          agent_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          user_id?: string | null;
          visitor_name: string;
          visitor_phone: string;
          visitor_email?: string | null;
          visit_type?: string;
          visit_date: string;
          visit_time?: string;
          status?: string;
          agent_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          user_id?: string | null;
          visitor_name?: string;
          visitor_phone?: string;
          visitor_email?: string | null;
          visit_type?: string;
          visit_date?: string;
          visit_time?: string;
          status?: string;
          agent_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      agent_leads: {
        Row: {
          id: string;
          agent_id: string;
          lead_name: string;
          lead_email: string | null;
          lead_phone: string;
          preferred_locality: string | null;
          budget_min: number | null;
          budget_max: number | null;
          bedrooms: number | null;
          stage:
            | "new"
            | "contacted"
            | "qualified"
            | "visit_scheduled"
            | "negotiation"
            | "closed"
            | "lost";
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          agent_id: string;
          lead_name: string;
          lead_email?: string | null;
          lead_phone: string;
          preferred_locality?: string | null;
          budget_min?: number | null;
          budget_max?: number | null;
          bedrooms?: number | null;
          stage?:
            | "new"
            | "contacted"
            | "qualified"
            | "visit_scheduled"
            | "negotiation"
            | "closed"
            | "lost";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          agent_id?: string;
          lead_name?: string;
          lead_email?: string | null;
          lead_phone?: string;
          preferred_locality?: string | null;
          budget_min?: number | null;
          budget_max?: number | null;
          bedrooms?: number | null;
          stage?:
            | "new"
            | "contacted"
            | "qualified"
            | "visit_scheduled"
            | "negotiation"
            | "closed"
            | "lost";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
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
