import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

// For Firebase Admin SDK, Deno supports importing from npm: or esm.sh
// However, Firebase Admin SDK can be complex to run in Edge Functions.
// A simpler approach for FCM in Edge Functions is using the HTTP v1 API directly
// or via googleapis, but we will mock the structure for now since setup requires
// service account key JSON loading.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // This webhook will be triggered by an insert on the `notifications` table
    const body = await req.json();
    const notification = body.record;

    if (!notification || !notification.user_id) {
      return new Response(JSON.stringify({ error: "Invalid notification record" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // 1. Fetch user's FCM tokens
    const { data: devices, error: deviceError } = await supabaseClient
      .from("user_devices")
      .select("device_token")
      .eq("user_id", notification.user_id);

    if (deviceError || !devices || devices.length === 0) {
      return new Response(
        JSON.stringify({ message: "No devices found for user, but notification logged." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    const tokens = devices.map((d) => d.device_token);

    // 2. Here you would normally initialize Firebase Admin and send the message.
    // For example, if you have FIREBASE_SERVICE_ACCOUNT_KEY in Deno.env:
    /*
      const serviceAccount = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT_KEY')!);
      const app = initializeApp({
        credential: cert(serviceAccount)
      });
      const messaging = getMessaging(app);
      
      const message = {
        notification: {
          title: notification.title,
          body: notification.body || '',
        },
        tokens: tokens,
      };
      
      await messaging.sendMulticast(message);
    */

    console.log(`[Mock] Sending FCM to tokens: ${tokens.join(", ")}`);
    console.log(`[Mock] Payload: ${notification.title} - ${notification.body}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notification queued for ${tokens.length} devices`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
