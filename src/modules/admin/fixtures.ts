import type { TimelineItem } from "@/modules/dashboard/components/DashboardKit";

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  role: "Customer" | "Owner" | "Agent" | "Admin";
  status: "Active" | "Suspended" | "Pending";
  joined: string;
}

export const USERS: PlatformUser[] = [
  {
    id: "U-1",
    name: "Kavitha Reddy",
    email: "kavitha@example.in",
    role: "Customer",
    status: "Active",
    joined: "12 Mar 2026",
  },
  {
    id: "U-2",
    name: "Suresh Reddy",
    email: "suresh@example.in",
    role: "Owner",
    status: "Active",
    joined: "04 Feb 2026",
  },
  {
    id: "U-3",
    name: "Anitha Rao",
    email: "anitha@example.in",
    role: "Owner",
    status: "Pending",
    joined: "28 Jul 2026",
  },
  {
    id: "U-4",
    name: "Rahul Verma",
    email: "rahul@example.in",
    role: "Agent",
    status: "Active",
    joined: "19 Jan 2026",
  },
  {
    id: "U-5",
    name: "Divya Nair",
    email: "divya@example.in",
    role: "Customer",
    status: "Active",
    joined: "02 Jun 2026",
  },
  {
    id: "U-6",
    name: "Vikram Singh",
    email: "vikram@example.in",
    role: "Agent",
    status: "Suspended",
    joined: "15 Apr 2026",
  },
];

export const AUDIT: TimelineItem[] = [
  {
    id: "au1",
    title: "property.approved",
    detail: "3BHK Kondapur approved by admin@seedhaproperties.com",
    time: "12 min ago",
    tone: "success",
  },
  {
    id: "au2",
    title: "user.role_granted",
    detail: "Agent role granted to rahul@example.in",
    time: "1 hour ago",
    tone: "info",
  },
  {
    id: "au3",
    title: "enquiry.rate_limited",
    detail: "IP 49.37.x.x exceeded the hourly enquiry cap",
    time: "3 hours ago",
    tone: "warning",
  },
  {
    id: "au4",
    title: "auth.failed",
    detail: "5 failed sign-ins for unknown@example.in",
    time: "Yesterday",
    tone: "danger",
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
