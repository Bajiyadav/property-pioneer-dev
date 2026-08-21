import { useState } from "react";
import { CustomerPlans } from "@/modules/billing/components/CustomerPlans";
import { OwnerPlans } from "@/modules/billing/components/OwnerPlans";
import { Users, Home } from "lucide-react";

export function PlansPage() {
  const [activeTab, setActiveTab] = useState<"seeker" | "owner">("seeker");

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Hero Tab Selector */}
      <div className="border-b border-border/60 bg-muted/20 py-8">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
          <div className="inline-flex items-center rounded-2xl bg-card p-1.5 border border-border/80 shadow-sm">
            <button
              type="button"
              onClick={() => setActiveTab("seeker")}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === "seeker"
                  ? "bg-teal-600 text-white shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Seeker / Tenant Assisted Plans (From ₹199)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("owner")}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === "owner"
                  ? "bg-teal-600 text-white shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Home className="h-4 w-4" />
              <span>Owner Listing Plans (From ₹249)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="pt-4">{activeTab === "seeker" ? <CustomerPlans /> : <OwnerPlans />}</div>
    </div>
  );
}

export default PlansPage;
