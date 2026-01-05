import { generateImage } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextResponse } from "next/server";

interface GenerateImageRequest {
  prompt: string;
  style?: string;
}

export async function POST(request: Request) {
  console.log("[generate-image] Request received");
  
  try {
    const body = await request.json() as GenerateImageRequest;
    const { prompt, style = "photorealistic" } = body;
    
    console.log("[generate-image] Input:", { prompt, style });

    // Enhance the prompt based on style
    let enhancedPrompt = prompt;
    
    switch (style) {
      case "photorealistic":
        enhancedPrompt = `${prompt}, photorealistic, high quality, professional photography, soft natural lighting`;
        break;
      case "illustrated":
        enhancedPrompt = `${prompt}, digital illustration, artistic, vibrant colors, stylized`;
        break;
      case "watercolor":
        enhancedPrompt = `${prompt}, watercolor painting style, soft edges, artistic, delicate brushstrokes`;
        break;
      case "abstract":
        enhancedPrompt = `${prompt}, abstract art, conceptual, modern art style, symbolic`;
        break;
      default:
        enhancedPrompt = prompt;
    }
    
    console.log("[generate-image] Enhanced prompt:", enhancedPrompt);
    console.log("[generate-image] Calling OpenAI DALL-E 3...");
    
    const startTime = Date.now();

    // Generate image using Vercel AI SDK with DALL-E 3
    const { image } = await generateImage({
      model: openai.image("dall-e-3"),
      prompt: enhancedPrompt,
      size: "1024x1024",
    });
    
    const duration = Date.now() - startTime;
    console.log(`[generate-image] Image generated in ${duration}ms`);
    console.log("[generate-image] Image mediaType:", image.mediaType);
    console.log("[generate-image] Image base64 length:", image.base64?.length || 0);

    // Convert the image to a data URL
    const imageUrl = `data:${image.mediaType};base64,${image.base64}`;
    
    console.log("[generate-image] Success! Data URL length:", imageUrl.length);

    return NextResponse.json({ 
      success: true, 
      imageUrl,
      prompt: enhancedPrompt,
    });
  } catch (error) {
    console.error("[generate-image] ERROR:", error);
    console.error("[generate-image] Error type:", typeof error);
    console.error("[generate-image] Error message:", error instanceof Error ? error.message : String(error));
    
    return NextResponse.json(
      { error: "Failed to generate image", details: String(error) },
      { status: 500 }
    );
  }
}
