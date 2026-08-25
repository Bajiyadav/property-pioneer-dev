import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";

export type BookingStatus = "Scheduled" | "Confirmed" | "Completed" | "Cancelled";

export interface Booking {
  id: string;
  propertyId: string;
  propertyTitle: string;
  tenantId: string;
  ownerId: string;
  when: string; // ISO date or descriptive string
  mode: "In-person walkthrough" | "Live video tour";
  status: BookingStatus;
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
}

export interface Chat {
  id: string;
  propertyId: string;
  propertyTitle: string;
  tenantId: string;
  ownerId: string;
  messages: Message[];
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  detail: string;
  tone: "info" | "success" | "warning" | "neutral" | "rose";
  createdAt: string;
}

interface InteractionState {
  bookings: Booking[];
  chats: Chat[];
  notifications: Notification[];

  // Actions
  bookVisit: (data: Omit<Booking, "id" | "status" | "createdAt">) => void;
  updateBookingStatus: (id: string, status: BookingStatus) => void;

  sendMessage: (
    propertyId: string,
    propertyTitle: string,
    tenantId: string,
    ownerId: string,
    senderId: string,
    text: string,
  ) => void;

  addNotification: (data: Omit<Notification, "id" | "createdAt">) => void;

  // Selectors
  getTenantBookings: (tenantId: string) => Booking[];
  getOwnerBookings: (ownerId: string) => Booking[];
  getTenantChats: (tenantId: string) => Chat[];
  getOwnerChats: (ownerId: string) => Chat[];
  getUserNotifications: (userId: string) => Notification[];
}

export const useInteractionStore = create<InteractionState>()(
  persist(
    (set, get) => ({
      bookings: [],
      chats: [],
      notifications: [],

      bookVisit: (data) => {
        const newBooking: Booking = {
          ...data,
          id: uuidv4(),
          status: "Scheduled",
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          bookings: [newBooking, ...state.bookings],
        }));

        // Notify owner
        get().addNotification({
          userId: data.ownerId,
          title: "New Visit Scheduled",
          detail: `A tenant scheduled a ${data.mode.toLowerCase()} for ${data.propertyTitle}.`,
          tone: "info",
        });
      },

      updateBookingStatus: (id, status) => {
        set((state) => ({
          bookings: state.bookings.map((b) => (b.id === id ? { ...b, status } : b)),
        }));
      },

      sendMessage: (propertyId, propertyTitle, tenantId, ownerId, senderId, text) => {
        set((state) => {
          const chatIndex = state.chats.findIndex(
            (c) => c.propertyId === propertyId && c.tenantId === tenantId,
          );

          const newMessage: Message = {
            id: uuidv4(),
            senderId,
            text,
            createdAt: new Date().toISOString(),
          };

          if (chatIndex >= 0) {
            // Update existing chat
            const updatedChats = [...state.chats];
            updatedChats[chatIndex] = {
              ...updatedChats[chatIndex],
              messages: [...updatedChats[chatIndex].messages, newMessage],
              updatedAt: new Date().toISOString(),
            };
            return { chats: updatedChats };
          } else {
            // Create new chat
            const newChat: Chat = {
              id: uuidv4(),
              propertyId,
              propertyTitle,
              tenantId,
              ownerId,
              messages: [newMessage],
              updatedAt: new Date().toISOString(),
            };
            return { chats: [newChat, ...state.chats] };
          }
        });

        // Notify recipient
        const recipientId = senderId === tenantId ? ownerId : tenantId;
        get().addNotification({
          userId: recipientId,
          title: "New Message",
          detail: `You received a new message regarding ${propertyTitle}.`,
          tone: "info",
        });
      },

      addNotification: (data) => {
        set((state) => ({
          notifications: [
            {
              ...data,
              id: uuidv4(),
              createdAt: new Date().toISOString(),
            },
            ...state.notifications,
          ],
        }));
      },

      getTenantBookings: (tenantId) => get().bookings.filter((b) => b.tenantId === tenantId),
      getOwnerBookings: (ownerId) => get().bookings.filter((b) => b.ownerId === ownerId),
      getTenantChats: (tenantId) => get().chats.filter((c) => c.tenantId === tenantId),
      getOwnerChats: (ownerId) => get().chats.filter((c) => c.ownerId === ownerId),
      getUserNotifications: (userId) => get().notifications.filter((n) => n.userId === userId),
    }),
    {
      name: "urban-properties-interactions",
    },
  ),
);
