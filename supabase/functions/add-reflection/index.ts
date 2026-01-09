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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get the composited image from form data
    const formData = await req.formData();
    const imageFile = formData.get("image_file");

    if (!imageFile || !(imageFile instanceof File)) {
      throw new Error("No image file provided");
    }

    console.log("Adding reflection to composited image:", imageFile.name, "size:", imageFile.size);

    // Convert image to base64
    const imageBuffer = await imageFile.arrayBuffer();
    const imageBase64 = btoa(
      new Uint8Array(imageBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ""
      )
    );

    // Call Gemini via Lovable AI Gateway for reflection
    const geminiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [{
          role: "user",
          content: [
            {
              type: "text",
              text: "This is a professional car dealership photo. Add a subtle mirror-like reflection of the vehicle on the polished showroom floor beneath it. Keep all other elements unchanged - maintain the exact same car, background, and lighting. Only add the floor reflection effect."
            },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
            }
          ]
        }],
        modalities: ["image", "text"]
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
    // The response format includes images in choices[0].message.images array
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
    console.log("Successfully added reflection to image");

    return new Response(
      JSON.stringify({ image: base64Only }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in add-reflection function:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
