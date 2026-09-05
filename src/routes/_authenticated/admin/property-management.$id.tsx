import React, { useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { nativeApi } from "@/lib/api-client";
import { toast } from "sonner";
import {
  ShieldCheck,
  ArrowLeft,
  Lock,
  MessageSquare,
  UserCheck,
  Phone,
  Building2,
  Calendar,
  IndianRupee,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  Loader2,
  Percent,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/admin/property-management/$id")({
  component: AdminPropertyManagementDetailPage,
});

const STATUS_PILLS: Record<string, { label: string; color: string }> = {
  SUBMITTED: {
    label: "Submitted",
    color: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  },
  UNDER_REVIEW: {
    label: "Under Review",
    color: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  },
  APPROVED: {
    label: "Approved",
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  },
  MANAGEMENT_ACTIVE: {
    label: "Active Managed",
    color: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  },
  COMPLETED: {
    label: "Completed",
    color: "bg-neutral-800 text-neutral-400 border-neutral-700",
  },
  REJECTED: {
    label: "Rejected",
    color: "bg-red-500/10 text-red-400 border-red-500/30",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-neutral-800 text-neutral-400 border-neutral-700",
  },
};

function AdminPropertyManagementDetailPage() {
  const { id } = useParams({ from: "/_authenticated/admin/property-management/$id" });
  const queryClient = useQueryClient();

  const [newNote, setNewNote] = useState("");
  const [targetStatus, setTargetStatus] = useState("");
  const [managerName, setManagerName] = useState("");
  const [managerPhone, setManagerPhone] = useState("");
  const [feePercent, setFeePercent] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const {
    data: request,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["admin-pm-detail", id],
    queryFn: async () => {
      const res = await nativeApi.adminPropertyManagement.getById(id);
      if (!res.ok && !res.data) throw new Error(res.error || "Failed to load request");
      const item = res.data;
      setTargetStatus(item.status);
      setManagerName(item.assignedManagerName || "");
      setManagerPhone(item.assignedManagerContact || "");
      setFeePercent(item.managementFeePercent ? String(item.managementFeePercent) : "");
      return item;
    },
  });

  const { data: notes = [], refetch: refetchNotes } = useQuery({
    queryKey: ["admin-pm-notes", id],
    queryFn: async () => {
      const res = await nativeApi.adminPropertyManagement.getInternalNotes(id);
      return res.data || [];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async () => {
      const res = await nativeApi.adminPropertyManagement.updateStatus(id, {
        status: targetStatus,
        assignedManagerName: managerName.trim() || undefined,
        assignedManagerContact: managerPhone.trim() || undefined,
        managementFeePercent: feePercent ? parseFloat(feePercent) : undefined,
        rejectionReason: targetStatus === "REJECTED" ? rejectionReason.trim() : undefined,
      });
      if (!res.ok && !res.data) throw new Error(res.error || "Failed to update status");
      return res;
    },
    onSuccess: () => {
      toast.success("Property Management status updated successfully!");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["admin-pm-stats"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update status.");
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async () => {
      if (!newNote.trim()) return;
      const res = await nativeApi.adminPropertyManagement.addInternalNote(id, newNote.trim());
      if (!res.ok && !res.data) throw new Error(res.error || "Failed to add note");
      return res;
    },
    onSuccess: () => {
      setNewNote("");
      toast.success("Internal note added to audit thread.");
      refetchNotes();
    },
    onError: (err: any) => {
      toast.error(err.message || "Could not add internal note.");
    },
  });

  if (isLoading) {
    return (
      <div className="py-20 text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-400" />
        <p className="text-xs text-neutral-400">Loading management request details...</p>
      </div>
    );
  }

  if (isError || !request) {
    return (
      <div className="py-20 text-center space-y-4">
        <AlertCircle className="h-10 w-10 mx-auto text-red-400" />
        <h2 className="text-lg font-bold text-white">Management Request Not Found</h2>
        <Button asChild variant="outline" className="rounded-xl">
          <Link to="/admin/property-management">Back to Requests</Link>
        </Button>
      </div>
    );
  }

  const statusCfg = STATUS_PILLS[request.status] || STATUS_PILLS.SUBMITTED;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Back Link & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div className="space-y-1">
          <Link
            to="/admin/property-management"
            className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to all requests
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight font-mono">
              REQ-{request.id.slice(0, 8).toUpperCase()}
            </h1>
            <Badge variant="outline" className={`text-xs font-bold ${statusCfg.color}`}>
              {statusCfg.label}
            </Badge>
          </div>
          <p className="text-xs text-neutral-400">
            Submitted on{" "}
            {new Date(request.createdAt).toLocaleString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details & Internal Notes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Request Overview Card */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5 sm:p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Building2 className="h-4 w-4 text-emerald-400" /> Property & Owner Overview
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-neutral-500 block text-[11px]">Property ID</span>
                <span className="font-mono text-white text-xs">{request.propertyId}</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[11px]">Owner Contact Phone</span>
                <span className="text-white font-medium flex items-center gap-1.5 mt-0.5">
                  <Phone className="h-3.5 w-3.5 text-emerald-400" /> {request.ownerContactPhone}
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[11px]">Target Monthly Rent</span>
                <span className="text-white font-medium">
                  {request.monthlyRentTarget
                    ? `₹${request.monthlyRentTarget.toLocaleString()}/mo`
                    : "Not specified"}
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[11px]">Available From Date</span>
                <span className="text-white font-medium">
                  {request.availableFromDate || "Immediate"}
                </span>
              </div>
            </div>

            {/* Services Requested */}
            <div className="pt-2">
              <span className="text-neutral-500 block text-[11px] mb-1.5">
                Requested Management Scope
              </span>
              <div className="flex flex-wrap gap-1.5">
                {request.servicesRequested?.map((srv: string) => (
                  <Badge
                    key={srv}
                    variant="outline"
                    className="bg-neutral-800 text-neutral-300 border-neutral-700 text-[10px]"
                  >
                    {srv.replace(/_/g, " ")}
                  </Badge>
                ))}
              </div>
            </div>

            {request.ownerNotes && (
              <div className="rounded-xl bg-neutral-950 p-3.5 border border-neutral-800 text-xs">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block mb-1">
                  Owner's Special Instructions
                </span>
                <p className="text-neutral-200 leading-relaxed">{request.ownerNotes}</p>
              </div>
            )}
          </div>

          {/* Strictly Private Internal Notes Thread */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Confidential Internal Notes
                </h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Admins Only • Never Exposed to Owner
              </span>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              Use this thread to document tenant background scores, police verification status,
              physical condition logs, and relationship manager handoffs.
            </p>

            {/* Notes List */}
            <div className="space-y-3 pt-2">
              {notes.length === 0 ? (
                <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 text-center text-xs text-neutral-500">
                  No internal notes recorded yet. Add the first audit entry below.
                </div>
              ) : (
                notes.map((noteItem: any) => (
                  <div
                    key={noteItem.id}
                    className="rounded-xl border border-neutral-800 bg-neutral-950 p-3.5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[11px] text-neutral-500">
                      <span className="font-semibold text-neutral-300">
                        Admin ({noteItem.authorId.slice(0, 8)})
                      </span>
                      <span>
                        {new Date(noteItem.createdAt).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-200 whitespace-pre-wrap leading-relaxed">
                      {noteItem.note}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Add Note Input */}
            <div className="pt-2 space-y-2">
              <Textarea
                placeholder="Write confidential internal audit note (e.g. Legal documents verified, tenant police report received)..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={3}
                className="bg-neutral-950 border-neutral-800 rounded-xl text-xs text-white placeholder:text-neutral-600 resize-none"
              />
              <Button
                onClick={() => addNoteMutation.mutate()}
                disabled={addNoteMutation.isPending || !newNote.trim()}
                size="sm"
                className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
              >
                {addNoteMutation.isPending ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                )}
                Save Internal Note
              </Button>
            </div>
          </div>
        </div>

        {/* Right Col: Admin Lifecycle & Status Controller */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-emerald-400" /> Operational Control
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <Label className="text-[11px] font-semibold text-neutral-300 uppercase">
                  Lifecycle Status
                </Label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  className="mt-1.5 w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="SUBMITTED">SUBMITTED (Pending Review)</option>
                  <option value="UNDER_REVIEW">UNDER_REVIEW (Assigned & Assessing)</option>
                  <option value="APPROVED">APPROVED (Agreement Prepared)</option>
                  <option value="MANAGEMENT_ACTIVE">MANAGEMENT_ACTIVE (Active Handover)</option>
                  <option value="COMPLETED">COMPLETED (Term Finished)</option>
                  <option value="REJECTED">REJECTED (Not Qualified)</option>
                  <option value="CANCELLED">CANCELLED (Owner Terminated)</option>
                </select>
              </div>

              <div>
                <Label className="text-[11px] font-semibold text-neutral-300 uppercase">
                  Dedicated Property Manager
                </Label>
                <Input
                  placeholder="e.g. Ramesh Kumar"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  className="mt-1.5 bg-neutral-950 border-neutral-800 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <Label className="text-[11px] font-semibold text-neutral-300 uppercase">
                  Manager Contact Number
                </Label>
                <Input
                  placeholder="e.g. +91 9876543210"
                  value={managerPhone}
                  onChange={(e) => setManagerPhone(e.target.value)}
                  className="mt-1.5 bg-neutral-950 border-neutral-800 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <Label className="text-[11px] font-semibold text-neutral-300 uppercase">
                  Management Fee (%)
                </Label>
                <Input
                  type="number"
                  placeholder="e.g. 5.0"
                  value={feePercent}
                  onChange={(e) => setFeePercent(e.target.value)}
                  className="mt-1.5 bg-neutral-950 border-neutral-800 rounded-xl text-xs text-white"
                />
              </div>

              {targetStatus === "REJECTED" && (
                <div>
                  <Label className="text-[11px] font-semibold text-red-400 uppercase">
                    Rejection Reason
                  </Label>
                  <Textarea
                    placeholder="State clear reason for not accepting management..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={2}
                    className="mt-1.5 bg-neutral-950 border-red-900/60 rounded-xl text-xs text-white resize-none"
                  />
                </div>
              )}

              <Button
                onClick={() => updateStatusMutation.mutate()}
                disabled={updateStatusMutation.isPending}
                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md mt-2"
              >
                {updateStatusMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving Changes...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Save Lifecycle Updates
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
