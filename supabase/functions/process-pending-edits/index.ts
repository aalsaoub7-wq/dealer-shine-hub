import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    // Get all pending edits that should be completed
    const { data: pendingEdits, error: fetchError } = await supabaseClient
      .from('pending_photo_edits')
      .select('*')
      .eq('completed', false)
      .lte('complete_at', new Date().toISOString());

    if (fetchError) {
      console.error('Error fetching pending edits:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${pendingEdits?.length || 0} pending edits to process`);

    let processedCount = 0;
    let errorCount = 0;

    // Process each pending edit
    for (const edit of pendingEdits || []) {
      try {
        // Update the photo with the edited URL
        const { error: updatePhotoError } = await supabaseClient
          .from('photos')
          .update({
            url: edit.edited_url,
            is_edited: true,
          })
          .eq('id', edit.photo_id);

        if (updatePhotoError) {
          console.error(`Error updating photo ${edit.photo_id}:`, updatePhotoError);
          errorCount++;
          continue;
        }

        // Mark the pending edit as completed
        const { error: updateEditError } = await supabaseClient
          .from('pending_photo_edits')
          .update({ completed: true })
          .eq('id', edit.id);

        if (updateEditError) {
          console.error(`Error marking edit ${edit.id} as completed:`, updateEditError);
          errorCount++;
          continue;
        }

        processedCount++;
        console.log(`Successfully processed edit ${edit.id} for photo ${edit.photo_id}`);
      } catch (error) {
        console.error(`Error processing edit ${edit.id}:`, error);
        errorCount++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: processedCount,
        errors: errorCount,
        total: pendingEdits?.length || 0,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in process-pending-edits:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
