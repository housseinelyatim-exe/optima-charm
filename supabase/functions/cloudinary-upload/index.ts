import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const cloudName = Deno.env.get("CLOUDINARY_CLOUD_NAME");
    const apiKey = Deno.env.get("CLOUDINARY_API_KEY");
    const apiSecret = Deno.env.get("CLOUDINARY_API_SECRET");

    if (!cloudName || !apiKey || !apiSecret) {
      console.error("Missing Cloudinary credentials");
      return new Response(
        JSON.stringify({ error: "Cloudinary not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new Response(
        JSON.stringify({ error: "No file provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Uploading file:", file.name, "Size:", file.size, "Type:", file.type);

    // Check for HEIC format - not supported
    const fileName = file.name.toLowerCase();
    if (fileName.endsWith(".heic") || fileName.endsWith(".heif") || file.type === "image/heic" || file.type === "image/heif") {
      return new Response(
        JSON.stringify({ error: "Le format HEIC n'est pas supporté. Veuillez convertir l'image en JPG ou PNG avant de l'uploader." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Convert file to base64 - chunk-based to avoid stack overflow
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let base64 = "";
    const chunkSize = 8192;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, i + chunkSize);
      base64 += String.fromCharCode.apply(null, Array.from(chunk));
    }
    base64 = btoa(base64);
    const dataUri = `data:${file.type};base64,${base64}`;

    // Generate signature for signed upload
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = "optima-optique";
    const transformation = "f_webp,q_auto"; // Auto WebP conversion

    // Create signature string
    const signatureString = `folder=${folder}&timestamp=${timestamp}&transformation=${transformation}${apiSecret}`;
    
    // Generate SHA-1 signature
    const encoder = new TextEncoder();
    const data = encoder.encode(signatureString);
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    // Upload to Cloudinary
    const uploadFormData = new FormData();
    uploadFormData.append("file", dataUri);
    uploadFormData.append("api_key", apiKey);
    uploadFormData.append("timestamp", timestamp.toString());
    uploadFormData.append("signature", signature);
    uploadFormData.append("folder", folder);
    uploadFormData.append("transformation", transformation);

    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: uploadFormData,
      }
    );

    const uploadResult = await uploadResponse.json();

    if (!uploadResponse.ok) {
      console.error("Cloudinary upload error:", uploadResult);
      return new Response(
        JSON.stringify({ error: uploadResult.error?.message || "Upload failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Upload successful:", uploadResult.secure_url);

    // Return the WebP optimized URL
    const optimizedUrl = uploadResult.secure_url.replace("/upload/", "/upload/f_webp,q_auto/");

    return new Response(
      JSON.stringify({
        success: true,
        url: optimizedUrl,
        public_id: uploadResult.public_id,
        width: uploadResult.width,
        height: uploadResult.height,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Upload failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
