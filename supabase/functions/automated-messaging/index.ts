import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const TWILIO_API_KEY = Deno.env.get("TWILIO_API_KEY");

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    console.log("Received webhook payload:", JSON.stringify(payload, null, 2));

    const { type, table, record } = payload;

    // 1. Welcome Message (Triggered when a new user signs up)
    if (table === "users" && type === "INSERT") {
      const email = record.email;
      console.log(`[ACTION] Sending Welcome Email to: ${email}`);

      if (RESEND_API_KEY) {
        // Send actual email via Resend
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "SEEDHA Properties <hello@seedhaproperties.com>",
            to: email,
            subject: "Welcome to SEEDHA Properties!",
            html: "<p>We're thrilled to have you. Reply to this email if you need an agent to assist you today!</p>",
          }),
        });
      } else {
        console.log(`[MOCK] Resend API key missing. Mocking Welcome Email to ${email}`);
      }
    }

    // 2. Security Alert (Triggered when a new login/visit is logged)
    if (table === "site_visitors" && type === "INSERT" && record.user_id) {
      console.log(`[ACTION] Sending Security Alert for user_id: ${record.user_id}`);

      // In a real scenario, you'd fetch the user's email from the auth.users table using Supabase Admin SDK
      // For this edge function, we will just mock the alert logic

      if (RESEND_API_KEY) {
        console.log(`[ACTION] Ready to send security email, but need email lookup implementation.`);
      } else {
        console.log(
          `[MOCK] Resend API key missing. Mocking Security Alert for user_id ${record.user_id}`,
        );
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
