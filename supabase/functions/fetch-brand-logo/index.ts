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
    // Get Brandfetch API key from environment
    const BRANDFETCH_API_KEY = Deno.env.get('BRANDFETCH_API_KEY');
    
    if (!BRANDFETCH_API_KEY) {
      console.warn('BRANDFETCH_API_KEY not set, using public API (lower rate limits)');
    }

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

    // Prepare headers with API key if available
    const apiHeaders: Record<string, string> = {
      'Accept': 'application/json',
    };
    
    if (BRANDFETCH_API_KEY) {
      apiHeaders['Authorization'] = `Bearer ${BRANDFETCH_API_KEY}`;
    }

    // Try direct domain fetch first
    let response = await fetch(`https://api.brandfetch.io/v2/brands/${cleanQuery}.com`, {
      headers: apiHeaders,
    });

    // If direct fetch fails, try search API
    if (!response.ok) {
      const searchResponse = await fetch(
        `https://api.brandfetch.io/v2/search/${encodeURIComponent(query)}`,
        {
          headers: apiHeaders,
        }
      );

      if (!searchResponse.ok) {
        const errorText = await searchResponse.text();
        console.error('Brandfetch search error:', errorText);
        
        return new Response(
          JSON.stringify({ 
            error: 'Brand not found', 
            details: `Status: ${searchResponse.status}` 
          }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const searchData = await searchResponse.json();
      
      if (!searchData || searchData.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Brand not found in search results' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Get the first result and fetch full brand info
      const firstResult = searchData[0];
      const domain = firstResult.domain;

      console.log(`Found brand via search: ${firstResult.name} (${domain})`);

      response = await fetch(`https://api.brandfetch.io/v2/brands/${domain}`, {
        headers: apiHeaders,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Brandfetch brand fetch error:', errorText);
        
        return new Response(
          JSON.stringify({ 
            error: 'Failed to fetch brand details',
            details: `Status: ${response.status}`
          }),
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

    console.log(`Successfully fetched logo for: ${result.name} (${result.domain})`);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
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

  // Priority order:
  // 1. Light theme logo (works best on dark backgrounds)
  // 2. Dark theme logo
  // 3. Any logo
  const lightLogo = data.logos.find(logo => logo.theme === 'light' && logo.type === 'logo');
  const darkLogo = data.logos.find(logo => logo.theme === 'dark' && logo.type === 'logo');
  const anyLogo = data.logos.find(logo => logo.type === 'logo');
  const anyIcon = data.logos.find(logo => logo.type === 'icon');
  
  const selectedLogo = lightLogo || darkLogo || anyLogo || anyIcon;

  if (!selectedLogo || !selectedLogo.formats || selectedLogo.formats.length === 0) {
    return null;
  }

  // Get the best format (prefer SVG for scalability, then high-res PNG)
  const formats = selectedLogo.formats;
  const svgFormat = formats.find(f => f.format === 'svg');
  const pngFormats = formats.filter(f => f.format === 'png').sort((a, b) => (b.size || 0) - (a.size || 0));
  const bestPng = pngFormats[0];
  const anyFormat = formats[0];

  const bestFormat = svgFormat || bestPng || anyFormat;

  if (!bestFormat || !bestFormat.src) {
    return null;
  }

  console.log(`Selected logo: type=${selectedLogo.type}, theme=${selectedLogo.theme}, format=${bestFormat.format}`);

  return {
    name: data.name,
    domain: data.domain,
    logoUrl: bestFormat.src,
  };
}
