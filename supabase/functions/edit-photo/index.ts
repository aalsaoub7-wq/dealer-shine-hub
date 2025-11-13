import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    const formData = await req.formData();
    const imageFile = formData.get('image_file');

    if (!imageFile || !(imageFile instanceof File)) {
      throw new Error('No image file provided');
    }

    console.log('Processing image with PhotoRoom API:', imageFile.name);

    // Create FormData for PhotoRoom API
    const photoroomFormData = new FormData();
    photoroomFormData.append('image_file', imageFile);

    // Call PhotoRoom API
    const response = await fetch('https://sdk.photoroom.com/v1/segment', {
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

    // Get the edited image as blob
    const editedImageBlob = await response.blob();
    console.log('Successfully edited image, size:', editedImageBlob.size);

    // Convert to base64 for JSON response
    const arrayBuffer = await editedImageBlob.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

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
