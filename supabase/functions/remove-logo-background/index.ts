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
    const REMOVEBG_API_KEY = Deno.env.get('REMOVEBG_API_KEY');
    if (!REMOVEBG_API_KEY) {
      throw new Error('REMOVEBG_API_KEY is not set');
    }

    const { imageUrl } = await req.json();
    if (!imageUrl) {
      throw new Error('imageUrl is required');
    }

    console.log('[REMOVE-BG] Starting background removal for logo:', imageUrl);

    // Fetch the image from the URL
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }
    const imageBlob = await imageResponse.blob();

    console.log('[REMOVE-BG] Image fetched, size:', imageBlob.size);

    // Create form data for Remove.bg API
    const formData = new FormData();
    formData.append('image_file', imageBlob, 'logo.png');
    formData.append('size', 'auto');

    // Call Remove.bg API to remove background
    const removebgResponse = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': REMOVEBG_API_KEY,
      },
      body: formData,
    });

    if (!removebgResponse.ok) {
      const errorText = await removebgResponse.text();
      console.error('[REMOVE-BG] Remove.bg API error:', errorText);
      throw new Error(`Remove.bg API error: ${removebgResponse.status} - ${errorText}`);
    }

    console.log('[REMOVE-BG] Background removed successfully');

    // Get the result as a blob
    const resultBlob = await removebgResponse.blob();
    const resultArrayBuffer = await resultBlob.arrayBuffer();
    const resultUint8Array = new Uint8Array(resultArrayBuffer);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate unique filename
    const fileName = `logos/logo-nobg-${Date.now()}.png`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('car-photos')
      .upload(fileName, resultUint8Array, {
        contentType: 'image/png',
        upsert: false,
      });

    if (uploadError) {
      console.error('[REMOVE-BG] Upload error:', uploadError);
      throw new Error(`Failed to upload result: ${uploadError.message}`);
    }

    console.log('[REMOVE-BG] Uploaded to storage:', uploadData.path);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('car-photos')
      .getPublicUrl(fileName);

    console.log('[REMOVE-BG] New logo URL:', urlData.publicUrl);

    return new Response(
      JSON.stringify({ newUrl: urlData.publicUrl }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('[REMOVE-BG] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
