import type { TimelineItem } from "@/modules/dashboard/components/DashboardKit";

export interface Booking {
  id: string;
  title: string;
  when: string;
  mode: string;
  owner: string;
  status: "Confirmed" | "Scheduled" | "Completed";
}

export interface Enquiry {
  id: string;
  title: string;
  message: string;
  sent: string;
  status: "Owner responded" | "Awaiting reply";
}

export const BOOKINGS: Booking[] = [
  {
    id: "b1",
    title: "Luxury 2BHK Apartment, Gachibowli",
    when: "Tomorrow · 10:00 AM",
    mode: "In-person walkthrough",
    owner: "Suresh Reddy",
    status: "Confirmed",
  },
  {
    id: "b2",
    title: "Modern Studio, Financial District",
    when: "Friday · 02:00 PM",
    mode: "Live video tour",
    owner: "Anitha Rao",
    status: "Scheduled",
  },
  {
    id: "b3",
    title: "3BHK Gated Villa, Kondapur",
    when: "Last Monday · 05:30 PM",
    mode: "In-person walkthrough",
    owner: "Anil Varma",
    status: "Completed",
  },
];

export const ENQUIRIES: Enquiry[] = [
  {
    id: "e1",
    title: "3BHK Gated Villa, Kondapur",
    message: "Is this available for immediate move-in?",
    sent: "2 hours ago",
    status: "Owner responded",
  },
  {
    id: "e2",
    title: "Fully Furnished 2BHK, Madhapur",
    message: "Interested in scheduling a weekend visit.",
    sent: "Yesterday",
    status: "Awaiting reply",
  },
];

export const NOTIFICATIONS: TimelineItem[] = [
  {
    id: "n1",
    title: "Price drop on a saved home",
    detail: "2BHK in Gachibowli reduced rent by ₹2,000/mo.",
    time: "30 min ago",
    tone: "success",
  },
  {
    id: "n2",
    title: "Visit confirmed",
    detail: "Suresh Reddy confirmed tomorrow at 10:00 AM.",
    time: "3 hours ago",
    tone: "info",
  },
  {
    id: "n3",
    title: "New listings match your search",
    detail: "4 new 2BHK homes in Madhapur under ₹35,000.",
    time: "Yesterday",
    tone: "neutral",
  },
];

export const VIEW_TREND = [
  { label: "Mon", value: 4 },
  { label: "Tue", value: 7 },
  { label: "Wed", value: 5 },
  { label: "Thu", value: 11 },
  { label: "Fri", value: 9 },
  { label: "Sat", value: 15 },
  { label: "Sun", value: 12 },
];

export const SEARCH_PARAMS = {
  q: "",
  city: "Hyderabad",
  listing: "rent",
  minPrice: 0,
  maxPrice: 0,
  beds: 0,
} as const;
