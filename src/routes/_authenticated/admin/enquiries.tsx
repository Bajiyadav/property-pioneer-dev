import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getAdminEnquiries } from "@/modules/admin/services/adminFunctions";
import {
  MessageSquare,
  Phone,
  Mail,
  Building2,
  Calendar,
  Search,
  ExternalLink,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/enquiries")({
  component: AdminEnquiriesPage,
});

function AdminEnquiriesPage() {
  const fetchEnquiries = useServerFn(getAdminEnquiries);
  const { data: enquiries = [], isLoading } = useQuery({
    queryKey: ["admin", "enquiries"],
    queryFn: () => fetchEnquiries({}),
  });

  const [searchTerm, setSearchTerm] = useState("");

  const filteredEnquiries = enquiries.filter((enq: any) => {
    const q = searchTerm.toLowerCase();
    const nameMatch = (enq.name || "").toLowerCase().includes(q);
    const phoneMatch = (enq.phone || "").includes(q);
    const emailMatch = (enq.email || "").toLowerCase().includes(q);
    const propMatch = (enq.properties?.title || "").toLowerCase().includes(q);
    return !q || nameMatch || phoneMatch || emailMatch || propMatch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Leads & Enquiries</h1>
          <p className="text-neutral-400 text-sm mt-1">
            Real-time messages, visit requests, and contact inquiries submitted by home seekers.
          </p>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by name, phone, property..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-neutral-400">Loading enquiries...</div>
      ) : filteredEnquiries.length === 0 ? (
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-12 text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-neutral-600 mb-3" />
          <h3 className="text-lg font-bold text-white">No Enquiries Found</h3>
          <p className="text-neutral-400 text-sm mt-1">
            When users submit enquiries or visit requests, they will appear here instantly.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredEnquiries.map((enq: any) => {
            const prop = enq.properties;
            const purePhone = (enq.phone || "").replace(/\D/g, "");
            const whatsappNumber = purePhone.length === 10 ? `91${purePhone}` : purePhone;

            return (
              <div
                key={enq.id}
                className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5 hover:border-neutral-700 transition"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-base text-white">
                        {enq.name || "Anonymous Visitor"}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                        <Clock className="h-3 w-3" />
                        {new Date(enq.created_at).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-300">
                      {enq.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5 text-emerald-400" />
                          <a
                            href={`tel:${enq.phone}`}
                            className="hover:underline text-emerald-400 font-semibold"
                          >
                            {enq.phone}
                          </a>
                        </span>
                      )}
                      {enq.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5 text-neutral-400" />
                          <a href={`mailto:${enq.email}`} className="hover:underline">
                            {enq.email}
                          </a>
                        </span>
                      )}
                      {prop && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5 text-neutral-400" />
                          <span>
                            {prop.title} ({prop.locality || prop.city})
                          </span>
                        </span>
                      )}
                    </div>

                    {enq.message && (
                      <div className="mt-3 bg-neutral-950/60 rounded-xl p-3 border border-neutral-800 text-xs text-neutral-200 leading-relaxed">
                        "{enq.message}"
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {purePhone && (
                      <a
                        href={`https://wa.me/${whatsappNumber}?text=Namaste%20${encodeURIComponent(enq.name || "")}%2C%20thank%20you%20for%20your%20interest%20on%20Seedha%20Properties.`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition"
                      >
                        <span>WhatsApp Lead</span>
                      </a>
                    )}
                    {enq.property_id && (
                      <Link
                        to="/properties/$id"
                        params={{ id: enq.property_id }}
                        className="inline-flex items-center gap-1 rounded-xl bg-neutral-800 px-3.5 py-2 text-xs font-bold text-white hover:bg-neutral-700 transition"
                      >
                        <span>View Home</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
