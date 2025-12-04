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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Create client with user's auth to verify they're authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { companyId } = await req.json();
    if (!companyId) {
      return new Response(
        JSON.stringify({ error: 'companyId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role to bypass RLS and update company trial counters
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // First get current values
    const { data: company, error: fetchError } = await supabaseAdmin
      .from('companies')
      .select('trial_images_used, trial_images_remaining')
      .eq('id', companyId)
      .single();

    if (fetchError) {
      console.error('Error fetching company:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch company' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const newUsed = (company.trial_images_used || 0) + 1;
    const newRemaining = Math.max(0, (company.trial_images_remaining || 0) - 1);

    // Update the company with new values
    const { error: updateError } = await supabaseAdmin
      .from('companies')
      .update({
        trial_images_used: newUsed,
        trial_images_remaining: newRemaining,
      })
      .eq('id', companyId);

    if (updateError) {
      console.error('Error updating company trial counters:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update trial counters' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[TRIAL USAGE] Company ${companyId}: used=${newUsed}, remaining=${newRemaining}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        trial_images_used: newUsed, 
        trial_images_remaining: newRemaining 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in track-trial-usage:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
