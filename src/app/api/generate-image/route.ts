import { generateImage } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextResponse } from "next/server";

interface GenerateImageRequest {
  prompt: string;
  style?: string;
}

export async function POST(request: Request) {
  try {
    const { prompt, style = "photorealistic" } = 
      (await request.json()) as GenerateImageRequest;

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

    // Generate image using Vercel AI SDK with DALL-E 3
    const { image } = await generateImage({
      model: openai.image("dall-e-3"),
      prompt: enhancedPrompt,
      size: "1024x1024",
    });

    // Convert the image to a data URL
    const imageUrl = `data:${image.mediaType};base64,${image.base64}`;

    return NextResponse.json({ 
      success: true, 
      imageUrl,
      prompt: enhancedPrompt,
    });
  } catch (error) {
    console.error("Error generating image:", error);
    return NextResponse.json(
      { error: "Failed to generate image", details: String(error) },
      { status: 500 }
    );
  }
}
