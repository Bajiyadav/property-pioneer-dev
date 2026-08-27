import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WebhookPayload {
  user: {
    id: string;
    email?: string;
    phone?: string;
  };
  email_data?: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
    token_new: string;
    token_hash_new: string;
  };
  sms_data?: {
    token: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Validate Secret Header (Security)
    const webhookSecret = Deno.env.get("AUTH_HOOK_SECRET");
    if (webhookSecret && req.headers.get("x-auth-hook-secret") !== webhookSecret) {
      return new Response("Unauthorized", { status: 401 });
    }

    const payload: WebhookPayload = await req.json();

    // 2. Handle Email Delivery (Resend)
    if (payload.email_data && payload.user.email) {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (!resendApiKey) throw new Error("RESEND_API_KEY is not set");

      const email = payload.user.email;
      const token = payload.email_data.token;

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "SEEDHA <noreply@seedha.app>", // Replace with your verified sender
          to: [email],
          subject: "Your SEEDHA Login Code",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Welcome to SEEDHA</h2>
              <p>Your login code is:</p>
              <h1 style="font-size: 32px; letter-spacing: 4px; color: #2563EB;">${token}</h1>
              <p>This code will expire in 15 minutes.</p>
            </div>
          `,
        }),
      });

      if (!res.ok) {
        const error = await res.text();
        console.error("Resend API error:", error);
        throw new Error(`Failed to send email: ${error}`);
      }
    }

    // 3. Handle SMS Delivery (Twilio)
    if (payload.sms_data && payload.user.phone) {
      const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
      const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
      const twilioSender = Deno.env.get("TWILIO_SENDER_NUMBER");

      if (!twilioAccountSid || !twilioAuthToken || !twilioSender) {
        throw new Error("Twilio credentials are not set");
      }

      const phone = payload.user.phone;
      const token = payload.sms_data.token;

      // Twilio API requires URL encoded form data
      const formData = new URLSearchParams();
      formData.append("To", phone);
      formData.append("From", twilioSender);
      formData.append("Body", `Your SEEDHA login code is: ${token}`);

      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
          },
          body: formData.toString(),
        },
      );

      if (!res.ok) {
        const error = await res.text();
        console.error("Twilio API error:", error);
        throw new Error(`Failed to send SMS: ${error}`);
      }
    }

    // Must return 200 OK for Supabase Auth to proceed
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Edge function error:", error);
    // Returning 500 will abort the sign-in process
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
