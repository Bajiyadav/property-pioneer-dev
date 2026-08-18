import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export interface ChatMessage {
  id: string;
  inquiry_id?: string | null;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

/**
 * Fetches message history between two users or for a specific inquiry.
 */
export async function fetchConversationMessages(
  otherUserId: string,
  inquiryId?: string,
): Promise<ChatMessage[]> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return [];

    let query = supabase.from("messages").select("*").order("created_at", { ascending: true });

    if (inquiryId) {
      query = query.eq("inquiry_id", inquiryId);
    } else {
      query = query.or(
        `and(sender_id.eq.${user.user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.user.id})`,
      );
    }

    const { data, error } = await query;
    if (error) {
      console.warn("[chatService] fetch error:", error.message);
      return [];
    }
    return (data as unknown as ChatMessage[]) || [];
  } catch (err) {
    console.error("[chatService] fetch failed:", err);
    return [];
  }
}

/**
 * Sends a real-time chat message to the receiver.
 */
export async function sendChatMessage(
  receiverId: string,
  content: string,
  inquiryId?: string,
): Promise<ChatMessage | null> {
  const trimmed = content.trim();
  if (!trimmed) return null;

  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("Unauthenticated user cannot send message");

    const payload: Database["public"]["Tables"]["messages"]["Insert"] = {
      sender_id: user.user.id,
      receiver_id: receiverId,
      content: trimmed,
      inquiry_id: inquiryId || null,
      is_read: false,
    };

    const { data, error } = await supabase.from("messages").insert(payload).select().single();

    if (error) throw error;
    return data as ChatMessage;
  } catch (err) {
    console.error("[chatService] send message failed:", err);
    return null;
  }
}

/**
 * Marks messages as read for the current recipient.
 */
export async function markConversationAsRead(senderId: string): Promise<void> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("receiver_id", user.user.id)
      .eq("sender_id", senderId)
      .eq("is_read", false);
  } catch (err) {
    console.warn("[chatService] mark as read error:", err);
  }
}

/**
 * Retrieves the total count of unread messages for the logged-in user.
 */
export async function getUnreadMessagesCount(): Promise<number> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return 0;

    const { count, error } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("receiver_id", user.user.id)
      .eq("is_read", false);

    if (error) return 0;
    return count || 0;
  } catch {
    return 0;
  }
}

/**
 * Subscribes to real-time incoming messages via Supabase Realtime channel.
 */
export function subscribeToRealtimeMessages(
  onNewMessage: (msg: ChatMessage) => void,
  onMessageUpdate?: (msg: ChatMessage) => void,
) {
  const channel = supabase
    .channel("public:messages")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
      if (payload.new) {
        onNewMessage(payload.new as unknown as ChatMessage);
      }
    })
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, (payload) => {
      if (payload.new && onMessageUpdate) {
        onMessageUpdate(payload.new as unknown as ChatMessage);
      }
    })
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
