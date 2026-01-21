import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PHOTOROOM_API_KEY = Deno.env.get("PHOTOROOM_API_KEY");
    if (!PHOTOROOM_API_KEY) {
      throw new Error("PHOTOROOM_API_KEY not configured");
    }

    // Get auth header for user validation
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader ?? "" },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    const formData = await req.formData();
    const imageFile = formData.get("image_file");
    const backgroundImageFile = formData.get("background_file");

    if (!imageFile || !(imageFile instanceof File)) {
      throw new Error("No image file provided");
    }

    if (!backgroundImageFile || !(backgroundImageFile instanceof File)) {
      throw new Error("No background file provided");
    }

    console.log("Processing image with PhotoRoom API:", imageFile.name);
    console.log("Using background image:", backgroundImageFile.name, "size:", backgroundImageFile.size);

    const photoroomFormData = new FormData();
    photoroomFormData.append("imageFile", imageFile);
    photoroomFormData.append("background.imageFile", backgroundImageFile);
    photoroomFormData.append("background.scaling", "fill");
    photoroomFormData.append("shadow.mode", "ai.hard");
    photoroomFormData.append("outputSize", "3840x2560");
    photoroomFormData.append("paddingLeft", "0.10");
    photoroomFormData.append("paddingRight", "0.10");
    photoroomFormData.append("paddingTop", "0.15");
    photoroomFormData.append("paddingBottom", "0.05");
    photoroomFormData.append("horizontalAlignment", "center");
    photoroomFormData.append("verticalAlignment", "center");

    // Call PhotoRoom API
    const response = await fetch("https://image-api.photoroom.com/v2/edit", {
      method: "POST",
      headers: {
        Accept: "image/png, application/json",
        "x-api-key": PHOTOROOM_API_KEY,
      },
      body: photoroomFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("PhotoRoom API error:", response.status, errorText);
      throw new Error(`PhotoRoom API error: ${response.status} - ${errorText}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      const errorText = await response.text();
      console.error("PhotoRoom API unexpected content-type:", contentType, errorText);
      throw new Error(`PhotoRoom API returned non-image response: ${contentType} - ${errorText}`);
    }

    // Get the edited image as blob
    const editedImageBlob = await response.blob();
    console.log("Successfully edited image, size:", editedImageBlob.size);

    // Convert to base64 for JSON response (handle large files)
    const arrayBuffer = await editedImageBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Convert to base64 in chunks to avoid stack overflow
    let binary = "";
    const chunkSize = 8192;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    const base64 = btoa(binary);

    // Return the edited image as base64
    return new Response(JSON.stringify({ image: base64 }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    console.error("Error in edit-photo function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
