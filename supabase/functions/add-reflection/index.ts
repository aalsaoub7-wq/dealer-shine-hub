import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    // Create Supabase admin client for storage uploads
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get the composited image and metadata from form data
    const formData = await req.formData();
    const imageFile = formData.get("image_file");
    const carId = formData.get("car_id") as string | null;
    const photoId = formData.get("photo_id") as string | null;

    if (!imageFile || !(imageFile instanceof File)) {
      throw new Error("No image file provided");
    }

    console.log("Adding reflection to composited image:", imageFile.name, "size:", imageFile.size);

    // Convert image to base64 for Gemini using Deno's proper base64 encoding
    const imageBuffer = await imageFile.arrayBuffer();

    // Use Deno's standard library for proper base64 encoding (handles large files correctly)
    const imageBase64 = base64Encode(imageBuffer);

    console.log("Calling Gemini for reflection, base64 length:", imageBase64.length);

    // Call Gemini via Lovable AI Gateway for reflection
    const geminiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "This is a high-resolution professional car dealership photo (2560x1707 pixels, 3:2 aspect ratio). Add a subtle soft and fading mirror-like reflection of the vehicle on the polished showroom floor beneath it. Keep all other elements unchanged - maintain the exact same car, background, lighting, and resolution. Only add the floor reflection effect. Output the image at the same 2K resolution.",
              },
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
              },
            ],
          },
        ],
        modalities: ["image", "text"],
        // Request 2K output resolution from Gemini
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
          imageGenerationConfig: {
            aspectRatio: "3:2",
            outputImageSize: "2048",
          },
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini API error:", geminiResponse.status, errorText);
      throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorText}`);
    }

    const data = await geminiResponse.json();
    console.log("Gemini response received, extracting image...");

    // Extract image from Gemini response
    const outputUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!outputUrl) {
      console.error("No image in Gemini response:", JSON.stringify(data).substring(0, 500));
      throw new Error("Gemini did not return an image");
    }

    // Extract base64 from data URL
    const base64Match = outputUrl.match(/^data:image\/\w+;base64,(.+)$/);
    if (!base64Match) {
      throw new Error("Invalid image format from Gemini");
    }

    const base64Only = base64Match[1];
    console.log("Gemini base64 length:", base64Only.length);

    // Convert base64 to Uint8Array for storage upload
    const binaryString = atob(base64Only);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const imageBlob = new Blob([bytes], { type: "image/png" });

    console.log("Converted to blob, size:", imageBlob.size, "bytes");

    // Upload directly to Supabase Storage
    const timestamp = Date.now();
    const fileName =
      carId && photoId
        ? `${carId}/edited-${photoId}-${timestamp}.png`
        : `temp/edited-${timestamp}-${Math.random().toString(36).substring(7)}.png`;

    console.log("Uploading edited image to Storage:", fileName);

    const { error: uploadError } = await supabaseAdmin.storage.from("car-photos").upload(fileName, imageBlob, {
      upsert: true,
      contentType: "image/png",
    });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from("car-photos").getPublicUrl(fileName);

    console.log("Successfully uploaded edited image, URL:", publicUrl);

    // Server-side "best effort" DB update - if photoId is present, update the photo row
    // This ensures the photo becomes "complete" even if the client disconnects/hangs
    if (photoId) {
      try {
        // First read current photo to preserve original_url if it exists
        const { data: currentPhoto } = await supabaseAdmin
          .from("photos")
          .select("url, original_url")
          .eq("id", photoId)
          .single();

        if (currentPhoto) {
          const updateData = {
            url: publicUrl,
            is_processing: false,
            is_edited: true,
            updated_at: new Date().toISOString(),
            // Preserve original_url if it exists, otherwise use the old URL
            original_url: currentPhoto.original_url || currentPhoto.url,
          };

          const { error: updateError } = await supabaseAdmin
            .from("photos")
            .update(updateData)
            .eq("id", photoId);

          if (updateError) {
            console.error("Server-side photo update failed (non-blocking):", updateError);
          } else {
            console.log("Server-side photo update succeeded for photoId:", photoId);
          }
        }
      } catch (dbError) {
        // Log but don't fail - this is "best effort"
        console.error("Server-side DB update error (non-blocking):", dbError);
      }
    }

    return new Response(
      JSON.stringify({
        url: publicUrl,
        path: fileName,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in add-reflection function:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
