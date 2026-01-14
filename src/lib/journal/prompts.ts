export interface JournalPrompt {
  id: string;
  phase: "intro" | "excavation" | "anti-vision" | "vision" | "synthesis" | "game-plan";
  question: string;
  subtext?: string;
  placeholder?: string;
  psychologyTechnique?: string;
  isOptional?: boolean;
  isDynamic?: boolean;
  isInterlude?: boolean; // Educational content, no answer needed
}

// The Dan Koe Protocol: Deep psychological excavation for true change
// Based on the principle that all behavior is goal-oriented, and real change 
// requires changing your goals at the unconscious level

export const prescribedPrompts: JournalPrompt[] = [
  // === OPENING ===
  {
    id: "welcome",
    phase: "intro",
    question: "This isn't a typical goal-setting exercise.",
    subtext: "We're going to dig deep into your psyche—uncover what's really holding you back, what you truly want, and build a vision so clear that distractions lose their power. Set aside time. Be honest. There are no wrong answers—only your truth.",
    placeholder: "Press continue when you're ready to begin...",
    isInterlude: true,
  },

  // === INTRO: THE PROBLEM WITH NEW YEARS RESOLUTIONS ===
  {
    id: "intro-identity",
    phase: "intro",
    question: "You aren't where you want to be because you aren't the person who would be there.",
    subtext: "Most people only focus on changing their actions. But the bodybuilder doesn't 'grind' to eat healthy—they can't imagine living any other way. The CEO doesn't force themselves to show up—they'd hate every second of lying in bed past their alarm. Real change isn't about discipline. It's about becoming someone for whom the right actions feel natural.",
    isInterlude: true,
  },
  {
    id: "intro-behavior",
    phase: "intro", 
    question: "All behavior is goal-oriented.",
    subtext: "When you procrastinate, you're not 'lacking discipline'—you're pursuing a goal. Maybe protection from judgment. Maybe safety from failure. When you stay in a dead-end situation despite hating it, you're pursuing predictability, an excuse, a way to avoid looking like a failure to others. The lesson: real change requires changing your goals at the unconscious level.",
    isInterlude: true,
  },
  {
    id: "intro-fear",
    phase: "intro",
    question: "You aren't where you want to be because you're afraid to be there.",
    subtext: "Your identity was formed in childhood through reward and punishment. You conformed to survive. Now, when your identity feels threatened, you go into fight or flight—just like a physical attack. You defend your beliefs, your self-image, your 'type of person' status. This is why change feels so hard: you're not just changing habits, you're threatening your psychological survival.",
    isInterlude: true,
  },

  // === PHASE 1: EXCAVATION - Uncovering Hidden Patterns ===
  {
    id: "excavation-intro",
    phase: "excavation",
    question: "Phase 1: Psychological Excavation",
    subtext: "We begin by uncovering the hidden patterns running your life. This may be uncomfortable. That's the point. The goal is to create dissonance—a deep dissatisfaction with your current trajectory that becomes fuel for change. Be brutally honest. No one sees this but you.",
    isInterlude: true,
  },
  {
    id: "excavation-dissatisfaction",
    phase: "excavation",
    question: "What is the dull and persistent dissatisfaction you've learned to live with?",
    subtext: "Not the deep suffering—what have you learned to tolerate? The mediocre relationship. The unfulfilling work. The body you don't respect. The dreams you've quietly abandoned. If you don't hate it, you will tolerate it forever.",
    placeholder: "The thing I've been putting up with is...",
    psychologyTechnique: "Dissonance awareness",
  },
  {
    id: "excavation-complaints",
    phase: "excavation",
    question: "What do you complain about repeatedly but never actually change?",
    subtext: "Write down the complaints you've voiced most often in the past year. To your friends, your partner, yourself in the shower. The things you keep saying need to change but somehow never do. Be brutally honest.",
    placeholder: "I keep complaining about...",
    psychologyTechnique: "Pattern recognition",
  },
  {
    id: "excavation-behavior-truth",
    phase: "excavation",
    question: "For each complaint: What would someone who watched your behavior (not your words) conclude that you actually want?",
    subtext: "Trust only movement. Life happens at the level of events, not words. If someone filmed your last month and had to guess your goals based purely on your actions—what would they conclude you're optimizing for? Comfort? Distraction? Approval? Safety?",
    placeholder: "My behavior suggests I actually want...",
    psychologyTechnique: "Behavioral honesty",
  },
  {
    id: "excavation-unbearable-truth",
    phase: "excavation",
    question: "What truth about your current life would be unbearable to admit to someone you deeply respect?",
    subtext: "Not to a stranger. To someone whose opinion of you matters deeply. A mentor. A parent. Your younger self. What would make you feel exposed, ashamed, small? Name it without judgment—the naming is the first step to freedom.",
    placeholder: "The truth I've been avoiding is...",
    psychologyTechnique: "Shadow work",
  },

  // === PHASE 2: ANTI-VISION - The Life You Refuse ===
  {
    id: "antivision-intro",
    phase: "anti-vision",
    question: "Phase 2: The Anti-Vision",
    subtext: "Now we create a brutal awareness of the life you do NOT want to live. This isn't pessimism—it's strategic. You need to feel the weight of where your current path leads. This negative energy becomes rocket fuel aimed in a positive direction. Don't rush past the discomfort.",
    isInterlude: true,
  },
  {
    id: "anti-vision-5years",
    phase: "anti-vision",
    question: "If absolutely nothing changes for the next five years, describe an average Tuesday.",
    subtext: "Be specific. Where do you wake up? What does your body feel like when you stand up? What's the first thought in your mind? Who's around you (or not)? What do you do between 9am and 6pm? How do you feel eating dinner? What's in your mind at 10pm? Paint the full picture.",
    placeholder: "In 5 years, if nothing changes, my Tuesday looks like...",
    psychologyTechnique: "Future projection",
  },
  {
    id: "anti-vision-10years",
    phase: "anti-vision",
    question: "Now extend it to ten years. What have you missed? What opportunities closed forever?",
    subtext: "The business you never started is now owned by someone else. The relationship you could have had married someone else. The body you could have built is now fighting chronic issues. What do people say about you when you're not in the room? What do you say about yourself?",
    placeholder: "In 10 years, if nothing changes...",
    psychologyTechnique: "Mental contrasting",
  },
  {
    id: "anti-vision-deathbed",
    phase: "anti-vision",
    question: "You're at the end of your life. You lived the safe version. You never broke the pattern. What was the cost?",
    subtext: "What did you never let yourself feel? What risk did you never take? What version of yourself did you never become? What would your younger self say to you? Sit with this. Let it hurt.",
    placeholder: "The cost of playing it safe would be...",
    psychologyTechnique: "Mortality salience",
  },
  {
    id: "anti-vision-example",
    phase: "anti-vision",
    question: "Who in your life is already living the future you just described?",
    subtext: "Someone five, ten, twenty years ahead on the same trajectory. Maybe a coworker, a family member, someone you know. They took the same path you're on, just earlier. What do you feel when you look at them? When you think about becoming them?",
    placeholder: "I see this future in...",
    psychologyTechnique: "Social comparison",
  },
  {
    id: "anti-vision-identity-cost",
    phase: "anti-vision",
    question: "What identity would you have to give up to actually change?",
    subtext: "\"I am the type of person who...\" — finish that sentence with something that's holding you back. The responsible one who can't take risks. The smart one who overthinks. The nice one who can't set boundaries. What would it cost you socially to no longer be that person?",
    placeholder: "I would have to give up being the person who...",
    psychologyTechnique: "Identity awareness",
  },
  {
    id: "anti-vision-embarrassing-reason",
    phase: "anti-vision",
    question: "What is the most embarrassing reason you haven't changed?",
    subtext: "Not the reasonable-sounding explanation you give others. The one that makes you sound weak, scared, or lazy. The one you don't even like admitting to yourself. Say it plainly.",
    placeholder: "The embarrassing truth is...",
    psychologyTechnique: "Radical honesty",
  },
  {
    id: "anti-vision-protection",
    phase: "anti-vision",
    question: "If your current behavior is a form of self-protection, what exactly are you protecting?",
    subtext: "All behavior serves a purpose. Your stuckness is protecting you from something—rejection, failure, judgment, the unknown. What is it? And here's the real question: what is that protection costing you?",
    placeholder: "I'm protecting myself from... and it's costing me...",
    psychologyTechnique: "Defense mechanism awareness",
  },

  // === PHASE 3: VISION - The Life You're Building ===
  {
    id: "vision-intro",
    phase: "vision",
    question: "Phase 3: The Vision",
    subtext: "Now we pivot. You've excavated the truth about where you are. You've confronted the anti-vision. Now it's time to create a new frame—a new lens of perception—for your mind to operate from. This is like creating a new shell, leaving your old one, and slowly growing into it. It won't feel like it fits at first. That's a good thing.",
    isInterlude: true,
  },
  {
    id: "vision-dream-tuesday",
    phase: "vision",
    question: "Forget practicality for a minute. If you could snap your fingers and be living a different life in three years, what does an average Tuesday look like?",
    subtext: "Not what's realistic. Not what others would approve of. What you ACTUALLY want. Where do you wake up? What does your body feel like? What's the first thing you do? Who's in your life? What does your work look like? How do you feel at the end of the day? Same level of detail as the anti-vision.",
    placeholder: "In my ideal life, Tuesday looks like...",
    psychologyTechnique: "Future self visualization",
  },
  {
    id: "vision-identity-belief",
    phase: "vision",
    question: "What would you have to believe about yourself for that life to feel natural rather than forced?",
    subtext: "Not 'I should be disciplined' or 'I need to work harder.' What identity would make those actions feel obvious? Write the identity statement: \"I am the type of person who...\"",
    placeholder: "I am the type of person who...",
    psychologyTechnique: "Identity-based goals",
  },
  {
    id: "vision-this-week",
    phase: "vision",
    question: "What is one thing you would do this week if you were already that person?",
    subtext: "Not someday. This week. What would be natural, obvious, unremarkable for the person you're becoming? What would they simply... do?",
    placeholder: "If I were already that person, this week I would...",
    psychologyTechnique: "Implementation intentions",
  },

  // === PHASE 4: SYNTHESIS - Integrating Insights ===
  {
    id: "synthesis-intro",
    phase: "synthesis",
    question: "Phase 4: Synthesis",
    subtext: "You've done deep work. Now we integrate. The goal is to compress everything you've uncovered into clear, actionable insights. These become your anchors—the truths you return to when you start to drift back into old patterns.",
    isInterlude: true,
  },
  {
    id: "synthesis-why-stuck",
    phase: "synthesis",
    question: "After everything you've written, what feels most true about why you've been stuck?",
    subtext: "Not the surface explanation. The real pattern that keeps repeating. The thing you couldn't quite see before but can see now. Say it plainly.",
    placeholder: "The truth is I've been stuck because...",
    psychologyTechnique: "Insight integration",
  },
  {
    id: "synthesis-enemy",
    phase: "synthesis",
    question: "What is the actual enemy? Name it clearly.",
    subtext: "Not circumstances. Not other people. Not 'the economy' or 'my boss' or 'my upbringing.' The internal pattern or belief that has been running the show. The thing inside you that keeps recreating the same results. Give it a name.",
    placeholder: "The real enemy is...",
    psychologyTechnique: "Pattern naming",
  },
  {
    id: "synthesis-anti-vision-sentence",
    phase: "synthesis",
    question: "Write a single sentence that captures what you refuse to let your life become.",
    subtext: "This is your anti-vision compressed into a punch. It should make you feel something when you read it. Disgust. Determination. Fire. This is what you're running FROM.",
    placeholder: "I refuse to...",
    psychologyTechnique: "Negative visualization anchor",
  },
  {
    id: "synthesis-vision-sentence",
    phase: "synthesis",
    question: "Write a single sentence that captures what you're building toward.",
    subtext: "Your vision MVP—your north star for now, knowing it will evolve. Not a complete life plan. Just a direction. A gravitational pull. This is what you're running TOWARD.",
    placeholder: "I am building toward...",
    psychologyTechnique: "Vision statement",
  },

  // === PHASE 5: GAME PLAN - The Video Game Framework ===
  {
    id: "gameplan-intro",
    phase: "game-plan",
    question: "Phase 5: Turn Your Life Into a Video Game",
    subtext: "Games are the poster child for obsession, enjoyment, and flow states. They have all the components that lead to focus and clarity. Your vision is how you WIN. Your anti-vision is what's at STAKE. Now we create the mission, the boss fights, and the daily quests that make progress feel inevitable.",
    isInterlude: true,
  },
  {
    id: "gameplan-framework",
    phase: "game-plan",
    question: "The Game Framework",
    subtext: "• Anti-Vision = What's at stake if you lose\n• Vision = How you win\n• 1-Year Goal = The mission (your sole priority)\n• 1-Month Project = The boss fight (how you gain XP)\n• Daily Levers = The quests (the process that unlocks opportunities)\n• Constraints = The rules (limitations that encourage creativity)\n\nThese create concentric circles—a forcefield that guards your mind from distractions. Let's build yours.",
    isInterlude: true,
  },
  {
    id: "gameplan-one-year",
    phase: "game-plan",
    question: "One-year lens: What would have to be true in one year for you to know you've broken the old pattern?",
    subtext: "One concrete, observable thing. Not 'be happier' but 'have launched my business and made first sale.' Not 'be healthier' but 'weigh 175 pounds and deadlift 300.' What would prove to yourself that you've changed?",
    placeholder: "In one year, I will have...",
    psychologyTechnique: "Goal clarity",
  },
  {
    id: "gameplan-one-month",
    phase: "game-plan",
    question: "One-month lens: What would have to be true in one month for the one-year goal to remain possible?",
    subtext: "This is your boss fight. The immediate challenge that, if conquered, proves you're on the path. What skill do you need to acquire? What project do you need to complete? What milestone would make the year goal feel achievable?",
    placeholder: "In one month, I will have...",
    psychologyTechnique: "Milestone setting",
  },
  {
    id: "gameplan-daily",
    phase: "game-plan",
    question: "Daily lens: What are 2-3 actions you can timeblock tomorrow that the person you're becoming would simply do?",
    subtext: "These are your quests. Not everything on your to-do list—the 2-3 things that move the needle. The actions that, done consistently, make everything else irrelevant. What would you block off time for tomorrow morning?",
    placeholder: "Tomorrow I will:\n1. \n2. \n3.",
    psychologyTechnique: "Implementation intentions",
  },
  {
    id: "gameplan-constraints",
    phase: "game-plan",
    question: "What are you NOT willing to sacrifice to achieve your vision?",
    subtext: "These are the rules of your game. The limitations that encourage creativity and protect what matters. Your health? Your relationships? Your integrity? Your sleep? Name them clearly—they're your guardrails.",
    placeholder: "I will not sacrifice...",
    psychologyTechnique: "Boundary setting",
  },

  // === CLOSING ===
  {
    id: "closing-truth",
    phase: "game-plan",
    question: "One final question: What's the one truth from this excavation that you'll probably try to forget by tomorrow?",
    subtext: "The insights we most want to forget are usually the ones we most need to remember. Write it down. This is your anchor. When you drift—and you will drift—come back to this.",
    placeholder: "The truth I must not forget is...",
    psychologyTechnique: "Insight anchoring",
  },
];

export const QUESTION_BATCH_SIZE = 5;

export const promptCategories = [
  { id: "intro", label: "Introduction", icon: "📖", description: "Understanding the process" },
  { id: "excavation", label: "Excavation", icon: "🔍", description: "Uncovering hidden patterns" },
  { id: "anti-vision", label: "Anti-Vision", icon: "⚠️", description: "The life you refuse" },
  { id: "vision", label: "Vision", icon: "✨", description: "The life you're building" },
  { id: "synthesis", label: "Synthesis", icon: "🧠", description: "Integrating insights" },
  { id: "game-plan", label: "Game Plan", icon: "🎮", description: "Your strategy" },
] as const;

export function createDynamicPrompt(
  question: string,
  subtext: string,
  phase: string,
  psychologyTechnique?: string
): JournalPrompt {
  return {
    id: `dynamic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    phase: (phase as JournalPrompt["phase"]) || "synthesis",
    question,
    subtext,
    placeholder: "Share your thoughts...",
    psychologyTechnique,
    isDynamic: true,
  };
}

export function getPromptById(prompts: JournalPrompt[], id: string): JournalPrompt | undefined {
  return prompts.find((p) => p.id === id);
}

export function getProgress(currentIndex: number, totalQuestions: number): number {
  return ((currentIndex + 1) / totalQuestions) * 100;
}

export function getAnsweredCount(responses: { promptId: string; answer: string }[]): number {
  // Don't count interludes in the answered count
  const interludeIds = prescribedPrompts.filter(p => p.isInterlude).map(p => p.id);
  return responses.filter(r => 
    r.answer.trim().length > 0 && 
    !interludeIds.includes(r.promptId)
  ).length;
}

export function isPrescribedPhaseComplete(responses: { promptId: string; answer: string }[]): boolean {
  // Only count non-interlude prompts as needing answers
  const requiredPrompts = prescribedPrompts.filter(p => !p.isInterlude);
  const answeredRequired = responses.filter(r => {
    const prompt = prescribedPrompts.find(p => p.id === r.promptId);
    return prompt && !prompt.isInterlude && r.answer.trim().length > 0;
  });
  return answeredRequired.length >= requiredPrompts.length;
}

// Legacy exports
export const seedPrompts = prescribedPrompts;
export const TARGET_QUESTION_COUNT = prescribedPrompts.length;
export const journalPrompts: JournalPrompt[] = [...prescribedPrompts];
