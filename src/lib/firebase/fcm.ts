import { getMessaging, getToken } from "firebase/messaging";
import { app } from "./config";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export async function requestNotificationPermission(userId: string) {
  try {
    const messaging = getMessaging(app);

    // Request permission first
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      // NOTE: You must provide your VAPID key here
      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

      const currentToken = await getToken(messaging, { vapidKey });

      if (currentToken) {
        // Save the token to Supabase
        const { error } = await supabase.from("user_devices").upsert(
          {
            user_id: userId,
            device_token: currentToken,
            device_type: "web",
          },
          { onConflict: "user_id,device_token" },
        );

        if (error) {
          console.error("Failed to save device token", error);
        }
        return currentToken;
      } else {
        console.warn("No registration token available. Request permission to generate one.");
        return null;
      }
    } else {
      toast.info("Notifications disabled. You won't receive instant alerts.");
      return null;
    }
  } catch (err) {
    console.error("An error occurred while retrieving token. ", err);
    return null;
  }
}
