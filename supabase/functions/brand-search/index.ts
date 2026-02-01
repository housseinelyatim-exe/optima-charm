import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface BrandfetchLogo {
  type: string;
  theme: string;
  formats: Array<{
    src: string;
    format: string;
    size?: number;
  }>;
}

interface BrandfetchResponse {
  name: string;
  domain: string;
  logos: BrandfetchLogo[];
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const BRANDFETCH_API_KEY = Deno.env.get('BRANDFETCH_API_KEY');
    
    if (!BRANDFETCH_API_KEY) {
      console.error('BRANDFETCH_API_KEY not set');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const query = url.searchParams.get('query');

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Missing query parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Searching for brand: ${query}`);

    const cleanQuery = query.toLowerCase().trim().replace(/\s+/g, '-');

    const apiHeaders = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${BRANDFETCH_API_KEY}`,
    };

    // Try direct domain fetch first
    let response = await fetch(`https://api.brandfetch.io/v2/brands/${cleanQuery}.com`, {
      headers: apiHeaders,
    });

    // If direct fetch fails, try search API
    if (!response.ok) {
      console.log(`Direct fetch failed, trying search API`);
      
      const searchResponse = await fetch(
        `https://api.brandfetch.io/v2/search/${encodeURIComponent(query)}`,
        { headers: apiHeaders }
      );

      if (!searchResponse.ok) {
        return new Response(
          JSON.stringify({ error: 'Brand not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const searchData = await searchResponse.json();
      
      if (!searchData || searchData.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Brand not found in search results' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const firstResult = searchData[0];
      console.log(`Found brand: ${firstResult.name} (${firstResult.domain})`);

      response = await fetch(`https://api.brandfetch.io/v2/brands/${firstResult.domain}`, {
        headers: apiHeaders,
      });

      if (!response.ok) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch brand details' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const brandData: BrandfetchResponse = await response.json();
    
    // Log available logos
    if (brandData.logos) {
      brandData.logos.forEach((logo, i) => {
        console.log(`Logo ${i}: type=${logo.type}, theme=${logo.theme}`);
      });
    }

    const result = extractDarkLogo(brandData);

    if (!result) {
      return new Response(
        JSON.stringify({ error: 'No logo found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Returning: ${result.logoUrl}`);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function extractDarkLogo(data: BrandfetchResponse): { name: string; domain: string; logoUrl: string } | null {
  if (!data.logos || data.logos.length === 0) {
    return null;
  }

  // STRICT PRIORITY: Dark theme ONLY for best visibility on light backgrounds
  // 1. Dark theme logo (text logo)
  // 2. Dark theme icon (symbol)
  // 3. Light theme logo (fallback only)
  const darkLogo = data.logos.find(logo => logo.theme === 'dark' && logo.type === 'logo');
  const darkIcon = data.logos.find(logo => logo.theme === 'dark' && logo.type === 'icon');
  const lightLogo = data.logos.find(logo => logo.theme === 'light' && logo.type === 'logo');
  const anyLogo = data.logos[0];
  
  const selectedLogo = darkLogo || darkIcon || lightLogo || anyLogo;

  console.log(`Selected logo: type=${selectedLogo?.type}, theme=${selectedLogo?.theme}`);

  if (!selectedLogo?.formats?.length) {
    return null;
  }

  // Prefer SVG > PNG
  const formats = selectedLogo.formats;
  const svgFormat = formats.find(f => f.format === 'svg');
  const pngFormat = formats.find(f => f.format === 'png');
  const bestFormat = svgFormat || pngFormat || formats[0];

  if (!bestFormat?.src) {
    return null;
  }

  return {
    name: data.name,
    domain: data.domain,
    logoUrl: bestFormat.src,
  };
}
