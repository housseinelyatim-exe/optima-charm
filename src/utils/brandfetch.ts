interface BrandLogoResult {
  name: string;
  domain: string;
  logoUrl: string;
}

export async function searchBrandLogo(query: string): Promise<BrandLogoResult | null> {
  try {
    // Get Supabase URL from environment
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    if (!supabaseUrl) {
      console.error('VITE_SUPABASE_URL not found in environment variables');
      return null;
    }

    // Call our Supabase Edge Function instead of Brandfetch API directly
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/brand-search?query=${encodeURIComponent(query)}`;
    
    const response = await fetch(edgeFunctionUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Edge function error:', errorData);
      return null;
    }

    const data: BrandLogoResult = await response.json();
    return data;
  } catch (error) {
    console.error('Brandfetch utility error:', error);
    return null;
  }
}
