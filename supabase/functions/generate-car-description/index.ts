import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { carData } = await req.json();

    // Fetch user's AI settings for example descriptions
    const { data: aiSettings } = await supabase
      .from('ai_settings')
      .select('example_descriptions')
      .eq('user_id', user.id)
      .single();

    const exampleDescriptions = aiSettings?.example_descriptions || '';

    // Build the prompt with car information
    const carInfo = `
Märke: ${carData.make || 'N/A'}
Modell: ${carData.model || 'N/A'}
Årsmodell: ${carData.year || 'N/A'}
Miltal: ${carData.mileage ? `${carData.mileage} mil` : 'N/A'}
Färg: ${carData.color || 'N/A'}
Bränsle: ${carData.fuel || 'N/A'}
Växellåda: ${carData.gearbox || 'N/A'}
Pris: ${carData.price ? `${carData.price} kr` : 'N/A'}
Registreringsnummer: ${carData.vin || 'N/A'}
    `.trim();

    const prompt = `Du ska generera en säljande beskrivning för en bilannons. 

Här är information om bilen:
${carInfo}

${exampleDescriptions ? `Här är exempel på hur en bra beskrivning kan se ut för en annan bil:\n${exampleDescriptions}\n` : ''}

Generera en professionell och säljande beskrivning för denna bil. Beskrivningen ska vara engagerande, informativ och locka köpare. Skriv på svenska och fokusera på bilens styrkor och egenskaper.`;

    console.log('Calling Lovable AI with prompt:', prompt);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5',
        messages: [
          { 
            role: 'system', 
            content: 'Du är en expert på att skriva säljande bilbeskrivningar för annonser. Du skapar engagerande och professionella beskrivningar som lockar köpare.' 
          },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const description = data.choices?.[0]?.message?.content;

    if (!description) {
      throw new Error('No description generated');
    }

    console.log('Generated description:', description);

    return new Response(
      JSON.stringify({ description }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating description:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
