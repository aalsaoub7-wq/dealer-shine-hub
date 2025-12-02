import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Template configurations with specific prompts and seeds
const TEMPLATE_CONFIGS: Record<string, { prompt: string; seed: string }> = {
  showroom: {
    prompt: `A single car centered in frame. The background must be only a plain, empty wall and floor.

Floor:
– one single infinite surface under the car
– perfectly matte, uniform solid grey color #c8cfdb
– draw the floor as a smooth continuous plane with no repeating elements
– do not draw any tiles, seams, gaps, joints, cracks, squares, rectangles, grids, patterns or lines on the floor
– do not draw any perspective lines on the floor
– do not draw any change of color or brightness in different parts of the floor
– no texture, no noise, no speckles, no reflections, no highlights, no gradient on the floor
– every pixel of the floor must have the same grey color #c8cfdb

Wall: – perfectly flat, perfectly matte, uniform solid pure white – the wall is one single flat plane – no doors, no windows, no openings, no panels, no columns, no corners, no edges, no switches, no sockets, no lamps, no signs, no text, no logos, no objects at all – absolutely nothing on the wall except solid white color

The line where floor and wall meet is a single perfectly straight horizontal line. No other lines or shapes in the background.

Lighting: – neutral white studio lighting from the front – one very soft, short shadow directly under and slightly behind the tyres – no other shadows, no light spots on the wall, no gradients on the wall or floor, no colored light, no vignetting

The entire background must look like a completely empty, featureless white wall and a completely smooth, featureless grey floor, with zero additional details.`,
    seed: "583913403",
  },
  "luxury-studio": {
    prompt: `A single car centered in frame on a perfectly flat matte floor in solid grey color #c8cfdb, no tiles, no seams, no lines, no patterns, no objects, plain matte white wall in the background, no doors, no windows, neutral white studio lighting, one soft short shadow under and slightly behind the tyres, no other shadows or objects.`,
    seed: "102821603",
  },
};

// Default config if no template selected
const DEFAULT_CONFIG = {
  prompt: `A single car centered in frame on a perfectly flat matte floor in solid grey color #c8cfdb, no tiles, no seams, no lines, no patterns, no objects, plain matte white wall in the background, no doors, no windows, neutral white studio lighting, one soft short shadow under and slightly behind the tyres, no other shadows or objects.`,
  seed: "542492587",
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

    // Get user's AI settings for background prompt
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

    let backgroundPrompt =
      "car on clean ceramic floor with the colour #c8cfdb, with plain white walls in the background, evenly lit";
    let backgroundTemplateId: string | null = null;
    let promptSource = "default";

    if (user) {
      // Get user's company to fetch company-wide AI settings
      const { data: userCompany } = await supabase
        .from("user_companies")
        .select("company_id")
        .eq("user_id", user.id)
        .single();

      if (userCompany) {
        console.log(`Fetching AI settings for company: ${userCompany.company_id}`);

        const { data: aiSettings } = await supabase
          .from("ai_settings")
          .select("background_prompt, background_template_id")
          .eq("company_id", userCompany.company_id)
          .single();

        if (aiSettings?.background_prompt) {
          backgroundPrompt = aiSettings.background_prompt;
          backgroundTemplateId = aiSettings.background_template_id;
          promptSource = "company_settings";

          // Log prompt identification for debugging
          const promptPreview = backgroundPrompt.substring(0, 100);
          console.log(`Using background prompt from company settings`);
          console.log(`Prompt preview: "${promptPreview}..."`);
          console.log(`Template ID: ${backgroundTemplateId || "custom/none"}`);
        }
      }
    }

    console.log(`Prompt source: ${promptSource}`);

    const formData = await req.formData();
    const imageFile = formData.get("image_file");

    if (!imageFile || !(imageFile instanceof File)) {
      throw new Error("No image file provided");
    }

    console.log("Processing image with PhotoRoom API:", imageFile.name);

    // Create FormData for PhotoRoom API
    const photoroomFormData = new FormData();
    photoroomFormData.append("imageFile", imageFile);
    photoroomFormData.append("outputSize", "3840x2880");
    photoroomFormData.append("padding", "0.10");
    photoroomFormData.append("horizontalAlignment", "center");
    photoroomFormData.append("verticalAlignment", "center");

    // Get template-specific config or use default
    const templateConfig =
      backgroundTemplateId && TEMPLATE_CONFIGS[backgroundTemplateId]
        ? TEMPLATE_CONFIGS[backgroundTemplateId]
        : DEFAULT_CONFIG;

    console.log(`Using template: ${backgroundTemplateId || "default"}`);
    console.log(`Seed: ${templateConfig.seed}`);

    photoroomFormData.append("background.prompt", templateConfig.prompt);
    photoroomFormData.append("background.expandPrompt.mode", "ai.never");
    photoroomFormData.append("background.seed", templateConfig.seed);

    // Call PhotoRoom API
    const response = await fetch("https://image-api.photoroom.com/v2/edit", {
      method: "POST",
      headers: {
        Accept: "image/png, application/json",
        "x-api-key": PHOTOROOM_API_KEY,
        "pr-ai-background-model-version": "background-studio-beta-2025-03-17",
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
