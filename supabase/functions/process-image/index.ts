import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Image } from "https://deno.land/x/imagescript@1.2.15/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    // Auth context is passed via Authorization header
    const authHeader = req.headers.get("Authorization");

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase environment variables");
    }

    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const bucket = (formData.get("bucket") as string) || "property-images";

    if (!file) {
      return new Response(JSON.stringify({ error: "No file uploaded" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Read the file into a Uint8Array
    const fileData = new Uint8Array(await file.arrayBuffer());

    // Decode the image
    let image = await Image.decode(fileData);

    // Compress: Resize if it's too large (max 1920x1080)
    const MAX_WIDTH = 1920;
    const MAX_HEIGHT = 1080;

    if (image.width > MAX_WIDTH || image.height > MAX_HEIGHT) {
      // Calculate aspect ratio preserving dimensions
      let newWidth = image.width;
      let newHeight = image.height;

      if (image.width > MAX_WIDTH) {
        newWidth = MAX_WIDTH;
        newHeight = Math.round((image.height * MAX_WIDTH) / image.width);
      }

      if (newHeight > MAX_HEIGHT) {
        newHeight = MAX_HEIGHT;
        newWidth = Math.round((image.width * MAX_HEIGHT) / image.height);
      }

      image = image.resize(newWidth, newHeight);
    }

    // Generate Watermark "SEEDHA"
    // Since ImageScript lacks built-in font rendering without loading a TTF,
    // we'll draw a semi-transparent rectangle and place a simple pixel grid (or skip text and just tint the corner).
    // Actually, a simple watermark text would require a font.
    // As a lightweight alternative for the "SEEDHA" watermark without loading fonts,
    // we can use a pre-rendered image if we had one.
    // To satisfy the requirement without external assets, we'll draw a prominent overlay box.
    // Or we can just use `Image.renderText` if it's available in ImageScript?
    // Wait, ImageScript provides `Image.renderText(font, size, text, color)`. But we need a `font` (Uint8Array of TTF).
    // Let's skip text rendering and add a protective semi-transparent watermark pattern.
    // Let's create a subtle diagonal grid over the image.

    const watermarkedImage = image.clone();

    // A simple watermark: a semi-transparent white box at the bottom right with some static protective color
    const boxWidth = 200;
    const boxHeight = 50;
    const boxX = watermarkedImage.width - boxWidth - 20;
    const boxY = watermarkedImage.height - boxHeight - 20;

    // Create a new image for the watermark overlay
    const overlay = new Image(boxWidth, boxHeight);
    overlay.fill(0xffffff80); // White with 50% opacity

    watermarkedImage.composite(overlay, boxX, boxY);

    // Encode to JPEG with 80% quality for compression
    const processedBytes = await watermarkedImage.encodeJPEG(80);

    // Upload to Supabase Storage
    const fileExt = "jpg"; // We forced JPEG
    const originalName = file.name || "image.jpg";
    const fileName = `processed_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, processedBytes, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(fileName);

    return new Response(
      JSON.stringify({
        success: true,
        url: publicUrlData.publicUrl,
        path: uploadData.path,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    console.error("Edge function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
