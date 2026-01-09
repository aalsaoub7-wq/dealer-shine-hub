import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const PHOTOROOM_API_KEY = Deno.env.get("PHOTOROOM_API_KEY");
    if (!PHOTOROOM_API_KEY) {
      throw new Error("PHOTOROOM_API_KEY is not configured");
    }

    // Get the image file from form data
    const formData = await req.formData();
    const imageFile = formData.get("image_file");

    if (!imageFile || !(imageFile instanceof File)) {
      throw new Error("No image file provided");
    }

    console.log("Calling PhotoRoom Segment API for file:", imageFile.name, "size:", imageFile.size);

    // Call PhotoRoom Segment API to remove background
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error("PhotoRoom Segment API error:", response.status, errorText);
      throw new Error(`PhotoRoom API error: ${response.status} - ${errorText}`);
    }

    // Check if response is actually an image
    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("image/")) {
      const text = await response.text();
      console.error("PhotoRoom returned non-image content:", text);
      throw new Error("PhotoRoom did not return an image");
    }

    // Convert response to base64
    const imageBuffer = await response.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(imageBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ""
      )
    );

    console.log("Successfully segmented image, returning base64 PNG");

    return new Response(
      JSON.stringify({ image: base64 }),
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
