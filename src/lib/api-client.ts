/**
 * Seedha Properties - Native API Client (v2)
 * Self-managed backend API client communicating with AWS ECS/Fargate endpoints.
 * Completely replaces Supabase JS SDK at runtime.
 */

const BASE_API_URL =
  typeof window !== "undefined" ? "" : process.env.API_BASE_URL || "http://localhost:5173";

export interface ApiUser {
  id: string;
  email: string;
  role: string;
  fullName: string;
}

export interface ApiSession {
  token: string;
  user: ApiUser;
  expiresAt?: string;
}

type AuthListener = (event: "SIGNED_IN" | "SIGNED_OUT", session: ApiSession | null) => void;
const authListeners: Set<AuthListener> = new Set();

class NativeApiClient {
  private token: string | null = null;
  private user: ApiUser | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("seedha_token");
      const savedUser = localStorage.getItem("seedha_user");
      if (savedUser) {
        try {
          this.user = JSON.parse(savedUser);
        } catch {
          this.user = null;
        }
      }
    }
  }

  private getHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...customHeaders,
    };
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }
    return headers;
  }

  // -------------------------------------------------------------------------
  // AUTHENTICATION
  // -------------------------------------------------------------------------
  auth = {
    signUp: async (credentials: {
      email: string;
      password: string;
      fullName?: string;
      phone?: string;
      role?: string;
    }) => {
      const res = await fetch(`${BASE_API_URL}/api/v2/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "signup", ...credentials }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to sign up");
      }
      this.setSession(data.token, data.user);
      return { user: data.user, token: data.token };
    },

    signInWithPassword: async (credentials: { email: string; password: string }) => {
      const res = await fetch(`${BASE_API_URL}/api/v2/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", ...credentials }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Invalid credentials");
      }
      this.setSession(data.token, data.user);
      return { user: data.user, token: data.token };
    },

    signOut: async () => {
      this.token = null;
      this.user = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("seedha_token");
        localStorage.removeItem("seedha_user");
      }
      authListeners.forEach((listener) => listener("SIGNED_OUT", null));
    },

    getUser: async (): Promise<ApiUser | null> => {
      if (!this.token) return null;
      try {
        const res = await fetch(`${BASE_API_URL}/api/v2/auth`, {
          headers: this.getHeaders(),
        });
        const data = await res.json();
        if (data.ok && data.user) {
          this.user = data.user;
          return data.user;
        }
      } catch {
        // Fallback
      }
      return this.user;
    },

    getSession: (): ApiSession | null => {
      if (!this.token || !this.user) return null;
      return { token: this.token, user: this.user };
    },

    onAuthStateChange: (callback: AuthListener) => {
      authListeners.add(callback);
      if (this.token && this.user) {
        callback("SIGNED_IN", { token: this.token, user: this.user });
      }
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              authListeners.delete(callback);
            },
          },
        },
      };
    },
  };

  private setSession(token: string, user: ApiUser) {
    this.token = token;
    this.user = user;
    if (typeof window !== "undefined") {
      localStorage.setItem("seedha_token", token);
      localStorage.setItem("seedha_user", JSON.stringify(user));
    }
    authListeners.forEach((listener) => listener("SIGNED_IN", { token, user }));
  }

  // -------------------------------------------------------------------------
  // PROPERTIES MARKETPLACE
  // -------------------------------------------------------------------------
  properties = {
    list: async (
      params: {
        city?: string;
        listingType?: string;
        propertyType?: string;
        limit?: number;
        offset?: number;
      } = {},
    ) => {
      const query = new URLSearchParams();
      if (params.city) query.set("city", params.city);
      if (params.listingType) query.set("listingType", params.listingType);
      if (params.propertyType) query.set("propertyType", params.propertyType);
      if (params.limit) query.set("limit", params.limit.toString());
      if (params.offset) query.set("offset", params.offset.toString());

      const res = await fetch(`${BASE_API_URL}/api/v2/properties?${query.toString()}`, {
        headers: this.getHeaders(),
      });
      return res.json();
    },

    create: async (payload: any) => {
      const res = await fetch(`${BASE_API_URL}/api/v2/properties/manage`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });
      return res.json();
    },

    update: async (id: string, payload: any) => {
      const res = await fetch(`${BASE_API_URL}/api/v2/properties/manage`, {
        method: "PATCH",
        headers: this.getHeaders(),
        body: JSON.stringify({ id, ...payload }),
      });
      return res.json();
    },
  };

  // -------------------------------------------------------------------------
  // ENQUIRIES & LEADS
  // -------------------------------------------------------------------------
  enquiries = {
    list: async () => {
      const res = await fetch(`${BASE_API_URL}/api/v2/enquiries`, {
        headers: this.getHeaders(),
      });
      return res.json();
    },
    submit: async (data: { propertyId: string; name: string; phone: string; message?: string }) => {
      const res = await fetch(`${BASE_API_URL}/api/v2/enquiries`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      return res.json();
    },
  };

  // -------------------------------------------------------------------------
  // SITE VISITS
  // -------------------------------------------------------------------------
  visits = {
    list: async () => {
      const res = await fetch(`${BASE_API_URL}/api/v2/visits`, {
        headers: this.getHeaders(),
      });
      return res.json();
    },
    schedule: async (data: {
      propertyId: string;
      visitorName: string;
      visitorPhone: string;
      visitDate: string;
      visitTime: string;
      visitType?: string;
      notes?: string;
    }) => {
      const res = await fetch(`${BASE_API_URL}/api/v2/visits`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      return res.json();
    },
  };

  // -------------------------------------------------------------------------
  // RENTAL AGREEMENTS
  // -------------------------------------------------------------------------
  agreements = {
    list: async () => {
      const res = await fetch(`${BASE_API_URL}/api/v2/rental-agreements`, {
        headers: this.getHeaders(),
      });
      return res.json();
    },
    create: async (data: any) => {
      const res = await fetch(`${BASE_API_URL}/api/v2/rental-agreements`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      return res.json();
    },
  };

  // -------------------------------------------------------------------------
  // PROPERTY MANAGEMENT & RENTAL MANAGEMENT
  // -------------------------------------------------------------------------
  propertyManagement = {
    getMyRequests: async () => {
      const res = await fetch(`${BASE_API_URL}/api/v2/property-management/my`, {
        headers: this.getHeaders(),
      });
      return res.json();
    },
    getById: async (id: string) => {
      const res = await fetch(`${BASE_API_URL}/api/v2/property-management/${id}`, {
        headers: this.getHeaders(),
      });
      return res.json();
    },
    create: async (data: {
      propertyId: string;
      ownerContactPhone: string;
      servicesRequested?: string[];
      monthlyRentTarget?: number;
      availableFromDate?: string;
      ownerNotes?: string;
    }) => {
      const res = await fetch(`${BASE_API_URL}/api/v2/property-management`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      return res.json();
    },
    cancel: async (id: string, reason?: string) => {
      const res = await fetch(`${BASE_API_URL}/api/v2/property-management/${id}/cancel`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ reason }),
      });
      return res.json();
    },
  };

  adminPropertyManagement = {
    getStats: async () => {
      const res = await fetch(`${BASE_API_URL}/api/v2/admin/property-management/stats`, {
        headers: this.getHeaders(),
      });
      return res.json();
    },
    getAll: async (status?: string, page = 0, size = 20) => {
      const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
      if (status && status !== "ALL") params.append("status", status);
      const res = await fetch(
        `${BASE_API_URL}/api/v2/admin/property-management?${params.toString()}`,
        {
          headers: this.getHeaders(),
        },
      );
      return res.json();
    },
    getById: async (id: string) => {
      const res = await fetch(`${BASE_API_URL}/api/v2/admin/property-management/${id}`, {
        headers: this.getHeaders(),
      });
      return res.json();
    },
    updateStatus: async (
      id: string,
      data: {
        status: string;
        assignedManagerName?: string;
        assignedManagerContact?: string;
        managementFeePercent?: number;
        rejectionReason?: string;
      },
    ) => {
      const res = await fetch(`${BASE_API_URL}/api/v2/admin/property-management/${id}/status`, {
        method: "PATCH",
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });
      return res.json();
    },
    getInternalNotes: async (id: string) => {
      const res = await fetch(`${BASE_API_URL}/api/v2/admin/property-management/${id}/notes`, {
        headers: this.getHeaders(),
      });
      return res.json();
    },
    addInternalNote: async (id: string, note: string) => {
      const res = await fetch(`${BASE_API_URL}/api/v2/admin/property-management/${id}/notes`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ note }),
      });
      return res.json();
    },
  };

  // -------------------------------------------------------------------------
  // S3 MEDIA & STORAGE
  // -------------------------------------------------------------------------
  storage = {
    getPresignedUploadUrl: async (params: {
      folder: string;
      fileName: string;
      contentType: string;
      fileSizeBytes: number;
      entityId?: string;
    }) => {
      const res = await fetch(`${BASE_API_URL}/api/v2/media/presign-upload`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(params),
      });
      return res.json();
    },
    getPresignedDownloadUrl: async (objectKey: string) => {
      const res = await fetch(`${BASE_API_URL}/api/v2/media/presign-download`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({ objectKey }),
      });
      return res.json();
    },
    uploadDirectToS3: async (uploadUrl: string, file: File | Blob, contentType: string) => {
      const res = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": contentType,
        },
        body: file,
      });
      return res.ok;
    },
  };
}

export const nativeApi = new NativeApiClient();
export const apiClient = nativeApi;
