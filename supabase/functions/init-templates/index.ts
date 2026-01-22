import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Allowlist of trusted domains for fetching template images
// Only URLs from these domains are permitted to prevent SSRF attacks
const ALLOWED_DOMAINS = [
  'luvero.se',
  'www.luvero.se',
  'luvero.lovable.app',
  'lovable.app',
  'localhost',
];

// Template definitions with their public URLs (from Lovable deployment)
const TEMPLATES = [
  { id: 'showroom', filename: 'templates/showroom.jpg' },
  { id: 'luxury-studio', filename: 'templates/luxury-studio.jpg' },
];

// Thumbnail definitions - these need to be uploaded to Supabase Storage
const THUMBNAILS = [
  { id: 'showroom-thumb', filename: 'backgrounds/thumbnails/studio-background-thumb.jpg', source: 'backgrounds/thumbnails/studio-background-thumb.jpg' },
  { id: 'dark-studio-thumb', filename: 'backgrounds/thumbnails/dark-studio-thumb.jpg', source: 'backgrounds/thumbnails/dark-studio-thumb.jpg' },
  { id: 'gallery-thumb', filename: 'backgrounds/thumbnails/gallery-thumb.jpg', source: 'backgrounds/thumbnails/gallery-thumb.jpg' },
  { id: 'curved-studio-thumb', filename: 'backgrounds/thumbnails/curved-studio-thumb.jpg', source: 'backgrounds/thumbnails/curved-studio-thumb.jpg' },
  { id: 'ceiling-lights-thumb', filename: 'backgrounds/thumbnails/ceiling-lights-thumb.jpg', source: 'backgrounds/thumbnails/ceiling-lights-thumb.jpg' },
  { id: 'panel-wall-thumb', filename: 'backgrounds/thumbnails/panel-wall-thumb.jpg', source: 'backgrounds/thumbnails/panel-wall-thumb.jpg' },
  { id: 'dark-walls-light-floor-thumb', filename: 'backgrounds/thumbnails/dark-walls-light-floor-thumb.jpg', source: 'backgrounds/thumbnails/dark-walls-light-floor-thumb.jpg' },
  { id: 'concrete-showroom-thumb', filename: 'backgrounds/thumbnails/concrete-showroom-thumb.jpg', source: 'backgrounds/thumbnails/concrete-showroom-thumb.jpg' },
  { id: 'spotlight-studio-thumb', filename: 'backgrounds/thumbnails/spotlight-studio-thumb.jpg', source: 'backgrounds/thumbnails/spotlight-studio-thumb.jpg' },
];

/**
 * Validates that the provided URL is from an allowed domain
 * Prevents SSRF attacks by restricting fetch targets
 */
function isAllowedUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    const hostname = url.hostname.toLowerCase();
    
    // Check if hostname matches or is a subdomain of allowed domains
    return ALLOWED_DOMAINS.some(domain => {
      return hostname === domain || hostname.endsWith(`.${domain}`);
    });
  } catch {
    // Invalid URL format
    return false;
  }
}

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

    // Security: Validate baseUrl against allowlist to prevent SSRF
    if (!isAllowedUrl(baseUrl)) {
      console.error(`Rejected baseUrl: ${baseUrl} - not in allowed domains`);
      return new Response(
        JSON.stringify({ error: 'Invalid baseUrl: domain not allowed' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const results: Array<{ id: string; success: boolean; error?: string }> = [];

    // Upload templates
    for (const template of TEMPLATES) {
      try {
        const imageUrl = `${baseUrl}/${template.filename}`;
        if (!isAllowedUrl(imageUrl)) {
          throw new Error('Constructed URL not allowed');
        }
        console.log(`Fetching template image from: ${imageUrl}`);
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }
        const imageBlob = await response.blob();
        console.log(`Fetched ${template.id}, size: ${imageBlob.size} bytes`);
        const { error: uploadError } = await supabase.storage
          .from('car-photos')
          .upload(template.filename, imageBlob, { contentType: 'image/jpeg', upsert: true });
        if (uploadError) throw uploadError;
        console.log(`Successfully uploaded ${template.id} to storage`);
        results.push({ id: template.id, success: true });
      } catch (error: any) {
        console.error(`Failed to upload ${template.id}:`, error.message);
        results.push({ id: template.id, success: false, error: error.message });
      }
    }

    // Upload thumbnails
    for (const thumb of THUMBNAILS) {
      try {
        const imageUrl = `${baseUrl}/${thumb.source}`;
        if (!isAllowedUrl(imageUrl)) {
          throw new Error('Constructed URL not allowed');
        }
        console.log(`Fetching thumbnail from: ${imageUrl}`);
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch thumbnail: ${response.status}`);
        }
        const imageBlob = await response.blob();
        console.log(`Fetched ${thumb.id}, size: ${imageBlob.size} bytes`);
        const { error: uploadError } = await supabase.storage
          .from('car-photos')
          .upload(thumb.filename, imageBlob, { contentType: 'image/jpeg', upsert: true });
        if (uploadError) throw uploadError;
        console.log(`Successfully uploaded ${thumb.id} to storage`);
        results.push({ id: thumb.id, success: true });
      } catch (error: any) {
        console.error(`Failed to upload ${thumb.id}:`, error.message);
        results.push({ id: thumb.id, success: false, error: error.message });
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
