import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Remove.bg API (switched from PhotoRoom - keep PhotoRoom code commented for rollback)
    const REMOVEBG_API_KEY = Deno.env.get("REMOVEBG_API_KEY");
    // const PHOTOROOM_API_KEY = Deno.env.get("PHOTOROOM_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!REMOVEBG_API_KEY) {
      throw new Error("REMOVEBG_API_KEY is not configured");
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    // Create Supabase admin client for storage uploads
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get the image file and metadata from form data
    const formData = await req.formData();
    const imageFile = formData.get("image_file");
    const carId = formData.get("car_id") as string | null;
    const photoId = formData.get("photo_id") as string | null;

    if (!imageFile || !(imageFile instanceof File)) {
      throw new Error("No image file provided");
    }

    console.log("Calling Remove.bg API for file:", imageFile.name, "size:", imageFile.size);

    // Call Remove.bg API to remove background
    const segmentFormData = new FormData();
    segmentFormData.append("image_file", imageFile);
    segmentFormData.append("size", "full"); // Full quality up to 25MP

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": REMOVEBG_API_KEY,
      },
      body: segmentFormData,
    });

    /* PhotoRoom API (commented for rollback)
    const segmentFormData = new FormData();
    segmentFormData.append("image_file", imageFile);

    const response = await fetch("https://sdk.photoroom.com/v1/segment", {
      method: "POST",
      headers: {
        "Accept": "image/png",
        "x-api-key": PHOTOROOM_API_KEY,
      },
      body: segmentFormData,
    });
    */

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Remove.bg API error:", response.status, errorText);
      throw new Error(`Remove.bg API error: ${response.status} - ${errorText}`);
    }

    // Check if response is actually an image
    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("image/")) {
      const text = await response.text();
      console.error("Remove.bg returned non-image content:", text);
      throw new Error("Remove.bg did not return an image");
    }

    // Get the image as a blob (NO base64 conversion - saves memory!)
    const imageBlob = await response.blob();
    console.log("Remove.bg returned image, size:", imageBlob.size, "bytes");

    // Upload directly to Supabase Storage
    const timestamp = Date.now();
    const fileName = carId && photoId 
      ? `${carId}/transparent-${photoId}.png`
      : `temp/transparent-${timestamp}-${Math.random().toString(36).substring(7)}.png`;

    console.log("Uploading transparent PNG to Storage:", fileName);

    const { error: uploadError } = await supabaseAdmin.storage
      .from("car-photos")
      .upload(fileName, imageBlob, { 
        upsert: true,
        contentType: "image/png"
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from("car-photos")
      .getPublicUrl(fileName);

    console.log("Successfully uploaded transparent PNG, URL:", publicUrl);

    return new Response(
      JSON.stringify({ 
        url: publicUrl,
        path: fileName 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in segment-car function:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
