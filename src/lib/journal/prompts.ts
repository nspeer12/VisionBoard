export interface JournalPrompt {
  id: string;
  category: "welcome" | "year" | "values" | "identity" | "life-areas" | "obstacles" | "closing" | "freeform";
  question: string;
  subtext?: string;
  placeholder?: string;
  followUp?: string;
  minLength?: number;
  psychologyTechnique?: string;
  isOptional?: boolean;
}

export const journalPrompts: JournalPrompt[] = [
  // Welcome & Grounding
  {
    id: "welcome-breath",
    category: "welcome",
    question: "Take a deep breath. Close your eyes for a moment.",
    subtext: "When you're ready, let's begin this journey together. There are no wrong answers — only your truth. You can skip any question or go back at any time.",
    placeholder: "Press continue when you're centered...",
  },
  
  // Year Theme
  {
    id: "year-feeling",
    category: "year",
    question: "Imagine it's December 31st, 2026. You're looking back on an incredible year. How do you feel?",
    subtext: "Don't think too hard — what's the first feeling that comes to mind?",
    placeholder: "I feel...",
    psychologyTechnique: "Future self visualization",
    isOptional: true,
  },
  {
    id: "year-one-word",
    category: "year",
    question: "If 2026 could be captured in a single word or phrase, what would it be?",
    subtext: "This will become your North Star — the theme that guides your vision.",
    placeholder: "My word for 2026 is...",
    isOptional: true,
  },
  {
    id: "year-different",
    category: "year",
    question: "What makes this year different from the ones before?",
    subtext: "What shift are you ready to make? What chapter are you opening?",
    placeholder: "This year is different because...",
    psychologyTechnique: "Mental contrasting",
    isOptional: true,
  },

  // Values Exploration
  {
    id: "values-matters",
    category: "values",
    question: "When you're at your best, what values are you living by?",
    subtext: "Think of a moment when you felt truly aligned with yourself. What made it meaningful?",
    placeholder: "What matters most is...",
    psychologyTechnique: "Self-determination (autonomy)",
    isOptional: true,
  },
  {
    id: "values-non-negotiable",
    category: "values",
    question: "What's non-negotiable for you this year?",
    subtext: "The one thing you refuse to compromise on, no matter what.",
    placeholder: "I will not compromise on...",
    isOptional: true,
  },

  // Identity
  {
    id: "identity-becoming",
    category: "identity",
    question: "Who are you becoming?",
    subtext: "Not who you think you should be, but who you genuinely want to grow into.",
    placeholder: "I am becoming someone who...",
    psychologyTechnique: "Identity-based goals",
    isOptional: true,
  },
  {
    id: "identity-admire",
    category: "identity",
    question: "Think of someone you deeply admire. What quality of theirs do you want to embody more?",
    subtext: "It could be someone you know, a public figure, or even a fictional character.",
    placeholder: "I admire how they...",
    isOptional: true,
  },

  // Life Areas
  {
    id: "life-career",
    category: "life-areas",
    question: "In your work or career, what does fulfillment look like this year?",
    subtext: "Think about daily experience, not just achievements.",
    placeholder: "In my work, I want to feel...",
    isOptional: true,
  },
  {
    id: "life-health",
    category: "life-areas",
    question: "How do you want to feel in your body and mind?",
    subtext: "Energy, strength, peace, vitality — what does wellness mean for you?",
    placeholder: "In my body and mind, I want...",
    isOptional: true,
  },
  {
    id: "life-relationships",
    category: "life-areas",
    question: "What do you want your closest relationships to feel like?",
    subtext: "Family, friends, partner, community — the people who matter.",
    placeholder: "I want my relationships to be...",
    isOptional: true,
  },
  {
    id: "life-growth",
    category: "life-areas",
    question: "What's one thing you want to learn, create, or master this year?",
    subtext: "A skill, a creative pursuit, a new understanding.",
    placeholder: "I want to...",
    psychologyTechnique: "Competence (SDT)",
    isOptional: true,
  },
  {
    id: "life-joy",
    category: "life-areas",
    question: "What brings you pure, uncomplicated joy?",
    subtext: "The small things, the big things — what makes you come alive?",
    placeholder: "I feel joy when...",
    isOptional: true,
  },

  // Obstacles & Mental Contrasting
  {
    id: "obstacles-inner",
    category: "obstacles",
    question: "Be honest with yourself: what's the inner obstacle that usually holds you back?",
    subtext: "Fear, perfectionism, self-doubt, distraction — name it without judgment.",
    placeholder: "My inner obstacle is...",
    psychologyTechnique: "Mental contrasting (WOOP)",
    isOptional: true,
  },
  {
    id: "obstacles-pattern",
    category: "obstacles",
    question: "Is there a pattern or habit you want to finally break this year?",
    subtext: "Something that's kept you from your best self.",
    placeholder: "I'm ready to stop...",
    psychologyTechnique: "Habit design",
    isOptional: true,
  },
  {
    id: "obstacles-if-then",
    category: "obstacles",
    question: "When that obstacle shows up, what will you do instead?",
    subtext: "Create an 'if-then' plan: If [obstacle appears], then I will [specific action].",
    placeholder: "If I notice this happening, I will...",
    psychologyTechnique: "Implementation intentions",
    isOptional: true,
  },

  // Closing & Commitment
  {
    id: "closing-minimum",
    category: "closing",
    question: "What's the smallest action you could take this week that moves you toward your vision?",
    subtext: "Not the big goal — the tiniest step you could actually do tomorrow.",
    placeholder: "One small step I can take is...",
    psychologyTechnique: "Minimum viable action",
    isOptional: true,
  },
  {
    id: "closing-reminder",
    category: "closing",
    question: "Finally, what do you want to remember when things get hard?",
    subtext: "A mantra, a truth, a reason to keep going.",
    placeholder: "When things get hard, I'll remember...",
    psychologyTechnique: "Self-compassion anchor",
    isOptional: true,
  },

  // Free Journaling
  {
    id: "freeform-journal",
    category: "freeform",
    question: "Is there anything else on your heart?",
    subtext: "This is your space for free reflection. Write whatever comes to mind — dreams, fears, hopes, gratitude, or anything the prompts didn't capture. Or leave it blank and create your board.",
    placeholder: "Write freely here...",
    isOptional: true,
  },
];

export const promptCategories = [
  { id: "welcome", label: "Begin", icon: "✨" },
  { id: "year", label: "Year Vision", icon: "🌅" },
  { id: "values", label: "Values", icon: "💎" },
  { id: "identity", label: "Identity", icon: "🌱" },
  { id: "life-areas", label: "Life Areas", icon: "🌍" },
  { id: "obstacles", label: "Obstacles", icon: "🌊" },
  { id: "closing", label: "Commit", icon: "🔥" },
  { id: "freeform", label: "Free Write", icon: "📝" },
] as const;

export function getPromptsByCategory(category: string): JournalPrompt[] {
  return journalPrompts.filter((p) => p.category === category);
}

export function getPromptById(id: string): JournalPrompt | undefined {
  return journalPrompts.find((p) => p.id === id);
}

export function getCurrentPromptIndex(responses: { promptId: string }[]): number {
  if (responses.length === 0) return 0;
  const lastPromptId = responses[responses.length - 1].promptId;
  const lastIndex = journalPrompts.findIndex((p) => p.id === lastPromptId);
  return Math.min(lastIndex + 1, journalPrompts.length - 1);
}

export function getProgress(currentIndex: number): number {
  return ((currentIndex + 1) / journalPrompts.length) * 100;
}

export function getAnsweredCount(responses: { promptId: string; answer: string }[]): number {
  return responses.filter(r => r.answer.trim().length > 0).length;
}
