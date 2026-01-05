import { createXai } from "@ai-sdk/xai";
import { generateText } from "ai";
import { NextResponse } from "next/server";

const xai = createXai({
  apiKey: process.env.XAI_API_KEY,
});

interface ConversationEntry {
  question: string;
  answer: string;
  category?: string;
}

interface CompileProfileRequest {
  responses: ConversationEntry[];
}

export interface UserProfile {
  yearWord: string;
  yearFeeling: string;
  coreValues: string[];
  identityStatements: string[];
  lifeAreas: {
    area: string;
    aspiration: string;
    currentState?: string;
  }[];
  obstacles: {
    obstacle: string;
    strategy?: string;
  }[];
  actionItems: string[];
  emotionalGoals: string[];
  keyThemes: string[];
  personalMantra: string;
  relationships: string[];
  dailyVision: string;
  gratitudes: string[];
  summary: string;
}

export async function POST(request: Request) {
  try {
    const { responses } = (await request.json()) as CompileProfileRequest;
    
    // Build full conversation context
    const conversationContext = responses
      .filter(r => r.answer.trim().length > 0)
      .map((entry, i) => `[${entry.category || 'general'}] Q: ${entry.question}\nA: ${entry.answer}`)
      .join("\n\n");

    const systemPrompt = `You are an expert at synthesizing personal reflections into comprehensive profiles. Your task is to analyze a series of journal responses and extract a detailed profile that can be used to generate a personalized vision board.

JOURNAL RESPONSES:
${conversationContext}

ANALYZE THESE RESPONSES AND EXTRACT:

1. YEAR WORD: What single word or short phrase captures their vision? Look for explicitly stated words or synthesize from themes.

2. YEAR FEELING: How do they want to feel at year end? What emotional state are they seeking?

3. CORE VALUES (3-5): What matters most to them? What won't they compromise on? Look for repeated themes.

4. IDENTITY STATEMENTS: "I am becoming someone who..." statements. How do they see their future self?

5. LIFE AREAS: What specific areas do they want to improve? For each, note their aspiration and current state if mentioned.
   - Career/work
   - Health/fitness
   - Relationships/family
   - Creativity/expression
   - Finances/security
   - Personal growth/learning
   - Joy/fun/adventure

6. OBSTACLES: What fears, blocks, or patterns did they identify? Include any strategies they mentioned.

7. ACTION ITEMS: What specific actions or small steps did they mention wanting to take?

8. EMOTIONAL GOALS: Beyond achievements, what emotional experiences are they seeking?

9. KEY THEMES: What words, metaphors, or images keep appearing? (These are great for visual imagery)

10. PERSONAL MANTRA: What phrase would remind them of their why? Can be extracted or synthesized.

11. RELATIONSHIPS: Who are the important people? What role do connections play in their vision?

12. DAILY VISION: What does their ideal day look like? Morning routines, daily rhythms?

13. GRATITUDES: What do they already appreciate that supports their vision?

14. SUMMARY: A 2-3 sentence narrative summary of their overall vision for the year.

RESPOND WITH JSON:
{
  "yearWord": "string - their core word or theme",
  "yearFeeling": "string - how they want to feel",
  "coreValues": ["array of 3-5 values"],
  "identityStatements": ["array of identity statements"],
  "lifeAreas": [
    { "area": "name", "aspiration": "what they want", "currentState": "where they are now if mentioned" }
  ],
  "obstacles": [
    { "obstacle": "the challenge", "strategy": "how they plan to address it if mentioned" }
  ],
  "actionItems": ["specific actions they want to take"],
  "emotionalGoals": ["emotional states they're seeking"],
  "keyThemes": ["recurring themes, metaphors, imagery"],
  "personalMantra": "their reminder phrase",
  "relationships": ["key relationships and their role"],
  "dailyVision": "description of their ideal day",
  "gratitudes": ["things they're grateful for"],
  "summary": "2-3 sentence summary"
}

Be comprehensive but accurate - only include what's actually present or clearly implied in their responses. Don't invent details they didn't share.`;

    const { text } = await generateText({
      model: xai("grok-3-mini"),
      system: systemPrompt,
      prompt: "Analyze the journal responses and create a comprehensive user profile for vision board generation.",
    });

    // Parse the response
    let profile: UserProfile;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        profile = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch (parseError) {
      // Create a basic profile from responses
      profile = createBasicProfile(responses);
    }

    // Validate and fill in any missing fields
    profile = validateProfile(profile);

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error("[compile-profile] Error:", error);
    return NextResponse.json(
      { error: "Failed to compile profile", details: String(error) },
      { status: 500 }
    );
  }
}

function createBasicProfile(responses: ConversationEntry[]): UserProfile {
  // Extract basic info from responses
  const answers = responses.filter(r => r.answer.trim().length > 0);
  const allText = answers.map(r => r.answer).join(" ");
  
  return {
    yearWord: "Growth",
    yearFeeling: answers.find(r => r.category === "year")?.answer.substring(0, 100) || "Fulfilled and proud",
    coreValues: ["growth", "authenticity", "connection"],
    identityStatements: answers.filter(r => r.category === "identity").map(r => r.answer.substring(0, 200)),
    lifeAreas: answers.filter(r => r.category === "life-areas").map(r => ({
      area: "personal growth",
      aspiration: r.answer.substring(0, 200)
    })),
    obstacles: answers.filter(r => r.category === "obstacles").map(r => ({
      obstacle: r.answer.substring(0, 200)
    })),
    actionItems: answers.filter(r => r.category === "closing").map(r => r.answer.substring(0, 200)),
    emotionalGoals: ["peace", "joy", "fulfillment"],
    keyThemes: extractKeywords(allText),
    personalMantra: "I am becoming who I'm meant to be",
    relationships: [],
    dailyVision: "",
    gratitudes: [],
    summary: `This person is focused on personal transformation in 2026, with ${answers.length} reflections guiding their vision.`
  };
}

function extractKeywords(text: string): string[] {
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'i', 'me', 'my', 'myself', 'we', 'our', 'you', 'your', 'it', 'its', 'this', 'that', 'these', 'those', 'what', 'which', 'who', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'not', 'only', 'same', 'so', 'than', 'too', 'very', 'just', 'can', 'now', 'want', 'feel', 'like', 'really', 'also', 'much', 'many', 'one', 'two', 'three', 'year', 'time', 'way', 'day', 'life', 'things', 'thing', 'make', 'get', 'go', 'see', 'know', 'think', 'take', 'come', 'into', 'about', 'more', 'out', 'up']);
  
  const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 3 && !commonWords.has(w));
  const freq: Record<string, number> = {};
  words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
  
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

function validateProfile(profile: UserProfile): UserProfile {
  return {
    yearWord: profile.yearWord || "Growth",
    yearFeeling: profile.yearFeeling || "Fulfilled",
    coreValues: profile.coreValues?.length ? profile.coreValues : ["growth", "authenticity"],
    identityStatements: profile.identityStatements || [],
    lifeAreas: profile.lifeAreas || [],
    obstacles: profile.obstacles || [],
    actionItems: profile.actionItems || [],
    emotionalGoals: profile.emotionalGoals?.length ? profile.emotionalGoals : ["peace", "joy"],
    keyThemes: profile.keyThemes?.length ? profile.keyThemes : ["transformation", "growth"],
    personalMantra: profile.personalMantra || "I am becoming who I'm meant to be",
    relationships: profile.relationships || [],
    dailyVision: profile.dailyVision || "",
    gratitudes: profile.gratitudes || [],
    summary: profile.summary || "A personal vision focused on growth and transformation."
  };
}
