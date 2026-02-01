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
  icon?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get query parameter
    const url = new URL(req.url);
    const query = url.searchParams.get('query');

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Missing query parameter' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Clean and prepare query
    const cleanQuery = query.toLowerCase().trim().replace(/\s+/g, '-');

    // Try direct domain fetch first
    let response = await fetch(`https://api.brandfetch.io/v2/brands/${cleanQuery}.com`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    // If direct fetch fails, try search API
    if (!response.ok) {
      const searchResponse = await fetch(
        `https://api.brandfetch.io/v2/search/${encodeURIComponent(query)}`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!searchResponse.ok) {
        return new Response(
          JSON.stringify({ error: 'Brand not found' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const searchData = await searchResponse.json();
      
      if (!searchData || searchData.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Brand not found' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Get the first result and fetch full brand info
      const firstResult = searchData[0];
      const domain = firstResult.domain;

      response = await fetch(`https://api.brandfetch.io/v2/brands/${domain}`, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch brand details' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    const brandData: BrandfetchResponse = await response.json();
    const result = extractLogo(brandData);

    if (!result) {
      return new Response(
        JSON.stringify({ error: 'No logo found for this brand' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function extractLogo(data: BrandfetchResponse): { name: string; domain: string; logoUrl: string } | null {
  if (!data.logos || data.logos.length === 0) {
    return null;
  }

  // Priority: light theme logo > any logo
  const lightLogo = data.logos.find(logo => logo.theme === 'light');
  const anyLogo = data.logos[0];
  const selectedLogo = lightLogo || anyLogo;

  // Get the best format (prefer SVG, then PNG)
  const formats = selectedLogo.formats;
  const svgFormat = formats.find(f => f.format === 'svg');
  const pngFormat = formats.find(f => f.format === 'png');
  const anyFormat = formats[0];

  const bestFormat = svgFormat || pngFormat || anyFormat;

  if (!bestFormat) {
    return null;
  }

  return {
    name: data.name,
    domain: data.domain,
    logoUrl: bestFormat.src,
  };
}
