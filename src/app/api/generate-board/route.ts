import { createXai } from "@ai-sdk/xai";
import { generateText } from "ai";
import { NextResponse } from "next/server";
import type { JournalResponse } from "@/lib/storage/db";

const xai = createXai({
  apiKey: process.env.XAI_API_KEY,
});

interface GenerateBoardRequest {
  journalId: string;
  responses: JournalResponse[];
}

export async function POST(request: Request) {
  console.log("[generate-board] Request received");
  
  try {
    const { responses } = (await request.json()) as GenerateBoardRequest;
    console.log("[generate-board] Responses count:", responses.length);

    const journalContext = responses
      .map((r) => `Q: ${r.question}\nA: ${r.answer}`)
      .join("\n\n");

    console.log("[generate-board] Calling xAI to generate themes...");
    
    const { text } = await generateText({
      model: xai("grok-3-mini"),
      system: `You are a creative vision board designer. Based on the user's journal responses about their goals and aspirations for 2026, generate a vision board structure with image prompts.

Return a JSON object with this exact structure:
{
  "themes": [
    {
      "title": "Theme name",
      "imagePrompt": "Detailed prompt for AI image generation - photorealistic, dreamy, ethereal lighting, aspirational",
      "affirmation": "Short inspirational text (5-10 words)",
      "gridSize": "small" | "medium" | "large"
    }
  ]
}

Guidelines:
- Generate 8-10 themes based on the journal responses
- Image prompts should be photorealistic but dreamy/ethereal
- Focus on: lifestyle scenes, nature metaphors, abstract representations of feelings
- Include soft morning light, golden hour, or gentle atmospheric effects
- Avoid: text in images, logos, specific people's faces
- Affirmations should be personal and empowering
- Make each theme distinct but cohesive in mood
- Vary gridSize for visual interest: use 2-3 "large", 3-4 "medium", and the rest "small"
- Large should be for the most important/central themes`,
      prompt: `Create a vision board based on these journal reflections:\n\n${journalContext}`,
    });

    console.log("[generate-board] xAI response received");
    
    let boardData;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        boardData = JSON.parse(jsonMatch[0]);
        console.log("[generate-board] Parsed themes:", boardData.themes?.length || 0);
      } else {
        throw new Error("No JSON found");
      }
    } catch (parseError) {
      console.log("[generate-board] Parse error, using fallback:", parseError);
      boardData = {
        themes: [
          {
            title: "New Beginnings",
            imagePrompt: "Sunrise over calm ocean, golden hour light, peaceful horizon, dreamy atmosphere, photorealistic",
            affirmation: "Every day is a fresh start",
            gridSize: "large",
          },
          {
            title: "Inner Strength",
            imagePrompt: "Mountain peak at dawn, misty valleys below, warm golden light, sense of achievement, photorealistic",
            affirmation: "I am capable of amazing things",
            gridSize: "medium",
          },
          {
            title: "Growth",
            imagePrompt: "Lush green plant sprouting through soil, soft morning light, bokeh background, life and vitality, photorealistic",
            affirmation: "I grow stronger each day",
            gridSize: "small",
          },
          {
            title: "Peace",
            imagePrompt: "Minimalist zen garden, soft natural lighting, gentle ripples in sand, tranquil atmosphere, photorealistic",
            affirmation: "Peace flows through me",
            gridSize: "large",
          },
          {
            title: "Connection",
            imagePrompt: "Warm candlelit dinner table, soft focus, intimate gathering atmosphere, golden warm tones, photorealistic",
            affirmation: "Love surrounds me",
            gridSize: "medium",
          },
          {
            title: "Adventure",
            imagePrompt: "Open road through beautiful landscape, sunset colors, sense of freedom and possibility, photorealistic",
            affirmation: "Life is an adventure",
            gridSize: "small",
          },
          {
            title: "Creativity",
            imagePrompt: "Artist's studio with natural light streaming through windows, paintbrushes, warm creative chaos, photorealistic",
            affirmation: "My creativity knows no bounds",
            gridSize: "medium",
          },
          {
            title: "Abundance",
            imagePrompt: "Overflowing farmers market with colorful fresh produce, warm sunlight, plenty and richness, photorealistic",
            affirmation: "Abundance flows to me",
            gridSize: "small",
          },
        ],
      };
    }

    // Convert themes to collage elements (simplified structure for grid layout)
    const elements = boardData.themes.map((theme: { 
      title: string; 
      imagePrompt: string; 
      affirmation: string;
      gridSize?: string;
    }, index: number) => {
      const gridSize = theme.gridSize || (index < 2 ? "large" : index < 5 ? "medium" : "small");
      
      return {
        id: crypto.randomUUID(),
        type: "image" as const,
        position: { x: 0, y: 0 }, // Not used in collage layout
        size: { width: 350, height: 280 }, // Not used in collage layout
        rotation: 0,
        layer: index,
        locked: false,
        data: {
          src: "",
          prompt: theme.imagePrompt,
          isGenerated: true,
          style: "photorealistic",
          title: theme.title,
          affirmation: theme.affirmation,
          gridSize,
          status: "pending",
        },
      };
    });

    console.log("[generate-board] Generated elements:", elements.length);
    console.log("[generate-board] Success!");
    
    return NextResponse.json({ 
      success: true, 
      elements,
      themes: boardData.themes,
    });
  } catch (error) {
    console.error("[generate-board] ERROR:", error);
    return NextResponse.json(
      { error: "Failed to generate board", details: String(error) },
      { status: 500 }
    );
  }
}
