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
    
    const conversationContext = conversationHistory
      .map((entry, i) => `Q${i + 1}: ${entry.question}\nA${i + 1}: ${entry.answer}`)
      .join("\n\n");

    const totalQuestions = conversationHistory.length;
    
    const systemPrompt = `You are a thoughtful guide helping someone through deep psychological excavation. They've been working through the Dan Koe protocol - uncovering hidden patterns, confronting uncomfortable truths, and building a vision for transformation.

=== FULL CONVERSATION HISTORY (${totalQuestions} questions answered) ===
${conversationContext || "This is the beginning of the conversation."}
=== END CONVERSATION ===

BATCH NUMBER: ${batchNumber}

YOUR TASK: Generate exactly ${batchSize} NEW questions that go DEEPER into their psyche. These should feel like a therapist or wise friend who truly listened and is now probing further.

KEY PRINCIPLES:
1. BUILD ON WHAT THEY'VE REVEALED - Reference their specific words, patterns, and admissions
2. DON'T LET THEM OFF EASY - If they gave a surface-level answer, dig deeper
3. EXPLORE CONTRADICTIONS - Point out tensions between what they say they want and what they're doing
4. MAKE THEM UNCOMFORTABLE (compassionately) - Real change requires confronting truth
5. CONNECT THE DOTS - Help them see how different parts of their excavation relate

PHASES TO EXPLORE (based on what's been covered):
- EXCAVATION: What they're tolerating, complaints vs actions, unbearable truths
- ANTI-VISION: The life they refuse, what it would cost, who they'd become
- VISION: What they actually want, who they'd have to become
- SYNTHESIS: The real enemy, the pattern, the compressed truth
- GAME-PLAN: One-year, one-month, daily actions, constraints

QUESTION STYLES:
- "You said X, but your behavior suggests Y. What's really going on?"
- "When you think about [their specific fear], what does that feel like in your body?"
- "What's the story you tell yourself to justify [their pattern]?"
- "If you achieved [their goal], what would you be afraid of losing?"
- "What would [person they respect] say if they saw how you've been living?"

RESPOND WITH JSON:
{
  "questions": [
    {
      "question": "Your probing, personalized question",
      "subtext": "Brief framing that shows you understood their previous answer",
      "phase": "excavation | anti-vision | vision | synthesis | game-plan",
      "psychologyTechnique": "technique name"
    }
  ]
}

Questions should be direct, sometimes uncomfortable, but ultimately compassionate. The goal is breakthrough, not comfort.`;

    const { text } = await generateText({
      model: xai("grok-3-mini"),
      system: systemPrompt,
      prompt: `Based on their ${totalQuestions} responses so far, generate ${batchSize} deeper follow-up questions that push them toward genuine insight. Don't let them stay in the comfortable zone.`,
    });

    let questionsData;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        questionsData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch (parseError) {
      questionsData = {
        questions: getFallbackQuestions(batchNumber, batchSize)
      };
    }

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
    // Batch 1: Deeper excavation
    [
      {
        question: "You've named what you're tolerating. Now—why are you okay with that? What does staying stuck give you?",
        subtext: "There's always a payoff, even in suffering.",
        phase: "excavation",
        psychologyTechnique: "Secondary gain analysis"
      },
      {
        question: "When you imagine actually changing, what's the first objection your mind raises?",
        subtext: "That voice has been protecting something.",
        phase: "excavation",
        psychologyTechnique: "Resistance mapping"
      },
      {
        question: "Who would be disappointed, threatened, or confused if you actually became the person you want to be?",
        subtext: "Sometimes we stay small to keep others comfortable.",
        phase: "anti-vision",
        psychologyTechnique: "Social constraint awareness"
      },
      {
        question: "What's the difference between who you are when you're alone versus who you present to others?",
        subtext: "The gap between these two is where change happens.",
        phase: "excavation",
        psychologyTechnique: "Authentic self exploration"
      },
      {
        question: "If you were coaching someone with your exact patterns, what would you tell them that you won't tell yourself?",
        subtext: "We're often kinder to others than ourselves.",
        phase: "synthesis",
        psychologyTechnique: "Self-distancing"
      },
    ],
    // Batch 2: Confronting the anti-vision
    [
      {
        question: "What's the most painful part of the anti-vision you described? Sit with it for a moment.",
        subtext: "Don't rush past the discomfort.",
        phase: "anti-vision",
        psychologyTechnique: "Negative visualization"
      },
      {
        question: "The identity you said you'd have to give up—what part of you is terrified of letting go?",
        subtext: "Even limiting identities feel safe.",
        phase: "anti-vision",
        psychologyTechnique: "Identity attachment"
      },
      {
        question: "What would your younger self think if they could see where you are now?",
        subtext: "Sometimes we need to remember what we once hoped for.",
        phase: "excavation",
        psychologyTechnique: "Temporal self-compassion"
      },
      {
        question: "The 'enemy' you named—when did you first start believing that pattern was necessary?",
        subtext: "Most patterns started as survival strategies.",
        phase: "synthesis",
        psychologyTechnique: "Origin story"
      },
      {
        question: "If you fail at this transformation attempt, what story will you tell yourself? And is that story already running?",
        subtext: "Name the sabotage before it happens.",
        phase: "synthesis",
        psychologyTechnique: "Preemptive excuse awareness"
      },
    ],
    // Batch 3: Building conviction
    [
      {
        question: "What would make this vision feel like a MUST rather than a 'should'?",
        subtext: "Until it's a must, it's negotiable.",
        phase: "vision",
        psychologyTechnique: "Motivation elevation"
      },
      {
        question: "The daily actions you listed—be honest, how many days in a row could you actually do them before old patterns kick in?",
        subtext: "Awareness of your limits is the start of breaking them.",
        phase: "game-plan",
        psychologyTechnique: "Realistic assessment"
      },
      {
        question: "What's the ONE thing, if you did it consistently for 30 days, would make everything else easier?",
        subtext: "Find the domino.",
        phase: "game-plan",
        psychologyTechnique: "Keystone habit"
      },
      {
        question: "When you read your vision statement and anti-vision statement back to back, what happens in your body?",
        subtext: "The body knows what the mind tries to hide.",
        phase: "synthesis",
        psychologyTechnique: "Somatic awareness"
      },
      {
        question: "What's one truth from this entire excavation that you'll probably try to forget by tomorrow?",
        subtext: "The ones we want to forget are usually the most important.",
        phase: "synthesis",
        psychologyTechnique: "Insight anchoring"
      },
    ],
    // Batch 4+: Going deeper
    [
      {
        question: "You've done the work of excavation. What's the conversation you need to have with yourself that you've been avoiding?",
        subtext: "Sometimes we need to say things out loud to make them real.",
        phase: "synthesis",
        psychologyTechnique: "Inner dialogue"
      },
      {
        question: "What would you need to forgive yourself for to fully step into the identity you're building?",
        subtext: "Guilt keeps us chained to the past.",
        phase: "vision",
        psychologyTechnique: "Self-forgiveness"
      },
      {
        question: "The constraints you listed—are those real boundaries or comfortable excuses dressed up as values?",
        subtext: "Only you know the difference.",
        phase: "game-plan",
        psychologyTechnique: "Constraint questioning"
      },
      {
        question: "If you were to sabotage yourself in the next 30 days, exactly how would you do it?",
        subtext: "Know your enemy's playbook.",
        phase: "synthesis",
        psychologyTechnique: "Self-sabotage mapping"
      },
      {
        question: "What's the promise you're making to yourself right now that you're actually willing to keep?",
        subtext: "Not the ambitious one. The real one.",
        phase: "game-plan",
        psychologyTechnique: "Commitment calibration"
      },
    ],
  ];

  const batchIndex = Math.min(batchNumber - 1, allFallbacks.length - 1);
  const batch = allFallbacks[batchIndex];
  return batch.slice(0, count);
}
