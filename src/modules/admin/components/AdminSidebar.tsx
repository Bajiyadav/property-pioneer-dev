import React from "react";
import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Clock,
  CheckCircle2,
  XCircle,
  Archive,
  LogOut,
  ShieldCheck,
} from "lucide-react";

export function AdminSidebar({
  currentView,
  setView,
}: {
  currentView: string;
  setView: (v: string) => void;
}) {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "pending", label: "Pending Approvals", icon: Clock },
    { id: "active", label: "Active Listings", icon: CheckCircle2 },
    { id: "rejected", label: "Rejected Listings", icon: XCircle },
    { id: "expired", label: "Expired & Archived", icon: Archive },
  ];

  return (
    <div className="w-64 bg-white border-r border-neutral-200 h-[calc(100vh-64px)] sticky top-16 flex flex-col">
      <div className="p-4 border-b border-neutral-100">
        <div className="flex items-center gap-2 text-brand-700 font-semibold">
          <ShieldCheck className="w-5 h-5" />
          <span>Admin Portal</span>
        </div>
      </div>

      <div className="flex-1 py-4 flex flex-col gap-1 px-3">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              currentView === item.id
                ? "bg-brand-50 text-brand-700"
                : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
            }`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </div>

      <div className="p-4 border-t border-neutral-100">
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Exit Admin
        </Link>
      </div>
    </div>
  );
}
