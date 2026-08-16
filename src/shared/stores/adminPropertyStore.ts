import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type Property } from "@/modules/property/services/propertyService";
import { ALL_FALLBACK_PROPERTIES } from "@/modules/property/services/propertyService";

interface AdminPropertyState {
  properties: Property[];
  addProperty: (property: Omit<Property, "id" | "created_at" | "status">) => void;
  approveProperty: (id: string) => void;
  rejectProperty: (id: string, reason: string) => void;
  deleteProperty: (id: string) => void;
  updatePropertyStatus: (id: string, status: Property["status"]) => void;
  getPendingProperties: () => Property[];
  getActiveProperties: () => Property[];
  getRejectedProperties: () => Property[];
  getExpiredProperties: () => Property[];
}

export const useAdminPropertyStore = create<AdminPropertyState>()(
  persist(
    (set, get) => ({
      // Initialize with fallbacks. We map them so they look "active" and "approved"
      properties: ALL_FALLBACK_PROPERTIES.map((p) => ({
        ...p,
        status: "available",
        is_approved: true,
      })),

      addProperty: (newProp) => {
        set((state) => {
          const property: Property = {
            ...newProp,
            id: `prop-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            created_at: new Date().toISOString(),
            status: "pending",
            is_approved: false,
            images: newProp.images?.length
              ? newProp.images
              : ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800"], // fallback image
          };
          return { properties: [property, ...state.properties] };
        });
      },

      approveProperty: (id) => {
        set((state) => ({
          properties: state.properties.map((p) =>
            p.id === id
              ? {
                  ...p,
                  status: "available",
                  is_approved: true,
                  property_verification_status: "verified",
                }
              : p,
          ),
        }));
      },

      rejectProperty: (id, reason) => {
        set((state) => ({
          properties: state.properties.map((p) =>
            p.id === id ? { ...p, status: "rejected", is_approved: false, admin_notes: reason } : p,
          ),
        }));
      },

      deleteProperty: (id) => {
        set((state) => ({
          properties: state.properties.filter((p) => p.id !== id),
        }));
      },

      updatePropertyStatus: (id, status) => {
        set((state) => ({
          properties: state.properties.map((p) => (p.id === id ? { ...p, status } : p)),
        }));
      },

      getPendingProperties: () => get().properties.filter((p) => p.status === "pending"),
      getActiveProperties: () => get().properties.filter((p) => p.status === "available"),
      getRejectedProperties: () => get().properties.filter((p) => p.status === "rejected"),
      getExpiredProperties: () =>
        get().properties.filter((p) => p.status === "archived"),
    }),
    {
      name: "admin-properties-storage",
    },
  ),
);
