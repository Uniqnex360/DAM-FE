// supabase/functions/analyze-and-generate-poster/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

console.log("Edge Function: analyze-and-generate-poster loaded");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function analyzeImageWithVisionAPI(imageData: string) {
  const apiKey = Deno.env.get('GOOGLE_VISION_API_KEY');
  
  if (!apiKey) {
    throw new Error('GOOGLE_VISION_API_KEY not found');
  }

  let base64Image = imageData;
  if (imageData.includes('base64,')) {
    base64Image = imageData.split('base64,')[1];
  }
  base64Image = base64Image.replace(/^data:image\/\w+;base64,/, '');

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [{
          image: { content: base64Image },
          features: [
            { type: 'LABEL_DETECTION', maxResults: 10 },
            { type: 'TEXT_DETECTION' },
            { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
            { type: 'IMAGE_PROPERTIES' },
            { type: 'LOGO_DETECTION' },
            { type: 'SAFE_SEARCH_DETECTION' }
          ]
        }]
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Vision API request failed: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

async function uploadToCloudinary(base64Image: string) {
  const cloudName = Deno.env.get("CLOUDINARY_CLOUD_NAME");
  const apiKey = Deno.env.get("CLOUDINARY_API_KEY");
  const apiSecret = Deno.env.get("CLOUDINARY_API_SECRET");

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary credentials not found');
  }

  const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');
  const uploadPreset = Deno.env.get("CLOUDINARY_UPLOAD_PRESET") || "AI IMAGE";
  
  const formData = new FormData();
  formData.append('file', `data:image/jpeg;base64,${cleanBase64}`);
  formData.append('upload_preset', uploadPreset);
  formData.append('api_key', apiKey);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cloudinary upload failed: ${error}`);
  }

  const result = await response.json();
  return result.public_id;
}

const generatePosterContent = (visionAnalysis: any) => {
  const labelAnnotations = visionAnalysis.responses?.[0]?.labelAnnotations || [];
  const imageProperties = visionAnalysis.responses?.[0]?.imagePropertiesAnnotation;
  
  const keyFeatures = labelAnnotations
    .filter((label: any) => label.score > 0.7)
    .slice(0, 5)
    .map((label: any) => label.description);
  
  const dominantColors = imageProperties?.dominantColors?.colors || [];
  const colors = dominantColors.slice(0, 5).map((c: any) => {
    const rgb = c.color;
    const hex = `#${((1 << 24) + (Math.round(rgb.red || 0) << 16) + (Math.round(rgb.green || 0) << 8) + Math.round(rgb.blue || 0)).toString(16).slice(1)}`;
    return { hex, score: c.score };
  });
  
  const primaryColor = colors[0]?.hex || "#3b82f6";
  const bgColor = colors[1]?.hex || "#ffffff";
  const textColor = colors[2]?.hex || "#1e293b";
  
  const productType = labelAnnotations[0]?.description || "Product";
  
  let headline = "";
  if (labelAnnotations.length > 0) {
    const topLabels = labelAnnotations.slice(0, 2).map((l: any) => l.description);
    headline = topLabels.join(' ');
  } else {
    headline = "Premium Product";
  }
  
  let targetAudience = ["Everyone"];
  if (labelAnnotations.some((l: any) => 
    ['kids', 'children', 'toy'].some(keyword => l.description.toLowerCase().includes(keyword))
  )) {
    targetAudience = ["Children", "Parents"];
  } else if (labelAnnotations.some((l: any) => 
    ['sports', 'fitness', 'recreation', 'athletic'].some(keyword => l.description.toLowerCase().includes(keyword))
  )) {
    targetAudience = ["Athletes", "Fitness Enthusiasts"];
  } else if (labelAnnotations.some((l: any) => 
    ['kitchen', 'cooking', 'food'].some(keyword => l.description.toLowerCase().includes(keyword))
  )) {
    targetAudience = ["Home Cooks", "Food Lovers"];
  }
  
  return {
    productType,
    keyFeatures: keyFeatures.length > 0 ? keyFeatures : ["Premium Quality", "Excellent Design"],
    suggestedHeadline: headline,
    colorPalette: colors.map((c: any) => c.hex),
    targetAudience,
    primaryColor,
    bgColor,
    textColor,
    rawLabels: labelAnnotations,
  };
};

// Helper function to safely encode text for Cloudinary URLs
const safeEncodeText = (text: string, maxLength: number = 30): string => {
  return encodeURIComponent(
    text
      .substring(0, maxLength)
      .replace(/[%&?#\/\\]/g, ' ')  // Remove problematic characters
      .replace(/\s+/g, ' ')          // Normalize spaces
      .trim()
  );
};

const generateInfographicUrl = (
  publicId: string,
  content: any,
  cloudName: string
) => {
  const headline = safeEncodeText(content.suggestedHeadline, 30);
  const productType = safeEncodeText(content.productType, 20);
  const targetAudience = safeEncodeText(content.targetAudience[0], 20);
  const accentColor = content.primaryColor.replace('#', '');
  
  // Build transformations array with VALID Cloudinary syntax
  const transformations: string[] = [];
  
  // 1. Resize and position original image at top
  transformations.push('c_fill,w_1200,h_800,g_center');
  
  // 2. Extend canvas with white background at bottom for text area
  transformations.push('b_white,c_lpad,h_1400,g_north');
  
  // 3. Add colored accent line using a 1x1 pixel overlay
  // Using fetch to create a colored rectangle
  transformations.push(`l_fetch:aHR0cHM6Ly9kdW1teWltYWdlLmNvbS8xMjAweDgvJTIzJHthY2NlbnRDb2xvcn0vJTIzJHthY2NlbnRDb2xvcn0,g_south,y_580`);
  
  // 4. Add text overlays with proper syntax
  // Product type label
  transformations.push(`l_text:arial_32_bold:${productType},co_rgb:${accentColor},g_south,y_520`);
  
  // Main headline
  transformations.push(`l_text:arial_52_bold:${headline},co_rgb:1e293b,g_south,y_440`);
  
  // Target audience
  transformations.push(`l_text:arial_24:Perfect%20for%20${targetAudience},co_rgb:64748b,g_south,y_360`);
  
  // Key Features header
  transformations.push(`l_text:arial_28_bold:Key%20Features,co_rgb:1e293b,g_south,y_280`);
  
  // Feature list (using bullet points instead of checkmarks)
  const features = content.keyFeatures.slice(0, 4);
  features.forEach((feature: string, idx: number) => {
    const y = 230 - (idx * 45);
    const cleanFeature = safeEncodeText(feature, 30);
    transformations.push(
      `l_text:arial_22:•%20${cleanFeature},co_rgb:475569,g_south,y_${Math.max(y, 50)}`
    );
  });
  
  // Footer
  transformations.push(`l_text:arial_16:AI-Powered%20Marketing%20Solution,co_rgb:94a3b8,g_south,y_20`);
  
  // Construct final URL
  const posterUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${transformations.join('/')}/${publicId}`;
  
  console.log("Generated poster URL:", posterUrl);
  return posterUrl;
};

// Alternative simpler poster generation that's more reliable
const generateSimplePosterUrl = (
  publicId: string,
  content: any,
  cloudName: string
) => {
  const headline = safeEncodeText(content.suggestedHeadline, 25);
  const productType = safeEncodeText(content.productType, 20);
  const accentColor = content.primaryColor.replace('#', '');
  
  // Simpler, more reliable transformation chain
  const transformations = [
    // Base image
    'c_fill,w_1200,h_900,g_center',
    // Add padding at bottom with white background
    'b_white,c_lpad,h_1300,g_north',
    // Dark overlay on image for better text visibility (optional)
    'e_brightness:-10',
    // Product type
    `l_text:Arial_36_bold:${productType},co_rgb:${accentColor},g_south,y_350`,
    // Headline
    `l_text:Arial_48_bold:${headline},co_rgb:222222,g_south,y_280`,
    // Tagline
    `l_text:Arial_24:Premium%20Quality%20Product,co_rgb:666666,g_south,y_200`,
    // Features (simplified)
    `l_text:Arial_20:${safeEncodeText(content.keyFeatures.slice(0, 3).join('%20%7C%20'), 60)},co_rgb:888888,g_south,y_140`,
    // Footer
    `l_text:Arial_16:Powered%20by%20AI%20Analysis,co_rgb:aaaaaa,g_south,y_40`
  ];
  
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformations.join('/')}/${publicId}`;
};

serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "imageBase64 is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Starting Vision API analysis...");
    const visionAnalysis = await analyzeImageWithVisionAPI(imageBase64);
    console.log("Vision API analysis complete");
    
    const posterContent = generatePosterContent(visionAnalysis);
    console.log("Poster content generated:", posterContent.productType);
    
    const cloudName = Deno.env.get("CLOUDINARY_CLOUD_NAME");
    let posterUrl = "";
    
    if (cloudName) {
      console.log("Uploading to Cloudinary...");
      const publicId = await uploadToCloudinary(imageBase64);
      console.log("Upload complete, public_id:", publicId);
      
      // Use the simpler, more reliable poster generation
      posterUrl = generateSimplePosterUrl(publicId, posterContent, cloudName);
      console.log("Poster URL generated:", posterUrl);
      
      // Validate the URL works by making a HEAD request
      try {
        const testResponse = await fetch(posterUrl, { method: 'HEAD' });
        if (!testResponse.ok) {
          console.log("Primary URL failed, using fallback...");
          // Fallback to just the base image with minimal transformations
          posterUrl = `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,w_1200,h_1200/${publicId}`;
        }
      } catch (e) {
        console.log("URL validation skipped");
      }
    }
    
    const visionResponse = visionAnalysis.responses?.[0] || {};

    const response = {
      success: true,
      imageUrl: posterUrl,
      analysis: {
        productType: posterContent.productType,
        keyFeatures: posterContent.keyFeatures,
        suggestedHeadline: posterContent.suggestedHeadline,
        colorPalette: posterContent.colorPalette,
        targetAudience: posterContent.targetAudience,
        visionAnalysis: {
          labels: posterContent.rawLabels,
          text: visionResponse.textAnnotations?.[0]?.description || "No text detected",
          logos: visionResponse.logoAnnotations || [],
          colors: posterContent.colorPalette,
          objects: visionResponse.localizedObjectAnnotations || [],
          safeSearch: visionResponse.safeSearchAnnotation || {},
        }
      }
    };

    return new Response(
      JSON.stringify(response),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
    
  } catch (error) {
    console.error("❌ Edge Function Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Internal Server Error",
        success: false 
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});