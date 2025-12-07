import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Template configurations with specific prompts and seeds
const TEMPLATE_CONFIGS: Record<string, { prompt: string; seed: string }> = {
  showroom: {
    prompt: `Peugeot 3008 SUV centered in frame on a perfectly flat, completely uniform matte floor in exact solid grey color #55575a, with no tiles, no seams, no lines, no texture, no patterns, no noise, no gradient and no reflections at all, the floor is a single continuous grey plane that meets a perfectly straight horizontal white skirting board, above it a completely plain matte white showroom wall with no doors, no windows, no corners, no objects and no shadows on the wall, camera straight-on at car height, neutral white studio lighting from the front, a single very soft short shadow directly under and just slightly behind the car, and absolutely no other shadows, lights, color shifts, vignetting or background details anywhere in the image.`,
    seed: "317869369",
  },
  "luxury-showroom": {
    prompt: `A single car centered in frame inside a closed luxury car photo studio. The car stands on a perfectly flat, glossy dark grey floor in exact color #2b2d30, with a single uniform mirror-like reflection of the car directly under it, fading smoothly to 0 within one car length, no tiles, no seams, no lines, no texture, no patterns and no other reflections anywhere on the floor. Around the car is a perfectly circular, slightly brighter glossy platform in exact color #3a3c40, with a clean sharp edge, perfectly centered under the car. The walls are a continuous seamless matte very dark charcoal in exact color #14151a, with no corners, no doors, no windows, no objects, no logos, no panels and no visible texture, only a very subtle vertical brightness gradient from #14151a at the edges to #191b20 behind the car. Lighting is from three invisible softboxes: one large soft light directly in front of the car and two smaller symmetric lights at 45 degrees, creating extremely soft, controlled highlights on the car and a single very soft shadow just behind and slightly to the sides of the tyres. There are no other shadows, no color casts, no vignetting and no additional light sources anywhere in the scene.`,
    seed: "117879368",
  },
  "soft-grey-gradient": {
    prompt: `A car centered in frame on a perfectly flat matte floor in exact solid neutral grey color #80838a, with no tiles, no seams, no lines, no patterns, no texture, no noise and no reflections, the floor is a single continuous plane that meets a perfectly straight horizontal line where a smooth vertical gradient wall begins, the wall fades from slightly darker grey #30333a at the top to slightly lighter grey #3c4047 behind the car, with no corners, no doors, no windows, no panels, no logos, no text and no objects of any kind, camera straight-on at car height, neutral white studio lighting from the front and slightly above, one very soft short shadow directly under and slightly behind the car, and absolutely no other shadows, hotspots, banding, color shifts or details in the background.`,
    seed: "428193756",
  },
  "white-infinity-cove": {
    prompt: `A car centered in frame on a perfectly flat matte floor in uniform solid off-white color #f2f3f5, with no tiles, no seams, no lines, no texture, no patterns and no reflections, the floor curves smoothly upward into a continuous matte white infinity wall so there is no visible corner or edge, the entire background is one seamless white cyclorama with no doors, no windows, no panels, no objects, no gradient bands and no shadows on the wall, camera straight-on at car height, neutral white studio lighting from the front and slightly above, one very soft short shadow under and just behind the tyres, and absolutely no other shadows, color variations, vignetting or background elements.`,
    seed: "539284167",
  },
  "two-tone-horizon": {
    prompt: `A car centered in frame on a perfectly flat matte floor in exact solid mid-grey color #b0b3ba, with no tiles, no seams, no lines, no texture, no patterns, no noise and no reflections, the floor occupies the lower 40 percent of the image and the upper 60 percent is a completely plain matte light grey wall in exact solid color #e3e5ea, separated by one perfectly straight, sharp horizontal line across the image, the wall has no doors, no windows, no panels, no corners, no logos, no text and no objects, camera straight-on at car height, neutral white studio lighting from the front, one very soft short shadow under and slightly behind the car on the floor, and absolutely no other shadows, gradients, light spots or details on either the floor or the wall.`,
    seed: "641375289",
  },
  "light-showroom": {
    prompt: `A car centered in frame on a perfectly flat matte floor in exact solid warm grey color #c7c2bb, with no tiles, no seams, no lines, no patterns, no texture, no noise and no reflections, the floor is a continuous plane meeting a straight horizontal white skirting board, above it a completely plain matte off-white showroom wall in solid color #f5f6f7, with no doors, no windows, no glass, no columns, no ventilation, no lamps and no objects at all, camera straight-on at car height, neutral white studio lighting slightly above eye level, a single soft short shadow under and slightly behind the car, and absolutely no other shadows, reflections, bright spots, vignetting or extra geometry in the background.`,
    seed: "752486391",
  },
  "dark-wall-light-floor": {
    prompt: `A car centered in frame on a perfectly flat, uniform matte floor in solid light grey color #d0d2d7, with no tiles, seams, lines, patterns, texture, noise, gradients or reflections, the floor is a single plane that meets a perfectly straight horizontal line where a matte dark background wall in solid color #20222a starts, the wall is completely featureless with no doors, no windows, no panels, no frames, no objects and no visible corners, camera straight-on at car height, neutral white studio lighting from the front, one very soft short shadow under and slightly behind the tyres, and absolutely no other lights, backlights, rim lights, color shifts or background details in the scene.`,
    seed: "863597412",
  },
  "very-light-studio": {
    prompt: `A car centered in frame on a perfectly flat matte floor in solid very light grey color #eceff2, with no tiles, no grooves, no lines, no patterns, no texture, no noise, no reflections and no gradients, the floor is a continuous flat plane meeting a matte near-white wall in solid color #f9fafb at a perfectly straight horizontal edge, the wall is completely plain with no doors, no windows, no decorations, no signs, no objects and no shadows, camera straight-on at car height, neutral white softbox lighting from the front filling the whole frame evenly, a single very soft and faint short shadow under the car, and absolutely no other shadows, bright spots, color bands or details in the background.`,
    seed: "974618523",
  },
  "darker-lower-wall": {
    prompt: `A car centered in frame on a perfectly flat matte floor in uniform solid neutral grey color #a8abb3, with no tiles, seams, lines, texture, patterns, noise, gradients or reflections, the floor meets a matte white wall where the lower 15 percent of the wall is a slightly darker white band in solid color #e1e3e6 like a clean protective strip, and the upper part of the wall is pure matte white, the wall has no doors, no windows, no panels, no objects, no outlets and no shadows, camera straight-on at car height, neutral white studio lighting from the front, one very soft short shadow under and just behind the tyres, and absolutely no other shadows, color variations, markings or background elements.`,
    seed: "185729634",
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
          .select("background_prompt, background_template_id, custom_background_seed")
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
          
          // Store custom seed if available (for custom prompts)
          if (aiSettings.custom_background_seed) {
            console.log(`Custom background seed: ${aiSettings.custom_background_seed}`);
            // Store in a variable to use later
            (globalThis as any).__customBackgroundSeed = aiSettings.custom_background_seed;
          }
        }
      }
    }

    console.log(`Prompt source: ${promptSource}`);

    const formData = await req.formData();
    const imageFile = formData.get("image_file");
    const overrideSeed = formData.get("override_seed");

    if (!imageFile || !(imageFile instanceof File)) {
      throw new Error("No image file provided");
    }

    if (overrideSeed) {
      console.log(`Override seed provided: ${overrideSeed}`);
    }

    console.log("Processing image with PhotoRoom API:", imageFile.name);

    // Create FormData for PhotoRoom API
    const photoroomFormData = new FormData();
    photoroomFormData.append("imageFile", imageFile);
    photoroomFormData.append("outputSize", "3840x2880");
    photoroomFormData.append("padding", "0.10");
    photoroomFormData.append("horizontalAlignment", "center");
    photoroomFormData.append("verticalAlignment", "center");

    // Get template-specific config or use custom seed for custom prompts
    let promptToUse: string;
    let seedToUse: string;

    if (backgroundTemplateId && TEMPLATE_CONFIGS[backgroundTemplateId]) {
      // Use template config
      const templateConfig = TEMPLATE_CONFIGS[backgroundTemplateId];
      promptToUse = templateConfig.prompt;
      // Use override seed if provided (for regeneration), otherwise use template seed
      seedToUse = overrideSeed ? String(overrideSeed) : templateConfig.seed;
      console.log(`Using template: ${backgroundTemplateId}`);
    } else {
      // Custom prompt - use stored custom seed or default
      const customSeed = (globalThis as any).__customBackgroundSeed;
      promptToUse = backgroundPrompt;
      // Use override seed if provided (for regeneration), otherwise use custom/default seed
      seedToUse = overrideSeed ? String(overrideSeed) : (customSeed || DEFAULT_CONFIG.seed);
      console.log(`Using custom prompt with seed: ${seedToUse}`);
      // Clean up global variable
      delete (globalThis as any).__customBackgroundSeed;
    }

    console.log(`Seed: ${seedToUse}`);

    photoroomFormData.append("background.prompt", promptToUse);
    photoroomFormData.append("background.expandPrompt.mode", "ai.never");
    photoroomFormData.append("background.seed", seedToUse);

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
