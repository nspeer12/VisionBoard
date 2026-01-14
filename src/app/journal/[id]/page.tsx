"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback, Suspense, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, 
  Loader2, 
  ChevronLeft, 
  RefreshCw, 
  ArrowLeft, 
  Sparkles,
  MessageCircle,
  CheckCircle
} from "lucide-react";
import { 
  db, 
  Journal, 
  JournalResponse, 
  updateJournal,
  createBoard,
  updateBoard,
} from "@/lib/storage/db";
import { 
  prescribedPrompts,
  promptCategories,
  getProgress,
  getAnsweredCount,
  createDynamicPrompt,
  isPrescribedPhaseComplete,
  QUESTION_BATCH_SIZE,
  type JournalPrompt,
} from "@/lib/journal/prompts";

const phaseColors: Record<string, string> = {
  "intro": "from-charcoal to-slate-800",
  "excavation": "from-slate-600 to-slate-800",
  "anti-vision": "from-red-900 to-red-950",
  "vision": "from-emerald-700 to-emerald-900",
  "synthesis": "from-indigo-700 to-indigo-900",
  "game-plan": "from-amber-600 to-amber-800",
};
import { cn } from "@/lib/utils";

type JournalPhase = "prescribed" | "transition" | "generating" | "dynamic" | "complete";

function JournalPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const journalId = params.id as string;
  
  // Edit mode from board
  const isEditMode = searchParams.get("edit") === "true";
  const existingBoardId = searchParams.get("boardId");

  // Core state
  const [journal, setJournal] = useState<Journal | null>(null);
  const [prompts, setPrompts] = useState<JournalPrompt[]>([...prescribedPrompts]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const answerRef = useRef(answer);
  
  // Phase tracking
  const [phase, setPhase] = useState<JournalPhase>("prescribed");
  const [batchNumber, setBatchNumber] = useState(0);
  const [dynamicBatchStart, setDynamicBatchStart] = useState(prescribedPrompts.length);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isCompilingProfile, setIsCompilingProfile] = useState(false);

  // Load journal and restore state
  useEffect(() => {
    const load = async () => {
      const j = await db.journals.get(journalId);
      if (!j) {
        router.replace("/");
        return;
      }
      setJournal(j);
      
      // Restore prompts from existing responses
      if (j.responses.length > 0) {
        const restoredPrompts = [...prescribedPrompts];
        j.responses.forEach((response) => {
          const exists = restoredPrompts.some(p => p.id === response.promptId);
          if (!exists && !response.promptId.startsWith('welcome')) {
            const dynamicPrompt = createDynamicPrompt(
              response.question,
              "",
              "dynamic"
            );
            dynamicPrompt.id = response.promptId;
            restoredPrompts.push(dynamicPrompt);
          }
        });
        setPrompts(restoredPrompts);
        
        // Determine current phase
        if (isPrescribedPhaseComplete(j.responses)) {
          const dynamicCount = restoredPrompts.length - prescribedPrompts.length;
          if (dynamicCount > 0) {
            setPhase("dynamic");
            setBatchNumber(Math.ceil(dynamicCount / QUESTION_BATCH_SIZE));
          } else {
            setPhase("transition");
          }
        }
      }
      
      setCurrentIndex(0);
      setIsLoading(false);
    };
    load();
  }, [journalId, router]);

  const currentPrompt = prompts[currentIndex];
  const answeredCount = journal ? getAnsweredCount(journal.responses) : 0;
  const prescribedComplete = journal ? isPrescribedPhaseComplete(journal.responses) : false;
  const isLastPrescribed = currentIndex === prescribedPrompts.length - 1;
  const isAtEndOfCurrentBatch = phase === "dynamic" && 
    currentIndex >= dynamicBatchStart + QUESTION_BATCH_SIZE - 1 &&
    currentIndex === prompts.length - 1;

  // Get existing answer for current prompt
  useEffect(() => {
    if (journal && currentPrompt) {
      const existing = journal.responses.find(r => r.promptId === currentPrompt.id);
      const newAnswer = existing?.answer || "";
      setAnswer(newAnswer);
      answerRef.current = newAnswer;
    }
  }, [journal, currentPrompt]);

  const setAnswerWithRef = useCallback((newAnswer: string) => {
    setAnswer(newAnswer);
    answerRef.current = newAnswer;
  }, []);

  const saveResponse = useCallback(async (skipIfEmpty = false) => {
    if (!journal || !currentPrompt) return;
    
    const currentAnswer = answerRef.current;
    if (skipIfEmpty && !currentAnswer.trim()) return;
    
    const newResponse: JournalResponse = {
      promptId: currentPrompt.id,
      question: currentPrompt.question,
      answer: currentAnswer.trim(),
      timestamp: new Date(),
    };

    const existingIndex = journal.responses.findIndex(r => r.promptId === currentPrompt.id);
    let newResponses: JournalResponse[];
    
    if (existingIndex >= 0) {
      newResponses = [...journal.responses];
      newResponses[existingIndex] = newResponse;
    } else if (currentAnswer.trim()) {
      newResponses = [...journal.responses, newResponse];
    } else {
      return;
    }

    await updateJournal(journal.id, { responses: newResponses });
    setJournal({ ...journal, responses: newResponses });
  }, [journal, currentPrompt]);

  const generateQuestionBatch = async () => {
    if (!journal) return [];
    
    setIsGeneratingQuestions(true);
    
    try {
      // Build conversation history from all answered responses
      const conversationHistory = journal.responses
        .filter(r => r.answer.trim().length > 0)
        .map(r => ({
          question: r.question,
          answer: r.answer,
        }));
      
      // Include current answer if exists
      if (answerRef.current.trim() && currentPrompt) {
        conversationHistory.push({
          question: currentPrompt.question,
          answer: answerRef.current.trim(),
        });
      }

      const response = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationHistory,
          batchNumber: batchNumber + 1,
          batchSize: QUESTION_BATCH_SIZE,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.questions.map((q: any) => createDynamicPrompt(
          q.question,
          q.subtext || "",
          q.phase || "synthesis",
          q.psychologyTechnique
        ));
      }
    } catch (error) {
      console.error("Error generating questions:", error);
    } finally {
      setIsGeneratingQuestions(false);
    }
    
    return [];
  };

  const handleNext = async () => {
    if (isSaving || isGeneratingQuestions) return;
    setIsSaving(true);

    try {
      // Save current response (skip for interludes)
      if (!currentPrompt?.isInterlude && answerRef.current.trim()) {
        await saveResponse(false);
      }

      // Check if we're at the end of prescribed phase
      if (phase === "prescribed" && isLastPrescribed) {
        // Check if prescribed is now complete
        const updatedJournal = await db.journals.get(journalId);
        if (updatedJournal && isPrescribedPhaseComplete(updatedJournal.responses)) {
          setPhase("transition");
          setJournal(updatedJournal);
        } else {
          // Move to next prompt if not complete
          if (currentIndex < prompts.length - 1) {
            setCurrentIndex(prev => prev + 1);
          }
        }
        return;
      }

      // Check if at end of dynamic batch
      if (phase === "dynamic" && isAtEndOfCurrentBatch) {
        setPhase("transition");
        return;
      }

      // Otherwise, go to next prompt
      if (currentIndex < prompts.length - 1) {
        setCurrentIndex(prev => prev + 1);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = async () => {
    if (currentIndex > 0) {
      if (!currentPrompt?.isInterlude) {
        await saveResponse(true);
      }
      // If we're in transition and go back, return to questions
      if (phase === "transition") {
        setPhase(batchNumber > 0 ? "dynamic" : "prescribed");
      }
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleGenerateMoreQuestions = async () => {
    setPhase("generating");
    
    const newQuestions = await generateQuestionBatch();
    
    if (newQuestions.length > 0) {
      setDynamicBatchStart(prompts.length);
      setPrompts(prev => [...prev, ...newQuestions]);
      setBatchNumber(prev => prev + 1);
      setCurrentIndex(prompts.length);
      setPhase("dynamic");
    } else {
      // If generation failed, go back to transition
      setPhase("transition");
    }
  };

  const handleCreateVisionBoard = async () => {
    if (!journal) return;
    setIsCompilingProfile(true);
    setIsGenerating(true);

    try {
      await saveResponse(true);
      
      const updatedJournal = await db.journals.get(journalId);
      if (!updatedJournal) throw new Error("Journal not found");

      // Compile user profile from all responses
      const profileResponse = await fetch("/api/compile-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responses: updatedJournal.responses.map(r => ({
            question: r.question,
            answer: r.answer,
            phase: prompts.find(p => p.id === r.promptId)?.phase,
          })),
        }),
      });

      let profile = null;
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        profile = profileData.profile;
      }

      setIsCompilingProfile(false);
      await updateJournal(journal.id, { isComplete: true });
      
      // Create or get board
      let board;
      if (existingBoardId) {
        board = await db.boards.get(existingBoardId);
        if (!board) throw new Error("Board not found");
      } else {
        board = await createBoard(journal.id, journal.title);
        await updateJournal(journal.id, { boardId: board.id });
      }

      // Generate board with profile
      const response = await fetch("/api/generate-board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          journalId: journal.id,
          responses: updatedJournal.responses,
          profile,
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
      console.error("Error creating board:", error);
      setIsGenerating(false);
      setIsCompilingProfile(false);
    }
  };

  const handleRegenerateBoard = async () => {
    if (!journal || !existingBoardId) return;
    setIsRegenerating(true);
    setIsCompilingProfile(true);

    try {
      await saveResponse(true);
      
      const updatedJournal = await db.journals.get(journalId);
      if (!updatedJournal) throw new Error("Journal not found");

      const existingBoard = await db.boards.get(existingBoardId);
      if (!existingBoard) throw new Error("Board not found");

      // Compile profile
      const profileResponse = await fetch("/api/compile-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responses: updatedJournal.responses.map(r => ({
            question: r.question,
            answer: r.answer,
            phase: prompts.find(p => p.id === r.promptId)?.phase,
          })),
        }),
      });

      let profile = null;
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        profile = profileData.profile;
      }

      setIsCompilingProfile(false);

      const response = await fetch("/api/generate-board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          journalId: journal.id,
          responses: updatedJournal.responses,
          profile,
        }),
      });

      if (response.ok) {
        const { elements } = await response.json();
        await updateBoard(existingBoardId, { 
          canvas: { 
            ...existingBoard.canvas, 
            elements 
          } 
        });
      }

      router.push(`/board/${existingBoardId}`);
    } catch (error) {
      console.error("Error regenerating board:", error);
      setIsRegenerating(false);
      setIsCompilingProfile(false);
    }
  };

  const goToPrompt = async (index: number) => {
    if (index === currentIndex || index < 0 || index >= prompts.length) return;
    
    if (!currentPrompt?.isInterlude) {
      await saveResponse(true);
    }
    
    // If transitioning and clicking on a prompt, exit transition
    if (phase === "transition") {
      setPhase(index < prescribedPrompts.length ? "prescribed" : "dynamic");
    }
    
    setCurrentIndex(index);
  };

  const getCurrentPhase = () => {
    return promptCategories.find(c => c.id === currentPrompt?.phase);
  };

  const getCurrentPhaseColor = () => {
    return phaseColors[currentPrompt?.phase || "excavation"] || phaseColors["excavation"];
  };

  const isPromptAnswered = (promptId: string) => {
    return journal?.responses.some(r => r.promptId === promptId && r.answer.trim().length > 0) || false;
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
            {isCompilingProfile ? "Understanding Your Vision" : 
             isRegenerating ? "Regenerating Your Vision Board" : "Creating Your Vision Board"}
          </h2>
          <p className="font-serif text-slate mb-2">
            {isCompilingProfile 
              ? "Synthesizing your reflections into a personal profile..." 
              : isRegenerating 
                ? "Updating your vision with new reflections..." 
                : "Transforming your reflections into vivid imagery..."}
          </p>
          <p className="font-sans text-sm text-slate/60">
            {answeredCount} reflection{answeredCount !== 1 ? 's' : ''} captured
          </p>
        </motion.div>
      </div>
    );
  }

  // Transition screen between phases
  if (phase === "transition" || phase === "generating") {
    return (
      <div className="min-h-screen bg-gradient-warm flex items-center justify-center px-4 sm:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg"
        >
          <div className="prompt-card p-5 sm:p-8 md:p-12 text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-sage/20 flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 text-sage" />
            </div>
            
            <h2 className="font-display text-xl sm:text-2xl md:text-3xl text-charcoal mb-2 sm:mb-3">
              {batchNumber === 0 
                ? "Deep Work Complete" 
                : batchNumber === 1
                  ? "Going Deeper"
                  : "Excavation Continues"}
            </h2>
            
            <p className="font-serif text-sm sm:text-base text-slate mb-2">
              You've confronted {answeredCount} truth{answeredCount !== 1 ? 's' : ''} so far.
            </p>
            <p className="font-sans text-xs sm:text-sm text-slate/70 mb-4 sm:mb-6">
              {batchNumber === 0 
                ? "You've completed the core excavation. Create your vision board to visualize your transformation, or continue to uncover more."
                : "The AI is building on everything you've revealed. Continue to go even deeper, or create your board with your current insights."}
            </p>

            {phase === "generating" ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-terracotta" />
                <span className="font-sans text-sm sm:text-base text-slate">Crafting {QUESTION_BATCH_SIZE} personalized questions...</span>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {/* Secondary: Generate More Questions - now shown first for continuation */}
                <motion.button
                  onClick={handleGenerateMoreQuestions}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-8 py-3 sm:py-4 rounded-2xl font-sans text-sm sm:text-base font-medium transition-gentle bg-gradient-to-r from-sage to-sage-dark text-cream hover:shadow-lg"
                >
                  <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Continue Exploring</span>
                </motion.button>

                {/* Primary: Create Vision Board */}
                <motion.button
                  onClick={handleCreateVisionBoard}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-8 py-3 sm:py-4 rounded-2xl font-sans text-sm sm:text-base font-medium transition-gentle border-2 border-terracotta/50 text-terracotta hover:bg-terracotta/5"
                >
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Create My Vision Board</span>
                </motion.button>

                {/* Go back */}
                <button
                  onClick={handleBack}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-xl font-sans text-xs sm:text-sm text-slate hover:text-charcoal transition-gentle"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Review previous answers</span>
                </button>
              </div>
            )}

            <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-sand/50">
              <p className="font-sans text-[10px] sm:text-xs text-slate/60 text-center">
                {batchNumber === 0 
                  ? "Tip: More reflections = more personalized imagery"
                  : `Continue exploring as long as you'd like.`}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Main question flow
  return (
    <div className="min-h-screen bg-gradient-warm">
      {/* Edit mode header */}
      {isEditMode && existingBoardId && (
        <header className="fixed top-0 left-0 right-0 z-50 bg-cream/90 backdrop-blur-md border-b border-white/5">
          <div className="max-w-4xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-2">
            <button
              onClick={() => router.push(`/board/${existingBoardId}`)}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-xl hover:bg-cream-dark transition-gentle text-slate hover:text-charcoal font-sans text-xs sm:text-sm shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden xs:inline">Back</span>
            </button>
            
            <h1 className="font-display text-sm sm:text-lg text-charcoal truncate">Edit Vision</h1>
            
            <button
              onClick={handleRegenerateBoard}
              disabled={isRegenerating || answeredCount === 0}
              className={cn(
                "flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-xl font-sans text-xs sm:text-sm font-medium transition-gentle shrink-0",
                answeredCount > 0 && !isRegenerating
                  ? "bg-gradient-to-r from-terracotta to-terracotta-dark text-cream hover:shadow-lg"
                  : "bg-sand/50 text-slate/50 cursor-not-allowed"
              )}
            >
              <RefreshCw className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", isRegenerating && "animate-spin")} />
              <span className="hidden sm:inline">Regenerate</span>
            </button>
          </div>
        </header>
      )}

      {/* Progress bar */}
      <div className={cn("fixed left-0 right-0 h-1 bg-sand z-50", isEditMode ? "top-14" : "top-0")}>
        <motion.div 
          className="h-full bg-gradient-to-r from-terracotta to-sage"
          initial={{ width: 0 }}
          animate={{ width: `${getProgress(currentIndex, prompts.length)}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Phase indicator */}
      <div className={cn("fixed left-1/2 -translate-x-1/2 z-40", isEditMode ? "top-20" : "top-6")}>
        <motion.div 
          key={currentPrompt?.phase}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10",
            "bg-gradient-to-r text-white/90",
            getCurrentPhaseColor()
          )}
        >
          <span>{getCurrentPhase()?.icon}</span>
          <span className="font-sans text-sm">{getCurrentPhase()?.label}</span>
          {getCurrentPhase()?.description && (
            <span className="text-xs opacity-70 hidden sm:inline">— {getCurrentPhase()?.description}</span>
          )}
        </motion.div>
      </div>

      {/* Main content */}
      <div className={cn("min-h-screen flex items-center justify-center px-4 sm:px-6", isEditMode ? "py-28 sm:py-32" : "py-20 sm:py-24")}>
        <div className="w-full max-w-2xl pb-16 sm:pb-0">
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
                onAnswerChange={setAnswerWithRef}
                onNext={handleNext}
                isSaving={isSaving}
                isLastOfPhase={
                  (phase === "prescribed" && isLastPrescribed) ||
                  (phase === "dynamic" && isAtEndOfCurrentBatch)
                }
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 pb-4 sm:pb-6 pt-4 bg-gradient-to-t from-cream to-transparent">
        <div className="flex items-center justify-center gap-2 sm:gap-4 px-4">
          {/* Back button */}
          <button
            onClick={handleBack}
            disabled={currentIndex === 0}
            className={cn(
              "p-2.5 sm:p-3 rounded-full bg-cream/90 backdrop-blur-sm border border-sand/50 transition-all duration-300 shrink-0",
              currentIndex === 0
                ? "opacity-0 pointer-events-none scale-90" 
                : "text-slate hover:text-charcoal hover:bg-cream hover:scale-105 shadow-sm"
            )}
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Progress dots - scrollable on mobile */}
          <div className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-cream/90 backdrop-blur-sm border border-sand/50 shadow-sm overflow-x-auto max-w-[60vw] sm:max-w-none scrollbar-hide">
            {/* Prescribed prompts */}
            {prescribedPrompts.map((prompt, idx) => {
              const isActive = idx === currentIndex;
              const hasAnswer = isPromptAnswered(prompt.id);
              
              return (
                <button
                  key={prompt.id}
                  onClick={() => goToPrompt(idx)}
                  className={cn(
                    "rounded-full transition-all duration-300 shrink-0",
                    isActive 
                      ? "w-5 sm:w-6 h-2 sm:h-2.5 bg-terracotta" 
                      : hasAnswer 
                        ? "w-2 sm:w-2.5 h-2 sm:h-2.5 bg-sage hover:scale-125" 
                        : "w-2 sm:w-2.5 h-2 sm:h-2.5 bg-sand/70 hover:bg-sand hover:scale-125"
                  )}
                  title={`Question ${idx + 1}`}
                />
              );
            })}
            
            {/* Separator if we have dynamic prompts */}
            {prompts.length > prescribedPrompts.length && (
              <div className="w-px h-3 sm:h-4 bg-sand/50 mx-0.5 sm:mx-1 shrink-0" />
            )}
            
            {/* Dynamic prompts */}
            {prompts.slice(prescribedPrompts.length).map((prompt, idx) => {
              const actualIdx = prescribedPrompts.length + idx;
              const isActive = actualIdx === currentIndex;
              const hasAnswer = isPromptAnswered(prompt.id);
              
              return (
                <button
                  key={prompt.id}
                  onClick={() => goToPrompt(actualIdx)}
                  className={cn(
                    "rounded-full transition-all duration-300 shrink-0",
                    isActive 
                      ? "w-5 sm:w-6 h-2 sm:h-2.5 bg-terracotta" 
                      : hasAnswer 
                        ? "w-2 sm:w-2.5 h-2 sm:h-2.5 bg-lavender hover:scale-125" 
                        : "w-2 sm:w-2.5 h-2 sm:h-2.5 bg-sand/70 hover:bg-sand hover:scale-125"
                  )}
                  title={`Question ${actualIdx + 1}`}
                />
              );
            })}
          </div>

          {/* Question count */}
          <div className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full bg-cream/90 backdrop-blur-sm border border-sand/50 shadow-sm shrink-0">
            <span className="font-sans text-[10px] sm:text-xs text-slate whitespace-nowrap">
              {currentIndex + 1} / {prompts.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PromptCardProps {
  prompt: JournalPrompt;
  answer: string;
  onAnswerChange: (value: string) => void;
  onNext: () => void;
  isSaving: boolean;
  isLastOfPhase: boolean;
}

function PromptCard({ 
  prompt, 
  answer, 
  onAnswerChange, 
  onNext, 
  isSaving,
  isLastOfPhase,
}: PromptCardProps) {
  const isInterlude = prompt.isInterlude;
  const showInput = !isInterlude;

  // Format subtext - handle bullet points for framework content
  const formatSubtext = (text: string) => {
    if (text.includes('\n•')) {
      const parts = text.split('\n');
      return (
        <div className="space-y-2">
          {parts.map((part, i) => {
            if (part.startsWith('•')) {
              return (
                <div key={i} className="flex items-start gap-3 pl-2">
                  <span className="text-terracotta mt-1">•</span>
                  <span>{part.substring(1).trim()}</span>
                </div>
              );
            }
            return part ? <p key={i}>{part}</p> : null;
          })}
        </div>
      );
    }
    return text;
  };

  return (
    <div className={cn(
      "prompt-card p-5 sm:p-8 md:p-12",
      isInterlude && "bg-gradient-to-br from-cream to-cream-dark/50"
    )}>
      {/* Interlude badge */}
      {isInterlude && prompt.id !== "welcome" && (
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-charcoal/10 text-charcoal/70 text-xs font-sans mb-3 sm:mb-4">
          📖 Key Concept
        </div>
      )}

      {/* Question/Title */}
      <h2 className={cn(
        "font-display text-charcoal mb-3 sm:mb-4 leading-relaxed",
        isInterlude ? "text-lg sm:text-xl md:text-2xl" : "text-xl sm:text-2xl md:text-3xl"
      )}>
        {prompt.question}
      </h2>
      
      {/* Subtext */}
      {prompt.subtext && (
        <div className={cn(
          "font-serif text-slate leading-relaxed text-sm sm:text-base",
          showInput ? "mb-6 sm:mb-8" : "mb-4 sm:mb-6",
          isInterlude && "sm:text-lg"
        )}>
          {formatSubtext(prompt.subtext)}
        </div>
      )}

      {/* Psychology technique badge */}
      {prompt.psychologyTechnique && (
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-lavender/30 text-slate text-xs font-sans mb-4 sm:mb-6">
          {prompt.psychologyTechnique}
        </div>
      )}

      {/* Answer input - only for non-interludes */}
      {showInput && (
        <div className="mb-6 sm:mb-8">
          <textarea
            value={answer}
            onChange={(e) => onAnswerChange(e.target.value)}
            placeholder={prompt.placeholder}
            className="journal-textarea w-full p-3 sm:p-4 rounded-2xl bg-cream-dark/30 border border-sand/50 focus:border-terracotta/50 transition-gentle min-h-[120px] sm:min-h-[150px] text-base"
            autoFocus
          />
        </div>
      )}

      {/* Action button */}
      <motion.button
        onClick={onNext}
        disabled={isSaving}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "w-full flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-sans font-medium transition-gentle text-sm sm:text-base",
          isInterlude 
            ? "bg-charcoal/90 hover:bg-charcoal text-cream hover:shadow-lg"
            : "bg-gradient-to-r from-terracotta to-terracotta-dark text-cream hover:shadow-lg"
        )}
      >
        {isSaving ? (
          <>
            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
            <span>Saving...</span>
          </>
        ) : (
          <>
            <span>
              {prompt.id === "welcome"
                ? "Begin Excavation" 
                : isInterlude
                  ? "I Understand"
                  : isLastOfPhase 
                    ? "Continue" 
                    : "Next"
              }
            </span>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </>
        )}
      </motion.button>
    </div>
  );
}

export default function JournalPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <JournalPageContent />
    </Suspense>
  );
}
