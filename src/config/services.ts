import { Truck, Sparkles, Zap, Wrench, Paintbrush, FileText } from "lucide-react";

export interface ServiceItem {
  id: string;
  name: string;
  tag?: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  description: string;
  to: string;
}

export const HOME_SERVICES_LIST: ServiceItem[] = [
  {
    id: "packers-movers",
    name: "Packers & Movers",
    tag: "UPTO 20% OFF",
    icon: Truck,
    iconBg: "bg-amber-100 dark:bg-amber-950/50",
    iconColor: "text-amber-600 dark:text-amber-400",
    description: "Reliable home shifting with zero damages",
    to: "/services",
  },
  {
    id: "home-cleaning",
    name: "Home Cleaning",
    tag: "UPTO 20% OFF",
    icon: Sparkles,
    iconBg: "bg-emerald-100 dark:bg-emerald-950/50",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    description: "Deep cleaning for kitchens, baths & full homes",
    to: "/services",
  },
  {
    id: "electrician",
    name: "Electrician",
    icon: Zap,
    iconBg: "bg-yellow-100 dark:bg-yellow-950/50",
    iconColor: "text-yellow-600 dark:text-yellow-400",
    description: "Verified electricians for fast repair & wiring",
    to: "/services",
  },
  {
    id: "plumber",
    name: "Plumber",
    icon: Wrench,
    iconBg: "bg-blue-100 dark:bg-blue-950/50",
    iconColor: "text-blue-600 dark:text-blue-400",
    description: "Leakage, tap fixes & sanitary fittings",
    to: "/services",
  },
  {
    id: "painting",
    name: "Painting",
    icon: Paintbrush,
    iconBg: "bg-purple-100 dark:bg-purple-950/50",
    iconColor: "text-purple-600 dark:text-purple-400",
    description: "Interior & exterior fresh coat wall painting",
    to: "/services",
  },
  {
    id: "rental-agreement",
    name: "Rental Agreement",
    icon: FileText,
    iconBg: "bg-rose-100 dark:bg-rose-950/50",
    iconColor: "text-rose-600 dark:text-rose-400",
    description: "Legally stamped e-agreements delivered instantly",
    to: "/services",
  },
];
