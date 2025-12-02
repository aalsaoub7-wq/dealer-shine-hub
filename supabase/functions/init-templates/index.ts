import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Template definitions with their public URLs (from Lovable deployment)
const TEMPLATES = [
  {
    id: 'showroom',
    filename: 'templates/showroom.jpg',
  },
  {
    id: 'luxury-studio', 
    filename: 'templates/luxury-studio.jpg',
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    // Use service role to bypass RLS for storage operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { baseUrl } = await req.json();
    
    if (!baseUrl) {
      throw new Error('baseUrl is required');
    }

    const results: Array<{ id: string; success: boolean; error?: string }> = [];

    for (const template of TEMPLATES) {
      try {
        // Fetch the image from the public URL
        const imageUrl = `${baseUrl}/${template.filename}`;
        console.log(`Fetching template image from: ${imageUrl}`);
        
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }
        
        const imageBlob = await response.blob();
        console.log(`Fetched ${template.id}, size: ${imageBlob.size} bytes`);

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('car-photos')
          .upload(template.filename, imageBlob, {
            contentType: 'image/jpeg',
            upsert: true
          });

        if (uploadError) {
          throw uploadError;
        }

        console.log(`Successfully uploaded ${template.id} to storage`);
        results.push({ id: template.id, success: true });
      } catch (error: any) {
        console.error(`Failed to upload ${template.id}:`, error.message);
        results.push({ id: template.id, success: false, error: error.message });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in init-templates function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
