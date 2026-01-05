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

// Available styles for variety
const availableStyles = [
  "photography",
  "watercolor", 
  "abstract",
  "oilpainting",
  "minimalist",
  "impressionist",
  "cinematic",
  "macro",
  "landscape",
  "symbolic",
  "dreamy",
  "vintage",
];

export async function POST(request: Request) {
  console.log("[generate-board] Request received");
  
  try {
    const { responses } = (await request.json()) as GenerateBoardRequest;
    console.log("[generate-board] Responses count:", responses.length);

    // Build rich context from journal responses
    const answeredResponses = responses.filter(r => r.answer.trim().length > 0);
    const journalContext = answeredResponses
      .map((r) => `Q: ${r.question}\nA: ${r.answer}`)
      .join("\n\n");

    // Determine how many images to generate based on journal depth
    const totalAnswers = answeredResponses.length;
    const totalWordCount = answeredResponses.reduce((sum, r) => sum + r.answer.split(/\s+/).length, 0);
    
    // Base: 10 images, up to 15 for rich journals
    let imageCount = 10;
    if (totalAnswers >= 10 && totalWordCount > 200) imageCount = 15;
    else if (totalAnswers >= 7 && totalWordCount > 100) imageCount = 13;
    else if (totalAnswers >= 4) imageCount = 12;
    
    console.log(`[generate-board] Generating ${imageCount} images (${totalAnswers} answers, ${totalWordCount} words)`);

    const hasResponses = totalAnswers > 0;

    const systemPrompt = `You are an expert vision board designer creating deeply personalized, evocative imagery. Your goal is to transform journal reflections into powerful visual metaphors.

CRITICAL RULES FOR IMAGE PROMPTS:
1. NEVER include people, human figures, faces, or body parts
2. Focus on: scenes, objects, nature, textures, atmospheres, symbolic items
3. Convey emotions through environment, lighting, and composition
4. Use metaphors: "achievement" = mountain peak, trophy, sunrise; "peace" = still water, zen garden, soft clouds
5. Be SPECIFIC and DETAILED in descriptions

Return a JSON object:
{
  "themes": [
    {
      "title": "Short theme name (2-3 words)",
      "imagePrompt": "Detailed scene description WITHOUT any people - focus on objects, nature, atmosphere",
      "affirmation": "Personal affirmation using their words/themes",
      "style": "one of: photography, watercolor, abstract, oilpainting, minimalist, impressionist, cinematic, macro, landscape, symbolic, dreamy, vintage",
      "gridSize": "small | medium | large"
    }
  ]
}

STYLE GUIDELINES (vary these across the board for visual interest):
- photography: Real-world scenes, professional quality
- watercolor: Soft, flowing, artistic, emotional
- abstract: Bold shapes, conceptual, modern art
- oilpainting: Rich textures, classical, museum-quality
- minimalist: Clean, simple, zen, negative space
- impressionist: Soft focus, dappled light, dreamy
- cinematic: Dramatic lighting, film-like, widescreen feel
- macro: Extreme close-ups, intricate details, textures
- landscape: Epic vistas, nature, panoramic
- symbolic: Meaningful objects, metaphorical imagery
- dreamy: Ethereal, soft glow, magical atmosphere
- vintage: Nostalgic, film grain, muted tones

IMAGE PROMPT EXAMPLES (no people):
- "achievement" → "Golden trophy on marble pedestal, sunlight streaming through window, dust particles in light, sense of accomplishment"
- "peace" → "Still pond at dawn, single lotus flower, mist rising from water, mountains reflected, zen atmosphere"  
- "growth" → "Seedling pushing through rich dark soil, dewdrops on leaves, soft morning light, macro detail"
- "creativity" → "Artist's palette covered in vibrant paint, scattered brushes, canvas texture, studio window light"
- "connection" → "Two coffee cups on wooden table by window, steam rising, cozy blanket, rain outside"
- "adventure" → "Worn leather hiking boots on mountain trail, map and compass, pine forest backdrop"

GRID SIZE DISTRIBUTION for ${imageCount} images:
- 2-3 "large" (most important themes, year word, primary goals)
- 4-5 "medium" (significant supporting themes)
- Remaining "small" (complementary imagery)

Generate EXACTLY ${imageCount} themes with VARIED styles (use at least 6 different styles).
Extract specific details from the journal and translate them into vivid scene descriptions.`;

    const { text } = await generateText({
      model: xai("grok-3-mini"),
      system: systemPrompt,
      prompt: hasResponses 
        ? `Create a deeply personalized vision board with ${imageCount} images based on these journal reflections. Remember: NO people in any image prompts - only scenes, objects, nature, and atmosphere:\n\n${journalContext}`
        : `Create a beautiful, inspiring vision board with ${imageCount} images for someone beginning their 2026 journey. Themes: new beginnings, self-discovery, growth, peace, creativity, connection, adventure, health, abundance, dreams. Remember: NO people in any image prompts - only scenes, objects, nature, and atmosphere.`,
    });

    console.log("[generate-board] xAI response received");
    
    let boardData;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        boardData = JSON.parse(jsonMatch[0]);
        console.log("[generate-board] Parsed themes:", boardData.themes?.length || 0);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.log("[generate-board] Parse error, using fallback:", parseError);
      // Rich fallback with varied styles and no people
      boardData = {
        themes: [
          {
            title: "New Beginnings",
            imagePrompt: "Majestic sunrise breaking through morning mist over a calm mountain lake, golden light rays streaming through pine trees, reflection on still water, sense of possibility",
            affirmation: "Every sunrise brings new possibilities",
            style: "landscape",
            gridSize: "large",
          },
          {
            title: "Inner Peace",
            imagePrompt: "Zen garden with perfectly raked sand patterns, single smooth stone, cherry blossom petals floating down, soft morning light, tranquil atmosphere",
            affirmation: "I am calm, centered, and at peace",
            style: "minimalist",
            gridSize: "medium",
          },
          {
            title: "Growth",
            imagePrompt: "Tiny seedling pushing through rich dark soil, morning dewdrops on delicate leaves, soft golden backlight, extreme macro detail showing life force",
            affirmation: "I grow stronger each day",
            style: "macro",
            gridSize: "small",
          },
          {
            title: "Creative Flow",
            imagePrompt: "Artist's workspace with vibrant paint splashes on wooden table, scattered brushes in mason jars, half-finished canvas, golden afternoon light through dusty window",
            affirmation: "My creativity flows freely",
            style: "photography",
            gridSize: "medium",
          },
          {
            title: "Connection",
            imagePrompt: "Two steaming coffee cups on rustic wooden table by rain-streaked window, cozy blanket draped on chair, warm candlelight, intimate atmosphere",
            affirmation: "I am surrounded by love",
            style: "cinematic",
            gridSize: "large",
          },
          {
            title: "Adventure",
            imagePrompt: "Winding mountain path disappearing into misty peaks, wildflowers along trail edge, dramatic clouds, sense of journey and discovery",
            affirmation: "Life is an adventure I embrace",
            style: "landscape",
            gridSize: "small",
          },
          {
            title: "Vitality",
            imagePrompt: "Fresh green smoothie in glass jar surrounded by vibrant fruits and vegetables, morning kitchen light, dewdrops on produce, health and energy",
            affirmation: "My body is strong and energized",
            style: "photography",
            gridSize: "medium",
          },
          {
            title: "Abundance",
            imagePrompt: "Overflowing harvest basket with colorful fresh produce, golden wheat field in background, warm sunset light, sense of plenty and gratitude",
            affirmation: "Abundance flows into my life",
            style: "impressionist",
            gridSize: "small",
          },
          {
            title: "Dreams",
            imagePrompt: "Open journal with handwritten goals on wooden desk, golden pen, soft window light, cup of tea, dreamy bokeh background",
            affirmation: "I am creating my dream life",
            style: "dreamy",
            gridSize: "small",
          },
          {
            title: "Clarity",
            imagePrompt: "Crystal clear mountain stream flowing over smooth stones, light refracting through water, forest reflected on surface, pure and serene",
            affirmation: "My mind is clear and focused",
            style: "watercolor",
            gridSize: "medium",
          },
          {
            title: "Courage",
            imagePrompt: "Single lit candle flame in darkness, warm glow illuminating surroundings, sense of hope and bravery, intimate and powerful",
            affirmation: "I have the courage to grow",
            style: "cinematic",
            gridSize: "small",
          },
          {
            title: "Gratitude",
            imagePrompt: "Golden wheat field at sunset, warm light painting the grain, gentle breeze visible in movement, expansive sky, thankfulness",
            affirmation: "I am grateful for this moment",
            style: "vintage",
            gridSize: "small",
          },
        ],
      };
    }

    // Process themes
    let themes = boardData.themes || [];
    
    // Ensure we have enough themes, pad with defaults if needed
    const defaultThemes = [
      { title: "Possibility", imagePrompt: "Vast starry night sky, milky way stretching across darkness, silhouette of mountains, sense of infinite possibility", affirmation: "Anything is possible", style: "landscape", gridSize: "small" },
      { title: "Balance", imagePrompt: "Smooth stones stacked in perfect balance on beach, calm ocean in background, zen meditation concept", affirmation: "I find balance in all things", style: "minimalist", gridSize: "small" },
      { title: "Joy", imagePrompt: "Field of wildflowers in full bloom, butterflies dancing, golden sunlight, pure happiness and freedom", affirmation: "Joy fills my days", style: "impressionist", gridSize: "small" },
      { title: "Focus", imagePrompt: "Single leaf with perfect detail, morning dew drops, soft blurred background, clarity and intention", affirmation: "I am focused and intentional", style: "macro", gridSize: "small" },
      { title: "Serenity", imagePrompt: "Misty forest path at dawn, light filtering through ancient trees, moss-covered stones, peaceful solitude", affirmation: "Peace flows through me", style: "dreamy", gridSize: "small" },
    ];
    
    while (themes.length < imageCount) {
      themes.push(defaultThemes[themes.length % defaultThemes.length]);
    }
    
    // Trim to target count
    themes = themes.slice(0, imageCount);
    
    // Ensure style variety - assign styles if missing or duplicate
    const usedStyles = new Set<string>();
    themes = themes.map((theme: any, index: number) => {
      let style = theme.style;
      
      // If no style or we've used it too many times, pick a new one
      if (!style || !availableStyles.includes(style)) {
        style = availableStyles[index % availableStyles.length];
      }
      
      // Track usage but allow some repeats for larger boards
      usedStyles.add(style);
      
      return { ...theme, style };
    });
    
    // Ensure proper grid size distribution
    const largeCount = Math.min(3, Math.floor(imageCount * 0.2));
    const mediumCount = Math.min(5, Math.floor(imageCount * 0.35));
    
    themes = themes.map((theme: any, index: number) => {
      let gridSize = theme.gridSize;
      
      if (index < largeCount) gridSize = "large";
      else if (index < largeCount + mediumCount) gridSize = "medium";
      else gridSize = "small";
      
      return { ...theme, gridSize };
    });

    // Shuffle to mix sizes throughout the grid (but keep first as large)
    const firstTheme = themes[0];
    const rest = themes.slice(1);
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }
    themes = [firstTheme, ...rest];

    // Convert themes to collage elements
    const elements = themes.map((theme: { 
      title: string; 
      imagePrompt: string; 
      affirmation: string;
      style: string;
      gridSize: string;
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
          style: theme.style,
          title: theme.title,
          affirmation: theme.affirmation,
          gridSize: theme.gridSize,
          personalConnection: theme.personalConnection,
          status: "pending",
        },
      };
    });

    console.log("[generate-board] Generated elements:", elements.length);
    console.log("[generate-board] Styles used:", [...new Set(themes.map((t: any) => t.style))].join(", "));
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
