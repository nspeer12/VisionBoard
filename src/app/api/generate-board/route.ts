import { createXai } from "@ai-sdk/xai";
import { generateText } from "ai";
import { NextResponse } from "next/server";
import type { JournalResponse } from "@/lib/storage/db";
import type { UserProfile } from "../compile-profile/route";

const xai = createXai({
  apiKey: process.env.XAI_API_KEY,
});

interface GenerateBoardRequest {
  journalId: string;
  responses: JournalResponse[];
  profile?: UserProfile;
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
    const { responses, profile } = (await request.json()) as GenerateBoardRequest;
    console.log("[generate-board] Responses count:", responses.length);
    console.log("[generate-board] Has profile:", !!profile);

    // Build rich context - prefer profile if available, fall back to raw responses
    const answeredResponses = responses.filter(r => r.answer.trim().length > 0);
    
    let contextForAI: string;
    
    if (profile) {
      // Use compiled profile for richer context
      contextForAI = buildProfileContext(profile);
    } else {
      // Fall back to raw journal responses
      contextForAI = answeredResponses
        .map((r) => `Q: ${r.question}\nA: ${r.answer}`)
        .join("\n\n");
    }

    // Determine how many images to generate based on journal depth
    const totalAnswers = answeredResponses.length;
    const totalWordCount = answeredResponses.reduce((sum, r) => sum + r.answer.split(/\s+/).length, 0);
    
    // Base: 10 images, up to 15 for rich journals
    let imageCount = 10;
    if (totalAnswers >= 10 && totalWordCount > 200) imageCount = 15;
    else if (totalAnswers >= 7 && totalWordCount > 100) imageCount = 13;
    else if (totalAnswers >= 4) imageCount = 12;
    
    console.log(`[generate-board] Generating ${imageCount} images (${totalAnswers} answers, ${totalWordCount} words)`);

    const systemPrompt = buildSystemPrompt(imageCount, profile);

    const { text } = await generateText({
      model: xai("grok-3-mini"),
      system: systemPrompt,
      prompt: `Create a deeply personalized vision board with ${imageCount} images based on this vision:

${contextForAI}

Remember: NO people in any image prompts - only scenes, objects, nature, and atmosphere. Make each image personally meaningful to their specific vision.`,
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
      boardData = { themes: getDefaultThemes(profile) };
    }

    // Process themes
    let themes = boardData.themes || [];
    
    // Ensure we have enough themes
    const defaultThemes = getDefaultThemes(profile);
    while (themes.length < imageCount) {
      themes.push(defaultThemes[themes.length % defaultThemes.length]);
    }
    themes = themes.slice(0, imageCount);
    
    // Ensure style variety
    themes = themes.map((theme: any, index: number) => {
      let style = theme.style;
      if (!style || !availableStyles.includes(style)) {
        style = availableStyles[index % availableStyles.length];
      }
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

    // Shuffle to mix sizes (keep first as large)
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

function buildProfileContext(profile: UserProfile): string {
  const sections = [];
  
  sections.push(`YEAR THEME: "${profile.yearWord}"`);
  sections.push(`DESIRED FEELING: ${profile.yearFeeling}`);
  
  if (profile.coreValues.length > 0) {
    sections.push(`CORE VALUES: ${profile.coreValues.join(", ")}`);
  }
  
  if (profile.identityStatements.length > 0) {
    sections.push(`IDENTITY VISION:\n${profile.identityStatements.map(s => `- ${s}`).join("\n")}`);
  }
  
  if (profile.lifeAreas.length > 0) {
    sections.push(`LIFE AREAS TO TRANSFORM:\n${profile.lifeAreas.map(a => 
      `- ${a.area}: ${a.aspiration}${a.currentState ? ` (from: ${a.currentState})` : ""}`
    ).join("\n")}`);
  }
  
  if (profile.obstacles.length > 0) {
    sections.push(`OBSTACLES TO OVERCOME:\n${profile.obstacles.map(o => 
      `- ${o.obstacle}${o.strategy ? ` → Strategy: ${o.strategy}` : ""}`
    ).join("\n")}`);
  }
  
  if (profile.emotionalGoals.length > 0) {
    sections.push(`EMOTIONAL GOALS: ${profile.emotionalGoals.join(", ")}`);
  }
  
  if (profile.keyThemes.length > 0) {
    sections.push(`KEY THEMES & IMAGERY: ${profile.keyThemes.join(", ")}`);
  }
  
  if (profile.personalMantra) {
    sections.push(`PERSONAL MANTRA: "${profile.personalMantra}"`);
  }
  
  if (profile.dailyVision) {
    sections.push(`IDEAL DAY VISION: ${profile.dailyVision}`);
  }
  
  if (profile.relationships.length > 0) {
    sections.push(`IMPORTANT RELATIONSHIPS: ${profile.relationships.join(", ")}`);
  }
  
  if (profile.actionItems.length > 0) {
    sections.push(`ACTION COMMITMENTS:\n${profile.actionItems.map(a => `- ${a}`).join("\n")}`);
  }
  
  if (profile.gratitudes.length > 0) {
    sections.push(`GRATITUDES: ${profile.gratitudes.join(", ")}`);
  }
  
  sections.push(`SUMMARY: ${profile.summary}`);
  
  return sections.join("\n\n");
}

function buildSystemPrompt(imageCount: number, profile?: UserProfile): string {
  const yearWord = profile?.yearWord || "transformation";
  const keyThemes = profile?.keyThemes?.join(", ") || "growth, peace, abundance";
  
  return `You are an expert vision board designer creating deeply personalized, evocative imagery. Your goal is to transform personal reflections into powerful visual metaphors.

CRITICAL RULES FOR IMAGE PROMPTS:
1. NEVER include people, human figures, faces, or body parts
2. Focus on: scenes, objects, nature, textures, atmospheres, symbolic items
3. Convey emotions through environment, lighting, and composition
4. Use metaphors and symbolism that directly connect to their specific vision
5. Be SPECIFIC and DETAILED in descriptions

PERSONALIZATION PRIORITIES:
- The first image MUST represent their year word: "${yearWord}"
- Include imagery that connects to their specific themes: ${keyThemes}
- Each affirmation should feel personal, not generic
- Connect obstacles to overcoming imagery (e.g., breaking through, rising above)
- Include actionable, forward-momentum imagery

Return a JSON object:
{
  "themes": [
    {
      "title": "Short theme name (2-3 words)",
      "imagePrompt": "Detailed scene description WITHOUT any people",
      "affirmation": "Personal affirmation using THEIR words/themes",
      "style": "photography | watercolor | abstract | oilpainting | minimalist | impressionist | cinematic | macro | landscape | symbolic | dreamy | vintage",
      "gridSize": "small | medium | large",
      "personalConnection": "Brief note on why this connects to their vision"
    }
  ]
}

STYLE DISTRIBUTION (vary for visual interest):
- photography: Real-world scenes
- watercolor: Soft, emotional
- abstract: Bold, conceptual
- oilpainting: Rich textures
- minimalist: Clean, zen
- impressionist: Soft, dreamy
- cinematic: Dramatic
- macro: Intricate details
- landscape: Epic vistas
- symbolic: Metaphorical
- dreamy: Ethereal
- vintage: Nostalgic

GRID SIZE DISTRIBUTION for ${imageCount} images:
- 2-3 "large" (year word, most important themes)
- 4-5 "medium" (significant themes)
- Remaining "small" (supporting imagery)

Generate EXACTLY ${imageCount} themes with VARIED styles (use at least 6 different styles).
Make EVERY image personally meaningful - no generic "inspiration" imagery.`;
}

function getDefaultThemes(profile?: UserProfile) {
  const yearWord = profile?.yearWord || "Growth";
  
  return [
    {
      title: yearWord,
      imagePrompt: `Majestic sunrise breaking through morning mist over a calm mountain lake, golden light rays streaming through pine trees, reflection on still water, sense of ${yearWord.toLowerCase()} and possibility`,
      affirmation: `I embrace ${yearWord.toLowerCase()} in all I do`,
      style: "landscape",
      gridSize: "large",
      personalConnection: "Year theme anchor"
    },
    {
      title: "Inner Peace",
      imagePrompt: "Zen garden with perfectly raked sand patterns, single smooth stone, cherry blossom petals floating down, soft morning light, tranquil atmosphere",
      affirmation: "I am calm, centered, and at peace",
      style: "minimalist",
      gridSize: "medium",
    },
    {
      title: "Rising Strong",
      imagePrompt: "Single green shoot breaking through cracked dry earth, morning dew on leaves, soft golden backlight, determination and resilience",
      affirmation: "I rise above every challenge",
      style: "macro",
      gridSize: "medium",
    },
    {
      title: "Creative Flow",
      imagePrompt: "Artist's workspace with vibrant paint splashes on wooden table, scattered brushes in mason jars, half-finished canvas, golden afternoon light through dusty window",
      affirmation: "My creativity flows freely",
      style: "photography",
      gridSize: "small",
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
    {
      title: "Balance",
      imagePrompt: "Smooth stones stacked in perfect balance on beach, calm ocean in background, zen meditation concept, harmony",
      affirmation: "I find balance in all things",
      style: "minimalist",
      gridSize: "small",
    },
    {
      title: "Focus",
      imagePrompt: "Single leaf with perfect detail, morning dew drops, soft blurred background, clarity and intention",
      affirmation: "I am focused and intentional",
      style: "macro",
      gridSize: "small",
    },
    {
      title: "Serenity",
      imagePrompt: "Misty forest path at dawn, light filtering through ancient trees, moss-covered stones, peaceful solitude",
      affirmation: "Peace flows through me",
      style: "dreamy",
      gridSize: "small",
    },
  ];
}
