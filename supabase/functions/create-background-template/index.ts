import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { template_id, name, description, image_url, unlock_code } = await req.json();

    // Validate required fields
    if (!template_id || !name || !image_url || !unlock_code) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: template_id, name, image_url, unlock_code' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Creating background template:', { template_id, name, unlock_code });

    // Get the highest display_order
    const { data: maxOrderData } = await supabase
      .from('background_templates')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    const newOrder = (maxOrderData?.display_order || 100) + 1;

    console.log('New display_order:', newOrder);

    // Insert the new background template
    const { data, error } = await supabase
      .from('background_templates')
      .insert({
        template_id,
        name,
        description: description || null,
        image_url,
        thumbnail_url: image_url, // Use same image as thumbnail for simplicity
        unlock_code,
        is_custom: true,
        is_active: true,
        display_order: newOrder
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Background template created:', data);

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (err) {
    console.error('Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
