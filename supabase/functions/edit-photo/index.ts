import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PHOTOROOM_API_KEY = Deno.env.get('PHOTOROOM_API_KEY');
    if (!PHOTOROOM_API_KEY) {
      throw new Error('PHOTOROOM_API_KEY not configured');
    }

    // Get user's AI settings for background prompt
    const authHeader = req.headers.get('Authorization');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader ?? '' },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();
    
    let backgroundPrompt = 'car on clean ceramic floor with the colour #c8cfdb, with plain white walls in the background, evenly lit';
    
    if (user) {
      // Get user's company to fetch company-wide AI settings
      const { data: userCompany } = await supabase
        .from('user_companies')
        .select('company_id')
        .eq('user_id', user.id)
        .single();
      
      if (userCompany) {
        const { data: aiSettings } = await supabase
          .from('ai_settings')
          .select('background_prompt')
          .eq('company_id', userCompany.company_id)
          .single();
        
        if (aiSettings?.background_prompt) {
          backgroundPrompt = aiSettings.background_prompt;
          console.log('Using custom background prompt from company settings');
        }
      }
    }

    const formData = await req.formData();
    const imageFile = formData.get('image_file');

    if (!imageFile || !(imageFile instanceof File)) {
      throw new Error('No image file provided');
    }

    console.log('Processing image with PhotoRoom API:', imageFile.name);

    // Create FormData for PhotoRoom API
    const photoroomFormData = new FormData();
    photoroomFormData.append('imageFile', imageFile);
    photoroomFormData.append('outputSize', '3840x2880');
    photoroomFormData.append('padding', '0.10');
    photoroomFormData.append('horizontalAlignment', 'center');
    photoroomFormData.append('verticalAlignment', 'center');
    photoroomFormData.append('background.prompt', backgroundPrompt);

    // Call PhotoRoom API
    const response = await fetch('https://image-api.photoroom.com/v2/edit', {
      method: 'POST',
      headers: {
        'Accept': 'image/png, application/json',
        'x-api-key': PHOTOROOM_API_KEY,
      },
      body: photoroomFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('PhotoRoom API error:', response.status, errorText);
      throw new Error(`PhotoRoom API error: ${response.status} - ${errorText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      const errorText = await response.text();
      console.error('PhotoRoom API unexpected content-type:', contentType, errorText);
      throw new Error(`PhotoRoom API returned non-image response: ${contentType} - ${errorText}`);
    }

    // Get the edited image as blob
    const editedImageBlob = await response.blob();
    console.log('Successfully edited image, size:', editedImageBlob.size);

    // Convert to base64 for JSON response (handle large files)
    const arrayBuffer = await editedImageBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Convert to base64 in chunks to avoid stack overflow
    let binary = '';
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
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('Error in edit-photo function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
