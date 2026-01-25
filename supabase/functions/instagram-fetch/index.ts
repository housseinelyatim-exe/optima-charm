const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate Instagram URL
    const instagramUrlPattern = /^https?:\/\/(www\.)?instagram\.com\/(p|reel)\/[\w-]+\/?/;
    if (!instagramUrlPattern.test(url)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid Instagram post URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching Instagram post:', url);

    // Use Instagram's oEmbed API (no auth required)
    const oembedUrl = `https://api.instagram.com/oembed?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(oembedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      console.error('Instagram oEmbed error:', response.status);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to fetch Instagram post. Make sure the post is public.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('oEmbed response:', JSON.stringify(data));

    // Extract thumbnail URL from oEmbed response
    const imageUrl = data.thumbnail_url;
    const authorName = data.author_name || '';
    const title = data.title || '';

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'Could not extract image from post' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully extracted image:', imageUrl);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          image_url: imageUrl,
          author_name: authorName,
          title: title,
          original_url: url,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching Instagram post:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch Instagram post' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
