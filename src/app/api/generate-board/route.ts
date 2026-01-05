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

    // Build rich context from journal responses
    const journalContext = responses
      .filter(r => r.answer.trim().length > 0)
      .map((r) => `Q: ${r.question}\nA: ${r.answer}`)
      .join("\n\n");

    // Extract key personal details for more targeted generation
    const hasResponses = responses.some(r => r.answer.trim().length > 0);

    console.log("[generate-board] Calling xAI to generate personalized themes...");
    
    const systemPrompt = `You are an expert vision board designer who creates deeply personalized, meaningful boards. Your job is to transform someone's journal reflections into vivid, specific imagery that speaks directly to THEIR unique goals, values, and dreams.

CRITICAL: Read the journal responses carefully and extract:
1. SPECIFIC details they mentioned (activities, places, feelings, people roles)
2. Their ACTUAL WORDS and phrases - use these in affirmations
3. The FEELING they want (not generic "success" but their specific emotion)
4. Any OBSTACLES they mentioned - create imagery of overcoming them
5. Their identity/who they're becoming

Return a JSON object with this exact structure:
{
  "themes": [
    {
      "title": "Short theme name",
      "imagePrompt": "Detailed, specific prompt for AI image generation",
      "affirmation": "Personal affirmation using THEIR words/themes",
      "gridSize": "small" | "medium" | "large",
      "personalConnection": "Brief note on how this connects to their journal"
    }
  ]
}

PERSONALIZATION GUIDELINES:
- If they mentioned "morning runs" → show a specific morning running scene, not generic "fitness"
- If they want to "feel calm" → show their version of calm (beach? mountains? reading nook?)
- If they mentioned a specific career goal → visualize that specific achievement
- If they wrote about relationships → show connection in the way THEY described it
- Use their exact phrases in affirmations when powerful ("I am becoming..." → use their words)
- If they mentioned a "word for the year" → this should be the centerpiece theme

IMAGE PROMPT GUIDELINES:
- Be SPECIFIC: "woman journaling at sunrise on wooden dock over misty lake" not "peaceful scene"
- Include atmosphere: lighting, time of day, weather, mood
- Photorealistic, dreamy, soft ethereal lighting
- NO text, logos, or identifiable faces
- Include sensory details: textures, colors, atmosphere

GRID SIZE DISTRIBUTION (for 9 total images):
- 2 "large" (2x2) - for the MOST important themes (year word, primary goal)
- 3 "medium" (1x2 or 2x1) - for significant themes
- 4 "small" (1x1) - for supporting themes

Generate EXACTLY 9 themes that tell the story of their 2026 vision.`;

    const { text } = await generateText({
      model: xai("grok-3-mini"),
      system: systemPrompt,
      prompt: hasResponses 
        ? `Create a deeply personalized vision board based on these journal reflections. Extract specific details and use their actual words:\n\n${journalContext}`
        : `Create a beautiful, inspiring vision board for someone beginning their 2026 journey. Focus on themes of new beginnings, self-discovery, growth, peace, creativity, connection, adventure, health, and abundance. Make the imagery vivid and aspirational.`,
    });

    console.log("[generate-board] xAI response received");
    
    let boardData;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        boardData = JSON.parse(jsonMatch[0]);
        console.log("[generate-board] Parsed themes:", boardData.themes?.length || 0);
        
        // Log personalization for debugging
        boardData.themes?.forEach((t: any, i: number) => {
          console.log(`[generate-board] Theme ${i + 1}: ${t.title} - ${t.personalConnection || 'no connection noted'}`);
        });
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.log("[generate-board] Parse error, using fallback:", parseError);
      // Fallback for when AI fails or no journal responses
      boardData = {
        themes: [
          {
            title: "New Beginnings",
            imagePrompt: "Majestic sunrise breaking through morning mist over a calm mountain lake, golden light rays streaming through pine trees, reflection on still water, sense of possibility and fresh starts, photorealistic, dreamy atmosphere",
            affirmation: "Every sunrise brings new possibilities",
            gridSize: "large",
          },
          {
            title: "Inner Peace",
            imagePrompt: "Person meditating on a wooden dock extending into a serene misty lake at dawn, soft pink and gold sky, mountains in distance, perfect stillness, photorealistic, ethereal lighting",
            affirmation: "I am calm, centered, and at peace",
            gridSize: "medium",
          },
          {
            title: "Growth & Learning",
            imagePrompt: "Cozy reading corner with floor-to-ceiling bookshelves, warm afternoon light streaming through large window, comfortable armchair with blanket, steaming cup of tea, plants, photorealistic, inviting atmosphere",
            affirmation: "I grow wiser and stronger each day",
            gridSize: "small",
          },
          {
            title: "Creative Flow",
            imagePrompt: "Artist's studio bathed in warm natural light, canvases with vibrant abstract art, paintbrushes in mason jars, creative chaos of art supplies, large windows overlooking garden, photorealistic, inspiring atmosphere",
            affirmation: "My creativity flows freely and abundantly",
            gridSize: "medium",
          },
          {
            title: "Connection & Love",
            imagePrompt: "Intimate outdoor dinner party at golden hour, long wooden table with candles and wildflowers, string lights overhead, warm laughter atmosphere, wine glasses catching sunlight, photorealistic, magical evening",
            affirmation: "I am surrounded by love and belonging",
            gridSize: "large",
          },
          {
            title: "Adventure Awaits",
            imagePrompt: "Winding mountain road through dramatic landscape at sunset, golden light painting the hills, sense of journey and possibility, open road ahead, photorealistic, cinematic wide shot",
            affirmation: "Life is an adventure I embrace fully",
            gridSize: "small",
          },
          {
            title: "Vibrant Health",
            imagePrompt: "Morning trail run through misty forest, dappled sunlight through trees, fresh energy, athletic movement through nature, dewdrops on leaves, photorealistic, vitality and wellness",
            affirmation: "My body is strong and full of energy",
            gridSize: "medium",
          },
          {
            title: "Abundance",
            imagePrompt: "Overflowing farmers market stall with colorful fresh produce, golden morning light, artisan breads, fresh flowers, sense of plenty and gratitude, photorealistic, rich colors",
            affirmation: "Abundance flows into my life effortlessly",
            gridSize: "small",
          },
          {
            title: "Dream Life",
            imagePrompt: "Breathtaking sunset view from modern home with floor-to-ceiling windows, mountains and ocean in distance, minimalist interior, sense of achievement and contentment, photorealistic, aspirational",
            affirmation: "I am creating the life of my dreams",
            gridSize: "small",
          },
        ],
      };
    }

    // Ensure exactly 9 themes with proper grid distribution
    let themes = boardData.themes || [];
    
    // If we have fewer than 9, pad with defaults
    while (themes.length < 9) {
      const defaults = [
        { title: "Possibility", imagePrompt: "Vast starry night sky over mountain silhouette, milky way visible, sense of infinite possibility, photorealistic", affirmation: "Anything is possible", gridSize: "small" },
        { title: "Gratitude", imagePrompt: "Golden wheat field at sunset, warm light, peaceful countryside, thankfulness, photorealistic", affirmation: "I am grateful for this moment", gridSize: "small" },
        { title: "Courage", imagePrompt: "Person standing at edge of cliff overlooking vast valley at sunrise, brave stance, new horizons, photorealistic", affirmation: "I have the courage to grow", gridSize: "small" },
      ];
      themes.push(defaults[themes.length % defaults.length]);
    }
    
    // Trim to exactly 9
    themes = themes.slice(0, 9);
    
    // Ensure proper grid size distribution: 2 large, 3 medium, 4 small
    const sizeDistribution = ["large", "large", "medium", "medium", "medium", "small", "small", "small", "small"];
    themes = themes.map((theme: any, index: number) => ({
      ...theme,
      gridSize: theme.gridSize || sizeDistribution[index],
    }));

    // Convert themes to collage elements
    const elements = themes.map((theme: { 
      title: string; 
      imagePrompt: string; 
      affirmation: string;
      gridSize?: string;
      personalConnection?: string;
    }, index: number) => {
      return {
        id: crypto.randomUUID(),
        type: "image" as const,
        position: { x: 0, y: 0 },
        size: { width: 350, height: 280 },
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
          gridSize: theme.gridSize || "small",
          personalConnection: theme.personalConnection,
          status: "pending",
        },
      };
    });

    console.log("[generate-board] Generated elements:", elements.length);
    console.log("[generate-board] Success!");
    
    return NextResponse.json({ 
      success: true, 
      elements,
      themes,
    });
  } catch (error) {
    console.error("[generate-board] ERROR:", error);
    return NextResponse.json(
      { error: "Failed to generate board", details: String(error) },
      { status: 500 }
    );
  }
}
