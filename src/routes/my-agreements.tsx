/**
 * Seedha Properties — My Rental Agreements Dashboard Route
 */

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Plus,
  Eye,
  Edit,
  Trash2,
  Copy,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building,
  Calendar,
  IndianRupee,
  RotateCcw,
  Printer,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthSession } from "@/hooks/useAuthSession";
import {
  fetchUserRentalAgreements,
  duplicateAgreementForRenewal,
  deleteRentalAgreementDraft,
} from "@/modules/rental-agreements/services/agreementService";
import {
  type RentalAgreementRecord,
  type AgreementStatus,
} from "@/modules/rental-agreements/types";
import { GLOBAL_TITLE, APP_NAME, getCanonicalUrl } from "@/config/app";

export const Route = createFileRoute("/my-agreements")({
  head: () => {
    const canonicalUrl = getCanonicalUrl("/my-agreements");
    return {
      meta: [
        { title: `My Rental Agreements — ${APP_NAME}` },
        {
          name: "description",
          content:
            "Manage, review, print, and renew your digital rental agreements on Seedha Properties.",
        },
        { name: "robots", content: "noindex, nofollow" },
      ],
      links: [{ rel: "canonical", href: canonicalUrl }],
    };
  },
  component: MyAgreementsPage,
});

function MyAgreementsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { status: authStatus, user } = useAuthSession();

  type TabType = "ALL" | "DRAFTS" | "IN_PROGRESS" | "COMPLETED" | "EXPIRED";
  const [activeTab, setActiveTab] = useState<TabType>("ALL");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const {
    data: agreements = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["user-rental-agreements", user?.id],
    queryFn: () => fetchUserRentalAgreements(),
    enabled: authStatus === "authenticated",
  });

  const handleDuplicateRenewal = async (id: string) => {
    setActionLoadingId(id);
    const res = await duplicateAgreementForRenewal(id);
    setActionLoadingId(null);

    if (res.success && res.newAgreementId) {
      toast.success("Created new agreement draft for renewal!");
      queryClient.invalidateQueries({ queryKey: ["user-rental-agreements"] });
      navigate({ to: "/rental-agreement/create" });
    } else {
      toast.error(res.error || "Failed to create renewal draft.");
    }
  };

  const handleDeleteDraft = async (id: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this draft agreement? This action cannot be undone.",
      )
    ) {
      return;
    }

    setActionLoadingId(id);
    const res = await deleteRentalAgreementDraft(id);
    setActionLoadingId(null);

    if (res.success) {
      toast.success("Draft deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ["user-rental-agreements"] });
    } else {
      toast.error(res.error || "Could not delete draft.");
    }
  };

  // Filtered agreements
  const filteredAgreements = agreements.filter((ag) => {
    if (activeTab === "ALL") return true;
    if (activeTab === "DRAFTS") return ag.status === "DRAFT";
    if (activeTab === "IN_PROGRESS")
      return (
        ag.status === "REVIEW" || ag.status === "PAYMENT_PENDING" || ag.status === "SIGNING_PENDING"
      );
    if (activeTab === "COMPLETED") return ag.status === "COMPLETED";
    if (activeTab === "EXPIRED") return ag.status === "EXPIRED" || ag.status === "CANCELLED";
    return true;
  });

  if (authStatus === "loading") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (authStatus === "guest") {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-4">
        <div className="p-4 rounded-2xl bg-primary/10 text-primary">
          <FileText className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-black text-foreground">Sign In to View Your Agreements</h1>
        <p className="text-xs text-muted-foreground">
          Access all your drafted, active, and completed rental agreements securely.
        </p>
        <Link
          to="/auth"
          search={{ redirect: "/my-agreements" }}
          className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold transition hover:brightness-105 shadow-sm active:scale-95"
        >
          Sign In / Create Account
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              My Rental Agreements
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Manage your legal tenancy documents, print signed agreements, or create renewals.
            </p>
          </div>

          <Link
            to="/rental-agreement/create"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold transition hover:brightness-105 shadow-sm active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Agreement</span>
          </Link>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-card border border-border">
          {[
            { id: "ALL", label: "All Agreements", count: agreements.length },
            {
              id: "DRAFTS",
              label: "Drafts",
              count: agreements.filter((a) => a.status === "DRAFT").length,
            },
            {
              id: "IN_PROGRESS",
              label: "In Review / Progress",
              count: agreements.filter(
                (a) =>
                  a.status === "REVIEW" ||
                  a.status === "SIGNING_PENDING" ||
                  a.status === "PAYMENT_PENDING",
              ).length,
            },
            {
              id: "COMPLETED",
              label: "Completed",
              count: agreements.filter((a) => a.status === "COMPLETED").length,
            },
            {
              id: "EXPIRED",
              label: "Expired",
              count: agreements.filter((a) => a.status === "EXPIRED" || a.status === "CANCELLED")
                .length,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  activeTab === tab.id
                    ? "bg-white/20 text-white"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Agreements List / Empty State */}
        {isLoading ? (
          <div className="py-16 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
            <p className="text-xs text-muted-foreground">Loading your agreements...</p>
          </div>
        ) : filteredAgreements.length === 0 ? (
          <div className="py-16 px-4 text-center rounded-2xl bg-card border border-border space-y-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <FileText className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">No agreements found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {activeTab === "ALL"
                  ? "You haven't created any rental agreements yet. Create your first legally binding agreement in minutes."
                  : `You have no agreements in the "${activeTab.toLowerCase().replace("_", " ")}" category.`}
              </p>
            </div>
            <Link
              to="/rental-agreement/create"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold transition hover:brightness-105"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Rental Agreement</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredAgreements.map((agreement) => {
              const isDraft = agreement.status === "DRAFT";
              const isCompleted = agreement.status === "COMPLETED";

              return (
                <div
                  key={agreement.id}
                  className="p-5 rounded-2xl bg-card border border-border hover:border-primary/40 transition shadow-xs space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-border/60">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-bold text-sm text-foreground">
                          {agreement.agreement_number}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isCompleted
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : isDraft
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                          }`}
                        >
                          {agreement.status}
                        </span>
                        <span className="text-[11px] font-semibold text-muted-foreground capitalize">
                          • {agreement.agreement_type} Tenancy
                        </span>
                      </div>
                      <p className="text-xs font-bold text-foreground">
                        {agreement.property_details?.locality || "Property"},{" "}
                        {agreement.property_details?.city || "Hyderabad"}
                      </p>
                    </div>

                    <div className="text-right space-y-0.5">
                      <span className="text-xs text-muted-foreground block">Monthly Rent</span>
                      <span className="text-sm font-extrabold text-foreground">
                        ₹{agreement.rental_terms?.monthlyRent?.toLocaleString("en-IN") || "0"}/mo
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-muted-foreground">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                        Owner
                      </span>
                      <span className="font-semibold text-foreground truncate block">
                        {agreement.owner_details?.fullName || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                        Tenant
                      </span>
                      <span className="font-semibold text-foreground truncate block">
                        {agreement.tenants?.[0]?.fullName || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                        Duration
                      </span>
                      <span className="font-semibold text-foreground block">
                        {agreement.rental_terms?.durationMonths || 11} Months
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                        Created Date
                      </span>
                      <span className="font-semibold text-foreground block">
                        {new Date(agreement.created_at).toLocaleDateString("en-IN")}
                      </span>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60">
                    <div className="flex items-center gap-2">
                      <Link
                        to="/rental-agreement/$id"
                        params={{ id: agreement.id }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold transition active:scale-95"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>View Deed</span>
                      </Link>

                      {isCompleted && (
                        <button
                          type="button"
                          disabled={actionLoadingId === agreement.id}
                          onClick={() => handleDuplicateRenewal(agreement.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition active:scale-95 disabled:opacity-50"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Renew / Duplicate</span>
                        </button>
                      )}

                      {isDraft && (
                        <Link
                          to="/rental-agreement/create"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold transition hover:brightness-105 active:scale-95"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          <span>Continue Editing</span>
                        </Link>
                      )}
                    </div>

                    {isDraft && (
                      <button
                        type="button"
                        disabled={actionLoadingId === agreement.id}
                        onClick={() => handleDeleteDraft(agreement.id)}
                        className="inline-flex items-center gap-1 text-rose-500 hover:text-rose-600 text-xs font-semibold p-1 transition disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete Draft</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
