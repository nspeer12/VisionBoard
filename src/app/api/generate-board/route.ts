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
  try {
    const { responses } = (await request.json()) as GenerateBoardRequest;

    // Build context from journal responses
    const journalContext = responses
      .map((r) => `Q: ${r.question}\nA: ${r.answer}`)
      .join("\n\n");

    // Generate board structure and image prompts
    const { text } = await generateText({
      model: xai("grok-3-mini"),
      system: `You are a creative vision board designer. Based on the user's journal responses about their goals and aspirations for 2026, generate a vision board structure with image prompts.

Return a JSON object with this exact structure:
{
  "themes": [
    {
      "title": "Theme name",
      "imagePrompt": "Detailed prompt for AI image generation - photorealistic, dreamy, ethereal lighting, aspirational",
      "affirmation": "Short inspirational text (5-10 words)"
    }
  ]
}

Guidelines:
- Generate 6-8 themes based on the journal responses
- Image prompts should be photorealistic but dreamy/ethereal
- Focus on: lifestyle scenes, nature metaphors, abstract representations of feelings
- Include soft morning light, golden hour, or gentle atmospheric effects
- Avoid: text in images, logos, specific people's faces
- Affirmations should be personal and empowering
- Make each theme distinct but cohesive in mood`,
      prompt: `Create a vision board based on these journal reflections:\n\n${journalContext}`,
    });

    // Parse the response
    let boardData;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        boardData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch {
      // Fallback structure if parsing fails
      boardData = {
        themes: [
          {
            title: "New Beginnings",
            imagePrompt: "Sunrise over calm ocean, golden hour light, peaceful horizon, dreamy atmosphere, photorealistic",
            affirmation: "Every day is a fresh start",
          },
          {
            title: "Inner Strength",
            imagePrompt: "Mountain peak at dawn, misty valleys below, warm golden light, sense of achievement, photorealistic",
            affirmation: "I am capable of amazing things",
          },
          {
            title: "Growth",
            imagePrompt: "Lush green plant sprouting through soil, soft morning light, bokeh background, life and vitality, photorealistic",
            affirmation: "I grow stronger each day",
          },
          {
            title: "Peace",
            imagePrompt: "Minimalist zen garden, soft natural lighting, gentle ripples in sand, tranquil atmosphere, photorealistic",
            affirmation: "Peace flows through me",
          },
          {
            title: "Connection",
            imagePrompt: "Warm candlelit dinner table, soft focus, intimate gathering atmosphere, golden warm tones, photorealistic",
            affirmation: "Love surrounds me",
          },
          {
            title: "Adventure",
            imagePrompt: "Open road through beautiful landscape, sunset colors, sense of freedom and possibility, photorealistic",
            affirmation: "Life is an adventure",
          },
        ],
      };
    }

    // Convert themes to canvas elements with layout
    const elements = boardData.themes.map((theme: { title: string; imagePrompt: string; affirmation: string }, index: number) => {
      const cols = 3;
      const col = index % cols;
      const row = Math.floor(index / cols);
      const spacing = 40;
      const imageWidth = 350;
      const imageHeight = 280;
      const textHeight = 80;

      return [
        // Image element
        {
          id: crypto.randomUUID(),
          type: "image" as const,
          position: { 
            x: 100 + col * (imageWidth + spacing), 
            y: 100 + row * (imageHeight + textHeight + spacing) 
          },
          size: { width: imageWidth, height: imageHeight },
          rotation: 0,
          layer: index * 2,
          locked: false,
          data: {
            src: "/placeholder-generating.svg",
            prompt: theme.imagePrompt,
            isGenerated: true,
            style: "photorealistic",
            title: theme.title,
            status: "pending",
          },
        },
        // Text element
        {
          id: crypto.randomUUID(),
          type: "text" as const,
          position: { 
            x: 100 + col * (imageWidth + spacing), 
            y: 100 + row * (imageHeight + textHeight + spacing) + imageHeight + 10
          },
          size: { width: imageWidth, height: textHeight },
          rotation: 0,
          layer: index * 2 + 1,
          locked: false,
          data: {
            content: theme.affirmation,
            fontFamily: "Playfair Display",
            fontSize: 18,
            fontWeight: 500,
            color: "#2D3436",
            textAlign: "center" as const,
          },
        },
      ];
    }).flat();

    return NextResponse.json({ 
      success: true, 
      elements,
      themes: boardData.themes,
    });
  } catch (error) {
    console.error("Error generating board:", error);
    return NextResponse.json(
      { error: "Failed to generate board" },
      { status: 500 }
    );
  }
}
