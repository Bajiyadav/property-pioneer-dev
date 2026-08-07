import type { TimelineItem } from "@/modules/dashboard/components/DashboardKit";

export interface Lead {
  id: string;
  name: string;
  phone: string;
  requirement: string;
  budget: string;
  stage: "New" | "Contacted" | "Visited" | "Negotiation" | "Closed";
  source: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  requirement: string;
  since: string;
  value: string;
}

export const LEADS: Lead[] = [
  {
    id: "L-1",
    name: "Kavitha Reddy",
    phone: "+91 98765 43210",
    requirement: "3BHK Gachibowli",
    budget: "₹45,000/mo",
    stage: "Visited",
    source: "Portal",
  },
  {
    id: "L-2",
    name: "Arjun Kapoor",
    phone: "+91 99887 76655",
    requirement: "2BHK Madhapur",
    budget: "₹28,000/mo",
    stage: "Negotiation",
    source: "Referral",
  },
  {
    id: "L-3",
    name: "Sneha Iyer",
    phone: "+91 90012 33445",
    requirement: "Villa, Kondapur",
    budget: "₹1.2 Cr",
    stage: "New",
    source: "WhatsApp",
  },
  {
    id: "L-4",
    name: "Rahul Verma",
    phone: "+91 91234 56789",
    requirement: "Office, Hitech City",
    budget: "₹85,000/mo",
    stage: "Contacted",
    source: "Portal",
  },
  {
    id: "L-5",
    name: "Divya Nair",
    phone: "+91 99000 11223",
    requirement: "2BHK Kukatpally",
    budget: "₹22,000/mo",
    stage: "Closed",
    source: "Walk-in",
  },
];

export const CLIENTS: Client[] = [
  {
    id: "C-1",
    name: "Kavitha Reddy",
    phone: "+91 98765 43210",
    requirement: "3BHK Gachibowli",
    since: "Mar 2026",
    value: "₹45,000/mo",
  },
  {
    id: "C-2",
    name: "Arjun Kapoor",
    phone: "+91 99887 76655",
    requirement: "2BHK Madhapur",
    since: "Apr 2026",
    value: "₹28,000/mo",
  },
  {
    id: "C-3",
    name: "Divya Nair",
    phone: "+91 99000 11223",
    requirement: "2BHK Kukatpally",
    since: "Jan 2026",
    value: "₹22,000/mo",
  },
];

export const VISITS = [
  {
    id: "V-1",
    when: "Today · 04:00 PM",
    client: "Kavitha Reddy",
    property: "3BHK Gachibowli",
    status: "Confirmed" as const,
  },
  {
    id: "V-2",
    when: "Tomorrow · 11:00 AM",
    client: "Rahul Verma",
    property: "Office, Hitech City",
    status: "Confirmed" as const,
  },
  {
    id: "V-3",
    when: "Saturday · 01:30 PM",
    client: "Sneha Iyer",
    property: "Villa, Kondapur",
    status: "Pending" as const,
  },
];

export const COMMISSIONS = [
  {
    id: "M-1",
    client: "Divya Nair",
    property: "2BHK Kukatpally",
    amount: 22000,
    status: "Paid" as const,
    date: "12 Jul 2026",
  },
  {
    id: "M-2",
    client: "Arjun Kapoor",
    property: "2BHK Madhapur",
    amount: 28000,
    status: "Processing" as const,
    date: "28 Jul 2026",
  },
  {
    id: "M-3",
    client: "Kavitha Reddy",
    property: "3BHK Gachibowli",
    amount: 45000,
    status: "Pending" as const,
    date: "—",
  },
];

export const NOTIFICATIONS: TimelineItem[] = [
  {
    id: "an1",
    title: "New lead assigned",
    detail: "Sneha Iyer — Villa, Kondapur (₹1.2 Cr).",
    time: "18 min ago",
    tone: "info",
  },
  {
    id: "an2",
    title: "Commission credited",
    detail: "₹22,000 for the Kukatpally closure.",
    time: "2 days ago",
    tone: "success",
  },
  {
    id: "an3",
    title: "Visit reminder",
    detail: "Kavitha Reddy walkthrough today at 4:00 PM.",
    time: "3 hours ago",
    tone: "warning",
  },
];

export const FUNNEL = [
  { label: "Leads received", value: 48 },
  { label: "Contacted", value: 36 },
  { label: "Visits booked", value: 21 },
  { label: "In negotiation", value: 11 },
  { label: "Closed", value: 6 },
];
