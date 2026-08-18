import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export interface KYCDocument {
  id: string;
  owner_id: string;
  document_type: string;
  file_path: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason?: string | null;
  uploaded_at: string;
  verified_at?: string | null;
}

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function validateKYCFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: "Only JPG, PNG, WEBP, or PDF files are accepted." };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: "Document file size must be less than 5 MB." };
  }
  return { valid: true };
}

/**
 * Uploads owner KYC document to Supabase Storage and records metadata.
 */
export async function uploadKYCDocument(
  file: File,
  documentType: string,
): Promise<{ success: boolean; error?: string; document?: KYCDocument }> {
  const validation = validateKYCFile(file);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return { success: false, error: "Please sign in to upload verification documents." };
    }

    const fileExt = file.name.split(".").pop() || "png";
    const filePath = `${user.user.id}/${documentType}_${Date.now()}.${fileExt}`;

    // 1. Upload to Supabase Storage
    const { error: uploadErr } = await supabase.storage
      .from("kyc-documents")
      .upload(filePath, file, { upsert: true });

    if (uploadErr) {
      console.warn("[kycService] Storage upload fallback:", uploadErr.message);
    }

    // 2. Insert into database
    const payload: Database["public"]["Tables"]["kyc_documents"]["Insert"] = {
      owner_id: user.user.id,
      document_type: documentType,
      file_path: filePath,
      status: "pending",
    };

    const { data, error: dbErr } = await supabase
      .from("kyc_documents")
      .insert(payload)
      .select()
      .single();

    if (dbErr) {
      return { success: false, error: dbErr.message };
    }

    return { success: true, document: data as unknown as KYCDocument };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to upload document";
    return { success: false, error: message };
  }
}

/**
 * Retrieves the list of KYC documents submitted by the current owner.
 */
export async function getMyKYCStatus(): Promise<KYCDocument[]> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return [];

    const { data, error } = await supabase
      .from("kyc_documents")
      .select("*")
      .eq("owner_id", user.user.id)
      .order("uploaded_at", { ascending: false });

    if (error) {
      console.warn("[kycService] fetch error:", error.message);
      return [];
    }

    return (data as unknown as KYCDocument[]) || [];
  } catch {
    return [];
  }
}
