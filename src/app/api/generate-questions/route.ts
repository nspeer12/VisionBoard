import { createXai } from "@ai-sdk/xai";
import { generateText } from "ai";
import { NextResponse } from "next/server";

const xai = createXai({
  apiKey: process.env.XAI_API_KEY,
});

interface ConversationEntry {
  question: string;
  answer: string;
}

interface GenerateQuestionsRequest {
  conversationHistory: ConversationEntry[];
  batchNumber: number;
  batchSize: number;
}

export async function POST(request: Request) {
  try {
    const { conversationHistory, batchNumber, batchSize } = 
      (await request.json()) as GenerateQuestionsRequest;
    
    // Build context from conversation
    const conversationContext = conversationHistory
      .map((entry, i) => `Q${i + 1}: ${entry.question}\nA${i + 1}: ${entry.answer}`)
      .join("\n\n");

    // Analyze what areas have been covered
    const totalQuestions = conversationHistory.length;
    
    const systemPrompt = `You are a thoughtful, empathetic guide helping someone create their vision for 2026. Generate a batch of ${batchSize} deeply personal questions that will help them clarify their dreams, values, and intentions.

CONVERSATION SO FAR:
${conversationContext || "This is the beginning of the conversation."}

BATCH NUMBER: ${batchNumber} (generating questions ${totalQuestions + 1} to ${totalQuestions + batchSize})

YOUR TASK: Generate exactly ${batchSize} questions that form a cohesive set, building on what they've shared.

GUIDELINES FOR THE BATCH:
1. Each question should build on previous answers - reference their specific words and themes
2. The batch should feel like a natural progression, not random questions
3. Mix exploration (going deeper into themes) with discovery (finding new aspects)
4. Include at least one question about potential obstacles or challenges
5. Include at least one actionable/forward-looking question

QUESTION TYPES TO INCLUDE IN THIS BATCH:
${batchNumber === 1 ? `
- VALUES: What matters most? What won't they compromise on?
- LIFE AREAS: Specific aspects of career, health, relationships, creativity, joy
- OBSTACLES: Inner blocks, fears, patterns to break
- IDENTITY: Deeper exploration of who they're becoming
` : batchNumber === 2 ? `
- OBSTACLES: What gets in their way? What patterns need to change?
- RELATIONSHIPS: How do connections with others fit into their vision?
- DAILY LIFE: What would their ideal day look like?
- RESILIENCE: What will keep them going when things get hard?
` : `
- CLOSING: Small actionable steps they can take
- COMMITMENT: What they're willing to do differently
- REMINDER: What they want to remember
- GRATITUDE: What they already have that supports their vision
`}

PSYCHOLOGY TECHNIQUES TO WEAVE IN:
- Future self visualization
- Mental contrasting (pair dreams with realistic obstacles)
- Implementation intentions (if-then planning)
- Identity-based goals (who they're becoming)
- Self-compassion (gentle, non-judgmental framing)

RESPOND WITH JSON ARRAY:
{
  "questions": [
    {
      "question": "Your thoughtful question",
      "subtext": "Brief context (1 sentence, can be empty)",
      "category": "values | identity | life-areas | obstacles | closing",
      "psychologyTechnique": "optional technique name"
    }
  ]
}

Make each question feel connected to the previous one, creating a natural flow. Questions should be warm and conversational, not clinical.`;

    const { text } = await generateText({
      model: xai("grok-3-mini"),
      system: systemPrompt,
      prompt: `Based on their reflections so far, generate ${batchSize} perfect follow-up questions that will deepen their vision for 2026.`,
    });

    // Parse the response
    let questionsData;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        questionsData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch (parseError) {
      // Fallback questions
      questionsData = {
        questions: getFallbackQuestions(batchNumber, batchSize)
      };
    }

    // Ensure we have the right number of questions
    let questions = questionsData.questions || [];
    if (questions.length < batchSize) {
      const fallbacks = getFallbackQuestions(batchNumber, batchSize);
      while (questions.length < batchSize) {
        questions.push(fallbacks[questions.length % fallbacks.length]);
      }
    }
    questions = questions.slice(0, batchSize);

    return NextResponse.json({
      success: true,
      questions,
    });
  } catch (error) {
    console.error("[generate-questions] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate questions", details: String(error) },
      { status: 500 }
    );
  }
}

function getFallbackQuestions(batchNumber: number, count: number) {
  const allFallbacks = [
    // Batch 1 fallbacks
    [
      {
        question: "When you're at your best, what values are you living by?",
        subtext: "Think of a moment when you felt truly aligned with yourself.",
        category: "values",
        psychologyTechnique: "Self-determination"
      },
      {
        question: "What brings you pure, uncomplicated joy?",
        subtext: "The small things, the big things — what makes you come alive?",
        category: "life-areas",
        psychologyTechnique: "Positive psychology"
      },
      {
        question: "What's the inner obstacle that usually holds you back?",
        subtext: "Fear, perfectionism, self-doubt — name it without judgment.",
        category: "obstacles",
        psychologyTechnique: "Mental contrasting"
      },
      {
        question: "If nothing could stop you, what would you create or achieve this year?",
        subtext: "Dream boldly for a moment.",
        category: "identity",
        psychologyTechnique: "Future self visualization"
      },
    ],
    // Batch 2 fallbacks
    [
      {
        question: "When that obstacle shows up, what will you do instead?",
        subtext: "Create an 'if-then' plan for when things get hard.",
        category: "obstacles",
        psychologyTechnique: "Implementation intentions"
      },
      {
        question: "Who are the people that support your growth?",
        subtext: "Think about who you want to spend more time with this year.",
        category: "life-areas",
        psychologyTechnique: "Social support"
      },
      {
        question: "What does your ideal morning look like in 2026?",
        subtext: "Paint a vivid picture of how your day begins.",
        category: "identity",
        psychologyTechnique: "Future self visualization"
      },
      {
        question: "What will keep you going when motivation fades?",
        subtext: "Think about your deeper 'why'.",
        category: "values",
        psychologyTechnique: "Intrinsic motivation"
      },
    ],
    // Batch 3+ fallbacks
    [
      {
        question: "What's the smallest action you could take this week toward your vision?",
        subtext: "Not the big goal — the tiniest step you could actually do tomorrow.",
        category: "closing",
        psychologyTechnique: "Minimum viable action"
      },
      {
        question: "What do you want to remember when things get hard?",
        subtext: "A mantra, a truth, a reason to keep going.",
        category: "closing",
        psychologyTechnique: "Self-compassion anchor"
      },
      {
        question: "What are you already grateful for that supports this vision?",
        subtext: "Sometimes what we need is already present in our lives.",
        category: "values",
        psychologyTechnique: "Gratitude practice"
      },
      {
        question: "What are you ready to let go of to make room for growth?",
        subtext: "Sometimes progress requires releasing something first.",
        category: "obstacles",
        psychologyTechnique: "Mental contrasting"
      },
    ],
  ];

  const batchIndex = Math.min(batchNumber - 1, allFallbacks.length - 1);
  return allFallbacks[batchIndex].slice(0, count);
}
