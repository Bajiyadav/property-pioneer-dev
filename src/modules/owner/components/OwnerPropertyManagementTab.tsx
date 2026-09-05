import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { nativeApi } from "@/lib/api-client";
import { toast } from "sonner";
import {
  ShieldCheck,
  Building2,
  Phone,
  Calendar,
  IndianRupee,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  AlertCircle,
  UserCheck,
  Wrench,
  Loader2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RequestPropertyManagementDialog } from "./RequestPropertyManagementDialog";

interface MyListing {
  id: string;
  title: string;
  city?: string | null;
  locality?: string | null;
  price?: number | null;
}

interface OwnerPropertyManagementTabProps {
  myListings?: MyListing[];
}

interface PropertyManagementItem {
  id: string;
  propertyId: string;
  status: string;
  servicesRequested: string[];
  ownerContactPhone: string;
  monthlyRentTarget?: number;
  availableFromDate?: string;
  ownerNotes?: string;
  assignedManagerName?: string;
  assignedManagerContact?: string;
  managementFeePercent?: number;
  contractStartDate?: string;
  contractEndDate?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  SUBMITTED: {
    label: "Submitted",
    color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
    icon: Clock,
  },
  UNDER_REVIEW: {
    label: "Under Review",
    color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
    icon: UserCheck,
  },
  APPROVED: {
    label: "Approved",
    color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
    icon: CheckCircle2,
  },
  MANAGEMENT_ACTIVE: {
    label: "Actively Managed",
    color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30",
    icon: ShieldCheck,
  },
  COMPLETED: {
    label: "Completed",
    color: "bg-muted text-muted-foreground border-border",
    icon: CheckCircle2,
  },
  REJECTED: {
    label: "Not Approved",
    color: "bg-destructive/10 text-destructive border-destructive/30",
    icon: XCircle,
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-muted text-muted-foreground border-border",
    icon: AlertCircle,
  },
};

export function OwnerPropertyManagementTab({ myListings = [] }: OwnerPropertyManagementTabProps) {
  const queryClient = useQueryClient();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["owner-property-management-requests"],
    queryFn: async () => {
      const res = await nativeApi.propertyManagement.getMyRequests();
      return (res.data || []) as PropertyManagementItem[];
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await nativeApi.propertyManagement.cancel(id, "Cancelled by property owner");
      if (!res.ok && !res.data) throw new Error(res.error || "Failed to cancel request");
      return res;
    },
    onSuccess: () => {
      toast.success("Property Management request cancelled.");
      queryClient.invalidateQueries({ queryKey: ["owner-property-management-requests"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Could not cancel request.");
    },
  });

  if (isLoading) {
    return (
      <div className="py-16 text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-xs text-muted-foreground">
          Loading your property management portfolio...
        </p>
      </div>
    );
  }

  const requests = data || [];
  const activeCount = requests.filter((r) => r.status === "MANAGEMENT_ACTIVE").length;
  const reviewCount = requests.filter(
    (r) => r.status === "SUBMITTED" || r.status === "UNDER_REVIEW" || r.status === "APPROVED",
  ).length;

  return (
    <div className="space-y-6">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4" /> Seedha Verified Property Management
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight mt-1">
            Managed Properties Portfolio
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Track background checks, manager assignments, rent collection, and scheduled property
            maintenance.
          </p>
        </div>

        {myListings.length > 0 && (
          <div className="flex items-center gap-2">
            <RequestPropertyManagementDialog
              propertyId={selectedPropertyId || myListings[0]?.id || ""}
              propertyTitle={
                myListings.find((p) => p.id === selectedPropertyId)?.title ||
                myListings[0]?.title ||
                "Your Listing"
              }
              onSuccess={() => refetch()}
              triggerButton={
                <Button className="rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-sm">
                  <Plus className="mr-1.5 h-4 w-4" /> Request Management
                </Button>
              }
            />
          </div>
        )}
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase">
            Total Requests
          </p>
          <p className="text-2xl font-extrabold">{requests.length}</p>
        </div>
        <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-4 space-y-1">
          <p className="text-[11px] font-semibold text-purple-700 dark:text-purple-400 uppercase">
            Active Managed
          </p>
          <p className="text-2xl font-extrabold text-purple-700 dark:text-purple-400">
            {activeCount}
          </p>
        </div>
        <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-4 space-y-1">
          <p className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 uppercase">
            Under Review
          </p>
          <p className="text-2xl font-extrabold text-blue-700 dark:text-blue-400">{reviewCount}</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-1">
          <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase">
            Brokerage Saved
          </p>
          <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">
            100% Zero
          </p>
        </div>
      </div>

      {/* Requests List or Empty State */}
      {requests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 sm:p-12 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-lg font-bold">No Properties Under Seedha Management Yet</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Let our certified property managers take care of finding verified tenants, conducting
              quarterly inspections, collecting rent on time, and managing 24/7 maintenance.
            </p>
          </div>

          <div className="pt-2">
            {myListings.length > 0 ? (
              <RequestPropertyManagementDialog
                propertyId={myListings[0].id}
                propertyTitle={myListings[0].title}
                onSuccess={() => refetch()}
                triggerButton={
                  <Button className="rounded-xl px-6 bg-primary text-primary-foreground font-bold text-xs shadow-sm">
                    <Sparkles className="mr-2 h-4 w-4" /> Request Management for{" "}
                    {myListings[0].title}
                  </Button>
                }
              />
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Add a property listing first to request Seedha Property Management.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const matchedProp = myListings.find((p) => p.id === req.propertyId);
            const statusCfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.SUBMITTED;
            const StatusIcon = statusCfg.icon;

            return (
              <div
                key={req.id}
                className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4 shadow-sm hover:border-primary/40 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-muted-foreground">
                        REQ-{req.id.slice(0, 8).toUpperCase()}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold ${statusCfg.color}`}
                      >
                        <StatusIcon className="mr-1 h-3 w-3 inline" />
                        {statusCfg.label}
                      </Badge>
                    </div>
                    <h4 className="text-base font-bold text-foreground">
                      {matchedProp?.title || `Property ID: ${req.propertyId.slice(0, 8)}`}
                    </h4>
                    {matchedProp?.locality && (
                      <p className="text-xs text-muted-foreground">
                        {matchedProp.locality}, {matchedProp.city}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  {(req.status === "SUBMITTED" || req.status === "UNDER_REVIEW") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={cancelMutation.isPending}
                      onClick={() => {
                        if (
                          confirm(
                            "Are you sure you want to cancel this property management request?",
                          )
                        ) {
                          cancelMutation.mutate(req.id);
                        }
                      }}
                      className="text-xs text-muted-foreground hover:text-destructive self-start"
                    >
                      Cancel Request
                    </Button>
                  )}
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border/60 text-xs">
                  <div>
                    <span className="text-muted-foreground text-[11px] block">Owner Contact</span>
                    <span className="font-medium">{req.ownerContactPhone}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[11px] block">Target Rent</span>
                    <span className="font-medium">
                      {req.monthlyRentTarget
                        ? `₹${req.monthlyRentTarget.toLocaleString()}/mo`
                        : "Not specified"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[11px] block">Available From</span>
                    <span className="font-medium">{req.availableFromDate || "Immediate"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[11px] block">Submitted Date</span>
                    <span className="font-medium">
                      {new Date(req.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {/* Assigned Manager Card */}
                {req.assignedManagerName && (
                  <div className="rounded-xl bg-primary/5 border border-primary/20 p-3.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {req.assignedManagerName[0]}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase text-primary tracking-wider">
                          Dedicated Property Manager
                        </p>
                        <p className="font-semibold text-foreground">{req.assignedManagerName}</p>
                      </div>
                    </div>
                    {req.assignedManagerContact && (
                      <div className="flex items-center gap-1.5 text-foreground font-medium">
                        <Phone className="h-3.5 w-3.5 text-primary" /> {req.assignedManagerContact}
                      </div>
                    )}
                  </div>
                )}

                {/* Services Requested Badges */}
                {req.servicesRequested && req.servicesRequested.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-muted-foreground mr-1">Services:</span>
                    {req.servicesRequested.map((srv) => (
                      <Badge
                        key={srv}
                        variant="secondary"
                        className="text-[10px] py-0.5 bg-muted/80 text-foreground font-medium"
                      >
                        {srv.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Rejection / Note banner if any */}
                {req.rejectionReason && (
                  <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
                    <strong>Reason:</strong> {req.rejectionReason}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
