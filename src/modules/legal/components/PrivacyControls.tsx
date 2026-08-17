import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Download, Trash2, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { exportMyData, deleteMyAccount } from "@/modules/legal/services/privacyFunctions";
import { useAuthSession } from "@/hooks/useAuthSession";
import { readConsent, writeConsent, type ConsentRecord } from "@/modules/legal/services/consent";

/**
 * The controls the Privacy Policy promises: see your data, take it, delete it,
 * and change your analytics choice.
 *
 * Deletion is guarded by typing the word DELETE rather than a confirm dialog —
 * it is irreversible, and a misclick should not be able to destroy an account.
 */
export function PrivacyControls() {
  const { user, signOut } = useAuthSession();
  const runExport = useServerFn(exportMyData);
  const runDelete = useServerFn(deleteMyAccount);

  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [consent, setConsent] = useState<ConsentRecord | null>(null);

  useEffect(() => setConsent(readConsent()), []);

  async function handleExport() {
    setExporting(true);
    try {
      const { filename, json } = await runExport({});
      // Built and revoked here so the file never touches a third party.
      const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Your data has been downloaded.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not export your data.");
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete() {
    if (confirmText !== "DELETE") return;
    setDeleting(true);
    try {
      const result = await runDelete({});
      if (!result.accountRemoved) {
        toast.error("Your data was removed but the account could not be closed. Contact support.");
        return;
      }
      toast.success("Your account and data have been deleted.");
      await signOut();
      window.location.href = "/";
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete your account.");
    } finally {
      setDeleting(false);
    }
  }

  if (!user) return null;

  return (
    <section
      data-testid="privacy-controls"
      className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm"
    >
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-extrabold text-foreground">Your data</h2>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
        What we hold and why is set out in our{" "}
        <Link to="/privacy-policy" className="font-semibold text-primary hover:underline">
          Privacy Policy
        </Link>
        .
      </p>

      {/* ── Analytics choice ─────────────────────────────────────────────── */}
      <div className="mt-5 rounded-2xl border border-border/60 bg-secondary/30 p-4">
        <p className="text-xs font-bold text-foreground">Activity analytics</p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          {consent?.choice === "accepted"
            ? "On — we record which properties you open and what you search for."
            : "Off — we are not recording your property views or searches."}
        </p>
        <button
          type="button"
          data-testid="toggle-analytics-consent"
          onClick={() =>
            setConsent(writeConsent(consent?.choice === "accepted" ? "rejected" : "accepted"))
          }
          className="mt-3 rounded-xl border border-border bg-background px-3.5 py-2 text-[11px] font-bold text-foreground transition hover:bg-secondary"
        >
          {consent?.choice === "accepted" ? "Turn analytics off" : "Turn analytics on"}
        </button>
      </div>

      {/* ── Export ───────────────────────────────────────────────────────── */}
      <div className="mt-4 rounded-2xl border border-border/60 bg-secondary/30 p-4">
        <p className="text-xs font-bold text-foreground">Download your data</p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          Everything we hold about you, as a JSON file.
        </p>
        <button
          type="button"
          data-testid="export-my-data"
          onClick={handleExport}
          disabled={exporting}
          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-[11px] font-bold text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
        >
          {exporting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          {exporting ? "Preparing…" : "Download my data"}
        </button>
      </div>

      {/* ── Erasure ──────────────────────────────────────────────────────── */}
      <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4">
        <p className="text-xs font-bold text-rose-600 dark:text-rose-400">Delete your account</p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          Removes your profile, favourites, notifications and activity. Enquiries you already sent
          are anonymised rather than erased, so owners keep their own record of the conversation.
          This cannot be undone.
        </p>
        <label className="mt-3 block text-[11px] font-semibold text-foreground">
          Type DELETE to confirm
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            data-testid="delete-confirm-input"
            aria-label="Type DELETE to confirm account deletion"
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-rose-500"
          />
        </label>
        <button
          type="button"
          data-testid="delete-my-account"
          onClick={handleDelete}
          disabled={deleting || confirmText !== "DELETE"}
          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-3.5 py-2 text-[11px] font-bold text-white transition hover:bg-rose-500 disabled:opacity-40"
        >
          {deleting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
          {deleting ? "Deleting…" : "Delete my account"}
        </button>
      </div>
    </section>
  );
}
