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

export async function searchBrandLogo(query: string): Promise<{ name: string; domain: string; logoUrl: string } | null> {
  try {
    // First, try to get brand info by domain or name
    const cleanQuery = query.toLowerCase().trim().replace(/\s+/g, '-');
    
    // Try direct domain fetch first
    const response = await fetch(`https://api.brandfetch.io/v2/brands/${cleanQuery}.com`, {
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      // If direct fetch fails, try search
      const searchResponse = await fetch(`https://api.brandfetch.io/v2/search/${encodeURIComponent(query)}`, {
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!searchResponse.ok) {
        return null;
      }

      const searchData = await searchResponse.json();
      if (!searchData || searchData.length === 0) {
        return null;
      }

      // Get the first result
      const firstResult = searchData[0];
      const domain = firstResult.domain;

      // Fetch full brand info
      const brandResponse = await fetch(`https://api.brandfetch.io/v2/brands/${domain}`, {
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!brandResponse.ok) {
        return null;
      }

      const brandData: BrandfetchResponse = await brandResponse.json();
      return extractLogo(brandData);
    }

    const data: BrandfetchResponse = await response.json();
    return extractLogo(data);
  } catch (error) {
    console.error('Brandfetch error:', error);
    return null;
  }
}

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
