"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { 
  db, 
  Journal, 
  JournalResponse, 
  updateJournal,
  createBoard,
  updateBoard,
} from "@/lib/storage/db";
import { 
  journalPrompts, 
  promptCategories, 
  getCurrentPromptIndex,
  getProgress,
  type JournalPrompt,
} from "@/lib/journal/prompts";
import { cn } from "@/lib/utils";

export default function JournalPage() {
  const params = useParams();
  const router = useRouter();
  const journalId = params.id as string;

  const [journal, setJournal] = useState<Journal | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load journal
  useEffect(() => {
    const load = async () => {
      const j = await db.journals.get(journalId);
      if (!j) {
        router.replace("/");
        return;
      }
      setJournal(j);
      const idx = getCurrentPromptIndex(j.responses);
      setCurrentIndex(idx);
      setIsLoading(false);
    };
    load();
  }, [journalId, router]);

  const currentPrompt = journalPrompts[currentIndex];
  const progress = getProgress(currentIndex);
  const isFirstPrompt = currentIndex === 0;
  const isLastPrompt = currentIndex === journalPrompts.length - 1;

  // Get existing answer for current prompt
  useEffect(() => {
    if (journal) {
      const existing = journal.responses.find(r => r.promptId === currentPrompt?.id);
      setAnswer(existing?.answer || "");
    }
  }, [journal, currentPrompt]);

  const saveResponse = useCallback(async () => {
    if (!journal || !currentPrompt) return;
    
    const newResponse: JournalResponse = {
      promptId: currentPrompt.id,
      question: currentPrompt.question,
      answer: answer.trim(),
      timestamp: new Date(),
    };

    const existingIndex = journal.responses.findIndex(r => r.promptId === currentPrompt.id);
    let newResponses: JournalResponse[];
    
    if (existingIndex >= 0) {
      newResponses = [...journal.responses];
      newResponses[existingIndex] = newResponse;
    } else {
      newResponses = [...journal.responses, newResponse];
    }

    await updateJournal(journal.id, { responses: newResponses });
    setJournal({ ...journal, responses: newResponses });
  }, [journal, currentPrompt, answer]);

  const handleNext = async () => {
    if (isSaving) return;
    setIsSaving(true);

    // Skip welcome prompt save
    if (currentPrompt?.category !== "welcome" && answer.trim()) {
      await saveResponse();
    }

    if (isLastPrompt) {
      await handleComplete();
    } else {
      setCurrentIndex(prev => prev + 1);
      setAnswer("");
    }
    setIsSaving(false);
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    if (!journal) return;
    setIsGenerating(true);

    try {
      // Mark journal complete and create board
      await updateJournal(journal.id, { isComplete: true });
      const board = await createBoard(journal.id, journal.title);
      await updateJournal(journal.id, { boardId: board.id });

      // Generate initial board content
      const response = await fetch("/api/generate-board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          journalId: journal.id,
          responses: journal.responses 
        }),
      });

      if (response.ok) {
        const { elements } = await response.json();
        await updateBoard(board.id, { 
          canvas: { 
            ...board.canvas, 
            elements 
          } 
        });
      }

      router.push(`/board/${board.id}`);
    } catch (error) {
      console.error("Error completing journal:", error);
      setIsGenerating(false);
    }
  };

  const canProceed = currentPrompt?.category === "welcome" || 
    answer.trim().length >= (currentPrompt?.minLength || 0);

  const getCurrentCategory = () => {
    return promptCategories.find(c => c.id === currentPrompt?.category);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-gradient-warm flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md px-6"
        >
          <div className="w-16 h-16 border-2 border-terracotta border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <h2 className="font-display text-2xl text-charcoal mb-3">
            Creating Your Vision Board
          </h2>
          <p className="font-serif text-slate">
            Transforming your reflections into vivid imagery...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-warm">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-cream-dark z-50">
        <motion.div 
          className="h-full bg-gradient-to-r from-terracotta to-sage"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Category indicator */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-40">
        <motion.div 
          key={currentPrompt?.category}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-cream/80 backdrop-blur-sm border border-sand/50"
        >
          <span>{getCurrentCategory()?.icon}</span>
          <span className="font-sans text-sm text-slate">{getCurrentCategory()?.label}</span>
        </motion.div>
      </div>

      {/* Back button */}
      {!isFirstPrompt && (
        <button
          onClick={handleBack}
          className="fixed top-6 left-6 z-40 p-3 rounded-full bg-cream/80 backdrop-blur-sm border border-sand/50 text-slate hover:text-charcoal hover:bg-cream transition-gentle"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}

      {/* Main content */}
      <div className="min-h-screen flex items-center justify-center px-6 py-24">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPrompt?.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            >
              <PromptCard
                prompt={currentPrompt}
                answer={answer}
                onAnswerChange={setAnswer}
                canProceed={canProceed}
                onNext={handleNext}
                isLast={isLastPrompt}
                isSaving={isSaving}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Progress dots */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-1.5">
          {promptCategories.map((cat, i) => {
            const catPrompts = journalPrompts.filter(p => p.category === cat.id);
            const firstIndex = journalPrompts.findIndex(p => p.category === cat.id);
            const isActive = currentPrompt?.category === cat.id;
            const isPast = firstIndex < currentIndex && !isActive;
            
            return (
              <div
                key={cat.id}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  isActive && "w-6 bg-terracotta",
                  isPast && "bg-sage",
                  !isActive && !isPast && "bg-sand"
                )}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface PromptCardProps {
  prompt: JournalPrompt;
  answer: string;
  onAnswerChange: (value: string) => void;
  canProceed: boolean;
  onNext: () => void;
  isLast: boolean;
  isSaving: boolean;
}

function PromptCard({ 
  prompt, 
  answer, 
  onAnswerChange, 
  canProceed, 
  onNext, 
  isLast,
  isSaving 
}: PromptCardProps) {
  const isWelcome = prompt.category === "welcome";

  return (
    <div className="prompt-card p-8 md:p-12">
      {/* Question */}
      <h2 className="font-display text-2xl md:text-3xl text-charcoal mb-4 leading-relaxed">
        {prompt.question}
      </h2>
      
      {/* Subtext */}
      {prompt.subtext && (
        <p className="font-serif text-slate mb-8 leading-relaxed">
          {prompt.subtext}
        </p>
      )}

      {/* Psychology technique badge */}
      {prompt.psychologyTechnique && (
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-lavender/30 text-slate text-xs font-sans mb-6">
          {prompt.psychologyTechnique}
        </div>
      )}

      {/* Answer input */}
      {!isWelcome && (
        <div className="mb-8">
          <textarea
            value={answer}
            onChange={(e) => onAnswerChange(e.target.value)}
            placeholder={prompt.placeholder}
            className="journal-textarea w-full min-h-[150px] p-4 rounded-2xl bg-cream-dark/30 border border-sand/50 focus:border-terracotta/50 transition-gentle"
            autoFocus
          />
          {prompt.minLength && answer.length < prompt.minLength && answer.length > 0 && (
            <p className="font-sans text-xs text-slate/60 mt-2">
              Keep going... ({prompt.minLength - answer.length} more characters)
            </p>
          )}
        </div>
      )}

      {/* Continue button */}
      <motion.button
        onClick={onNext}
        disabled={!canProceed || isSaving}
        whileHover={{ scale: canProceed ? 1.02 : 1 }}
        whileTap={{ scale: canProceed ? 0.98 : 1 }}
        className={cn(
          "w-full flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-sans font-medium transition-gentle",
          canProceed 
            ? "bg-gradient-to-r from-terracotta to-terracotta-dark text-cream hover:shadow-lg" 
            : "bg-sand/50 text-slate/50 cursor-not-allowed"
        )}
      >
        {isSaving ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <span>{isLast ? "Create My Vision Board" : isWelcome ? "I'm Ready" : "Continue"}</span>
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </motion.button>
    </div>
  );
}
