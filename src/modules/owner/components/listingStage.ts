/**
 * Owner-facing lifecycle stage for a listing.
 *
 * Kept out of the component file so it can be tested directly, and so that file
 * exports only its component (which is what React Fast Refresh needs).
 */
export type ListingStage =
  "draft" | "submitted" | "under_review" | "approved" | "rejected" | "changes_required";

/**
 * Derives the stage from the database row.
 *
 * `is_approved` is the authority — it is what RLS uses to expose a listing
 * publicly. Everything else is presentation. Deliberately conservative: anything
 * not explicitly approved reads as still in review, because showing "Published"
 * for a listing the public cannot see is a lie the owner would act on.
 */
export function deriveStage(row: {
  status?: string | null;
  is_approved?: boolean | null;
  admin_notes?: string | null;
}): ListingStage {
  if (row.is_approved === true) return "approved";
  const s = (row.status ?? "").toLowerCase();
  if (s === "draft") return "draft";
  if (s === "rejected") return "rejected";
  if (s === "changes_required") return "changes_required";
  // A moderator note without a rejected status still means the owner has
  // something to act on — surface it rather than leaving them waiting.
  if (row.admin_notes && row.admin_notes.trim().length > 0) return "changes_required";
  return "under_review";
}
