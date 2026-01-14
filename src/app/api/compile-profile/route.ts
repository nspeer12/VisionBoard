import { createXai } from "@ai-sdk/xai";
import { generateText } from "ai";
import { NextResponse } from "next/server";

const xai = createXai({
  apiKey: process.env.XAI_API_KEY,
});

interface ConversationEntry {
  question: string;
  answer: string;
  phase?: string;
}

interface CompileProfileRequest {
  responses: ConversationEntry[];
}

export interface UserProfile {
  // Core vision elements
  antiVisionStatement: string;
  visionStatement: string;
  identityStatement: string;
  
  // Excavation insights
  dissatisfactions: string[];
  patternsThatKeepYouStuck: string[];
  whatYoureProtecting: string;
  embarrassingTruth: string;
  
  // Anti-vision details
  antiVisionScenario: string;
  identityToGiveUp: string;
  
  // Vision details
  dreamTuesday: string;
  beliefRequired: string;
  
  // Game plan
  oneYearGoal: string;
  oneMonthGoal: string;
  dailyActions: string[];
  constraints: string[];
  
  // Synthesis
  theRealEnemy: string;
  keyInsight: string;
  summary: string;
  
  // For board generation
  keyThemes: string[];
  emotionalGoals: string[];
  visualMetaphors: string[];
}

export async function POST(request: Request) {
  try {
    const { responses } = (await request.json()) as CompileProfileRequest;
    
    // Build full conversation context grouped by phase
    const phaseGroups: Record<string, ConversationEntry[]> = {};
    responses
      .filter(r => r.answer.trim().length > 0)
      .forEach(entry => {
        const phase = entry.phase || "general";
        if (!phaseGroups[phase]) phaseGroups[phase] = [];
        phaseGroups[phase].push(entry);
      });

    const conversationContext = Object.entries(phaseGroups)
      .map(([phase, entries]) => {
        const phaseHeader = `=== ${phase.toUpperCase()} PHASE ===`;
        const phaseContent = entries
          .map(entry => `Q: ${entry.question}\nA: ${entry.answer}`)
          .join("\n\n");
        return `${phaseHeader}\n${phaseContent}`;
      })
      .join("\n\n");

    const systemPrompt = `You are an expert at synthesizing deep psychological excavation into actionable profiles. This person has gone through the Dan Koe protocol - a rigorous process of uncovering their hidden patterns, creating an anti-vision (the life they refuse), and building a vision for transformation.

JOURNAL RESPONSES:
${conversationContext}

ANALYZE THESE RESPONSES AND EXTRACT:

=== CORE VISION ELEMENTS ===
1. ANTI-VISION STATEMENT: Their compressed sentence about what they refuse to become
2. VISION STATEMENT: Their compressed sentence about what they're building toward
3. IDENTITY STATEMENT: "I am the type of person who..." - their future self identity

=== EXCAVATION INSIGHTS ===
4. DISSATISFACTIONS: What they've been tolerating (list)
5. PATTERNS THAT KEEP THEM STUCK: The recurring behaviors/beliefs that hold them back
6. WHAT THEY'RE PROTECTING: What their current behavior is shielding them from
7. EMBARRASSING TRUTH: The uncomfortable reason they haven't changed

=== ANTI-VISION DETAILS ===
8. ANTI-VISION SCENARIO: Their detailed description of the life they refuse (the bad Tuesday)
9. IDENTITY TO GIVE UP: Who they'd have to stop being to change

=== VISION DETAILS ===
10. DREAM TUESDAY: Their ideal day in their transformed life
11. BELIEF REQUIRED: What they'd have to believe about themselves for this life to feel natural

=== GAME PLAN ===
12. ONE YEAR GOAL: Their concrete one-year milestone
13. ONE MONTH GOAL: Their one-month checkpoint
14. DAILY ACTIONS: The 2-3 things they'll do daily (list)
15. CONSTRAINTS: What they won't sacrifice (list)

=== SYNTHESIS ===
16. THE REAL ENEMY: The internal pattern/belief running the show (not circumstances)
17. KEY INSIGHT: The most important realization from this process
18. SUMMARY: 2-3 sentence narrative of their transformation journey

=== FOR VISUAL BOARD GENERATION ===
19. KEY THEMES: Recurring words, metaphors, imagery that could be visualized
20. EMOTIONAL GOALS: The feelings they're seeking (for mood/aesthetic)
21. VISUAL METAPHORS: Concrete images, scenes, or symbols that represent their vision

RESPOND WITH JSON:
{
  "antiVisionStatement": "what they refuse to become",
  "visionStatement": "what they're building toward",
  "identityStatement": "I am the type of person who...",
  "dissatisfactions": ["things they've been tolerating"],
  "patternsThatKeepYouStuck": ["recurring blocks"],
  "whatYoureProtecting": "what their behavior shields",
  "embarrassingTruth": "the uncomfortable reason",
  "antiVisionScenario": "detailed bad future",
  "identityToGiveUp": "who they'd stop being",
  "dreamTuesday": "their ideal day",
  "beliefRequired": "what they'd have to believe",
  "oneYearGoal": "concrete 1-year milestone",
  "oneMonthGoal": "1-month checkpoint",
  "dailyActions": ["daily actions"],
  "constraints": ["what they won't sacrifice"],
  "theRealEnemy": "the internal pattern",
  "keyInsight": "most important realization",
  "summary": "transformation narrative",
  "keyThemes": ["themes for imagery"],
  "emotionalGoals": ["feelings they seek"],
  "visualMetaphors": ["concrete images/symbols"]
}

Extract accurately from their words. If something wasn't explicitly stated, make reasonable inferences but mark them as such in the summary.`;

    const { text } = await generateText({
      model: xai("grok-3-mini"),
      system: systemPrompt,
      prompt: "Analyze the excavation responses and create a comprehensive transformation profile.",
    });

    let profile: UserProfile;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        profile = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch (parseError) {
      profile = createBasicProfile(responses);
    }

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
  const answers = responses.filter(r => r.answer.trim().length > 0);
  const allText = answers.map(r => r.answer).join(" ");
  
  const excavation = answers.filter(r => r.phase === "excavation");
  const antiVision = answers.filter(r => r.phase === "anti-vision");
  const vision = answers.filter(r => r.phase === "vision");
  const synthesis = answers.filter(r => r.phase === "synthesis");
  const gamePlan = answers.filter(r => r.phase === "game-plan");
  
  return {
    antiVisionStatement: synthesis.find(r => r.question.includes("refuse"))?.answer || "I refuse to stay stuck in patterns that don't serve me",
    visionStatement: synthesis.find(r => r.question.includes("building toward"))?.answer || "I am building toward a life of purpose and meaning",
    identityStatement: vision.find(r => r.question.includes("type of person"))?.answer || "I am the type of person who takes action despite fear",
    dissatisfactions: excavation.filter(r => r.question.includes("dissatisfaction") || r.question.includes("tolerate")).map(r => r.answer.substring(0, 200)),
    patternsThatKeepYouStuck: [synthesis.find(r => r.question.includes("stuck"))?.answer || ""].filter(Boolean),
    whatYoureProtecting: antiVision.find(r => r.question.includes("protecting"))?.answer || "",
    embarrassingTruth: antiVision.find(r => r.question.includes("embarrassing"))?.answer || "",
    antiVisionScenario: antiVision.find(r => r.question.includes("five years") || r.question.includes("Tuesday"))?.answer || "",
    identityToGiveUp: antiVision.find(r => r.question.includes("give up"))?.answer || "",
    dreamTuesday: vision.find(r => r.question.includes("Tuesday") || r.question.includes("snap your fingers"))?.answer || "",
    beliefRequired: vision.find(r => r.question.includes("believe"))?.answer || "",
    oneYearGoal: gamePlan.find(r => r.question.includes("One-year") || r.question.includes("one year"))?.answer || "",
    oneMonthGoal: gamePlan.find(r => r.question.includes("One-month") || r.question.includes("one month"))?.answer || "",
    dailyActions: gamePlan.find(r => r.question.includes("Daily") || r.question.includes("tomorrow"))?.answer.split(/[,\n]/).map(s => s.trim()).filter(Boolean) || [],
    constraints: gamePlan.find(r => r.question.includes("sacrifice"))?.answer.split(/[,\n]/).map(s => s.trim()).filter(Boolean) || [],
    theRealEnemy: synthesis.find(r => r.question.includes("enemy"))?.answer || "",
    keyInsight: synthesis.find(r => r.question.includes("true"))?.answer || "",
    summary: `This person is undergoing transformation with ${answers.length} deep reflections guiding their journey.`,
    keyThemes: extractKeywords(allText),
    emotionalGoals: ["freedom", "authenticity", "aliveness"],
    visualMetaphors: ["breaking chains", "new dawn", "open road"],
  };
}

function extractKeywords(text: string): string[] {
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'i', 'me', 'my', 'myself', 'we', 'our', 'you', 'your', 'it', 'its', 'this', 'that', 'these', 'those', 'what', 'which', 'who', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'not', 'only', 'same', 'so', 'than', 'too', 'very', 'just', 'can', 'now', 'want', 'feel', 'like', 'really', 'also', 'much', 'many', 'one', 'two', 'three', 'year', 'time', 'way', 'day', 'life', 'things', 'thing', 'make', 'get', 'go', 'see', 'know', 'think', 'take', 'come', 'into', 'about', 'more', 'out', 'up', 'dont', "don't", 'been', 'being', 'myself', 'something', 'because', 'someone', 'people']);
  
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
    antiVisionStatement: profile.antiVisionStatement || "I refuse to stay stuck",
    visionStatement: profile.visionStatement || "I am building toward freedom",
    identityStatement: profile.identityStatement || "I am the type of person who takes action",
    dissatisfactions: profile.dissatisfactions?.length ? profile.dissatisfactions : [],
    patternsThatKeepYouStuck: profile.patternsThatKeepYouStuck?.length ? profile.patternsThatKeepYouStuck : [],
    whatYoureProtecting: profile.whatYoureProtecting || "",
    embarrassingTruth: profile.embarrassingTruth || "",
    antiVisionScenario: profile.antiVisionScenario || "",
    identityToGiveUp: profile.identityToGiveUp || "",
    dreamTuesday: profile.dreamTuesday || "",
    beliefRequired: profile.beliefRequired || "",
    oneYearGoal: profile.oneYearGoal || "",
    oneMonthGoal: profile.oneMonthGoal || "",
    dailyActions: profile.dailyActions?.length ? profile.dailyActions : [],
    constraints: profile.constraints?.length ? profile.constraints : [],
    theRealEnemy: profile.theRealEnemy || "",
    keyInsight: profile.keyInsight || "",
    summary: profile.summary || "A journey of transformation.",
    keyThemes: profile.keyThemes?.length ? profile.keyThemes : ["transformation", "freedom"],
    emotionalGoals: profile.emotionalGoals?.length ? profile.emotionalGoals : ["peace", "aliveness"],
    visualMetaphors: profile.visualMetaphors?.length ? profile.visualMetaphors : ["new dawn", "open road"],
  };
}
