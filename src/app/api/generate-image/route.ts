import { generateImage } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextResponse } from "next/server";

interface GenerateImageRequest {
  prompt: string;
  style?: string;
}

// Style enhancers for variety
const styleEnhancers: Record<string, string> = {
  photography: "professional photography, shallow depth of field, soft natural lighting, high quality DSLR",
  watercolor: "watercolor painting, soft washes, delicate brushstrokes, artistic, flowing colors, paper texture",
  abstract: "abstract art, bold shapes, modern art, conceptual, expressive, non-representational",
  oilpainting: "oil painting, rich textures, classical art style, visible brushstrokes, museum quality",
  minimalist: "minimalist, clean lines, simple composition, lots of negative space, zen aesthetic",
  impressionist: "impressionist painting style, soft focus, dappled light, Monet-inspired, dreamy",
  cinematic: "cinematic shot, dramatic lighting, film grain, movie still, widescreen composition",
  macro: "macro photography, extreme close-up, intricate details, shallow depth of field, high magnification",
  landscape: "epic landscape photography, golden hour, panoramic, majestic, national geographic style",
  symbolic: "symbolic imagery, metaphorical, meaningful objects, artistic composition, thoughtful",
  dreamy: "dreamy aesthetic, soft focus, ethereal glow, pastel tones, magical atmosphere",
  vintage: "vintage photography, film grain, muted colors, nostalgic, retro aesthetic",
};

export async function POST(request: Request) {
  console.log("[generate-image] Request received");
  
  try {
    const body = await request.json() as GenerateImageRequest;
    const { prompt, style = "photography" } = body;
    
    console.log("[generate-image] Input:", { prompt, style });

    // Get style enhancer or use default
    const styleEnhancer = styleEnhancers[style] || styleEnhancers.photography;
    
    // Build enhanced prompt - explicitly avoiding people
    const enhancedPrompt = `${prompt}. Style: ${styleEnhancer}. Important: NO people, NO faces, NO human figures. Focus on scenes, objects, nature, and atmosphere.`;
    
    console.log("[generate-image] Enhanced prompt:", enhancedPrompt);
    console.log("[generate-image] Calling OpenAI DALL-E 3...");
    
    const startTime = Date.now();

    const { image } = await generateImage({
      model: openai.image("dall-e-3"),
      prompt: enhancedPrompt,
      size: "1024x1024",
    });
    
    const duration = Date.now() - startTime;
    console.log(`[generate-image] Image generated in ${duration}ms`);

    const imageUrl = `data:${image.mediaType};base64,${image.base64}`;
    
    console.log("[generate-image] Success!");

    return NextResponse.json({ 
      success: true, 
      imageUrl,
      prompt: enhancedPrompt,
    });
  } catch (error) {
    console.error("[generate-image] ERROR:", error);
    
    return NextResponse.json(
      { error: "Failed to generate image", details: String(error) },
      { status: 500 }
    );
  }
}
