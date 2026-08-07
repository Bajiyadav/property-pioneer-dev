import { type PropertyStatus as PropertyStatusType } from "@/modules/property/propertyService";
import { CheckCircle2, Clock, Ban, Archive, Lock, Home } from "lucide-react";

const STATUS_CONFIG: Record<
  PropertyStatusType,
  { label: string; bg: string; text: string; icon: React.ReactNode }
> = {
  available: {
    label: "Available",
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    icon: <Home className="h-3 w-3" />,
  },
  reserved: {
    label: "Reserved",
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    icon: <Clock className="h-3 w-3" />,
  },
  rented: {
    label: "Rented",
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  sold: {
    label: "Sold",
    bg: "bg-indigo-500/10",
    text: "text-indigo-600 dark:text-indigo-400",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  draft: {
    label: "Draft",
    bg: "bg-slate-500/10",
    text: "text-slate-600 dark:text-slate-400",
    icon: <Archive className="h-3 w-3" />,
  },
  pending: {
    label: "Pending Verification",
    bg: "bg-purple-500/10",
    text: "text-purple-600 dark:text-purple-400",
    icon: <Clock className="h-3 w-3" />,
  },
  archived: {
    label: "Archived",
    bg: "bg-zinc-500/10",
    text: "text-zinc-600 dark:text-zinc-400",
    icon: <Archive className="h-3 w-3" />,
  },
  rejected: {
    label: "Rejected",
    bg: "bg-rose-500/10",
    text: "text-rose-600 dark:text-rose-400",
    icon: <Ban className="h-3 w-3" />,
  },
};

export function PropertyStatus({
  status = "available",
  size = "md",
}: {
  status?: PropertyStatusType;
  size?: "sm" | "md" | "lg";
}) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.available;
  const textSize =
    size === "sm"
      ? "text-[10px] px-2 py-0.5"
      : size === "lg"
        ? "text-xs px-3 py-1"
        : "text-xs px-2.5 py-0.5";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold uppercase tracking-wide ${config.bg} ${config.text} ${textSize}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}
