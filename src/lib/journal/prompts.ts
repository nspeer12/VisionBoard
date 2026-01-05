export interface JournalPrompt {
  id: string;
  category: "welcome" | "year" | "values" | "identity" | "life-areas" | "obstacles" | "closing" | "dynamic";
  question: string;
  subtext?: string;
  placeholder?: string;
  psychologyTechnique?: string;
  isOptional?: boolean;
  isDynamic?: boolean;
}

// Phase 1: Prescribed questions - always asked first
export const prescribedPrompts: JournalPrompt[] = [
  {
    id: "welcome-breath",
    category: "welcome",
    question: "Take a deep breath. Close your eyes for a moment.",
    subtext: "When you're ready, let's begin this journey together. There are no wrong answers — only your truth.",
    placeholder: "Press continue when you're centered...",
  },
  {
    id: "year-feeling",
    category: "year",
    question: "Imagine it's December 31st, 2026. You're looking back on an incredible year. How do you feel?",
    subtext: "Don't think too hard — what's the first feeling that comes to mind?",
    placeholder: "I feel...",
    psychologyTechnique: "Future self visualization",
  },
  {
    id: "year-word",
    category: "year",
    question: "If you had to capture your vision for 2026 in a single word or phrase, what would it be?",
    subtext: "This word will anchor your vision board.",
    placeholder: "My word for 2026 is...",
    psychologyTechnique: "Intention setting",
  },
  {
    id: "core-transformation",
    category: "life-areas",
    question: "What's the one area of your life you most want to transform this year?",
    subtext: "It could be career, health, relationships, creativity, finances, personal growth — whatever calls to you strongest.",
    placeholder: "The area I most want to transform is...",
    psychologyTechnique: "Goal clarity",
  },
  {
    id: "identity-becoming",
    category: "identity",
    question: "Who are you becoming?",
    subtext: "Not who you think you should be, but who you genuinely want to grow into.",
    placeholder: "I am becoming someone who...",
    psychologyTechnique: "Identity-based goals",
  },
];

// Batch size for dynamically generated questions
export const QUESTION_BATCH_SIZE = 4;

// Categories for visual display
export const promptCategories = [
  { id: "welcome", label: "Begin", icon: "✨" },
  { id: "year", label: "Year Vision", icon: "🌅" },
  { id: "values", label: "Values", icon: "💎" },
  { id: "identity", label: "Identity", icon: "🌱" },
  { id: "life-areas", label: "Life Areas", icon: "🌍" },
  { id: "obstacles", label: "Obstacles", icon: "🌊" },
  { id: "closing", label: "Commit", icon: "🔥" },
  { id: "dynamic", label: "Exploring", icon: "💭" },
] as const;

// Dynamic question creation helper
export function createDynamicPrompt(
  question: string,
  subtext: string,
  category: string,
  psychologyTechnique?: string
): JournalPrompt {
  return {
    id: `dynamic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    category: (category as JournalPrompt["category"]) || "dynamic",
    question,
    subtext,
    placeholder: "Share your thoughts...",
    psychologyTechnique,
    isDynamic: true,
  };
}

// Helper functions
export function getPromptById(prompts: JournalPrompt[], id: string): JournalPrompt | undefined {
  return prompts.find((p) => p.id === id);
}

export function getProgress(currentIndex: number, totalQuestions: number): number {
  return ((currentIndex + 1) / totalQuestions) * 100;
}

export function getAnsweredCount(responses: { promptId: string; answer: string }[]): number {
  return responses.filter(r => r.answer.trim().length > 0 && !r.promptId.startsWith('welcome')).length;
}

// Check if Phase 1 (prescribed questions) is complete
export function isPrescribedPhaseComplete(responses: { promptId: string; answer: string }[]): boolean {
  const prescribedIds = prescribedPrompts.map(p => p.id);
  const answeredPrescribed = responses.filter(r => 
    prescribedIds.includes(r.promptId) && r.answer.trim().length > 0
  );
  // We have 5 prescribed prompts, but welcome doesn't need an answer
  return answeredPrescribed.length >= prescribedPrompts.length - 1;
}

// Legacy exports for backward compatibility
export const seedPrompts = prescribedPrompts;
export const TARGET_QUESTION_COUNT = 10;

export const journalPrompts: JournalPrompt[] = [
  ...prescribedPrompts,
];
