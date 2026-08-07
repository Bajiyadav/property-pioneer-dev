import type { Property } from "@/lib/properties";

import type { TimelineItem } from "@/modules/dashboard/components/DashboardKit";

export interface OwnerLead {
  id: string;
  name: string;
  phone: string;
  property: string;
  message: string;
  when: string;
  status: "New" | "Contacted" | "Visit booked";
}

export const LEADS: OwnerLead[] = [
  {
    id: "l1",
    name: "Kavitha Reddy",
    phone: "+91 98765 43210",
    property: "2BHK Gachibowli",
    message: "Is parking included in the rent?",
    when: "12 min ago",
    status: "New",
  },
  {
    id: "l2",
    name: "Arjun Kapoor",
    phone: "+91 99887 76655",
    property: "3BHK Villa Kondapur",
    message: "Can I schedule a visit this weekend?",
    when: "3 hours ago",
    status: "Contacted",
  },
  {
    id: "l3",
    name: "Neha Sharma",
    phone: "+91 90000 12345",
    property: "Studio, Hitech City",
    message: "Is it available from the 1st?",
    when: "Yesterday",
    status: "Visit booked",
  },
];

export const VISITS = [
  { id: "v1", day: "Today", time: "04:00 PM", who: "Kavitha Reddy", what: "2BHK Gachibowli" },
  { id: "v2", day: "Tomorrow", time: "11:00 AM", who: "Arjun Kapoor", what: "3BHK Kondapur" },
  { id: "v3", day: "Saturday", time: "01:30 PM", who: "Neha Sharma", what: "Studio, Hitech City" },
];

export const ACTIVITY: TimelineItem[] = [
  {
    id: "a1",
    title: "New enquiry received",
    detail: "Kavitha Reddy asked about parking on 2BHK Gachibowli.",
    time: "12 min ago",
    tone: "info",
  },
  {
    id: "a2",
    title: "Listing approved",
    detail: "Your 3BHK Kondapur listing passed verification.",
    time: "2 hours ago",
    tone: "success",
  },
  {
    id: "a3",
    title: "Visit scheduled",
    detail: "Arjun Kapoor booked a walkthrough for tomorrow 11:00 AM.",
    time: "Yesterday",
    tone: "neutral",
  },
];

export const SEARCH_PARAMS = {
  q: "",
  city: "Hyderabad",
  listing: "rent",
  minPrice: 0,
  maxPrice: 0,
  beds: 0,
} as const;

export const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200";

export function listingImage(p: Property): string {
  return Array.isArray(p.images) && p.images[0] ? p.images[0] : FALLBACK_IMAGE;
}
