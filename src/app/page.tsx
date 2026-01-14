"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Sparkles, BookOpen, ArrowRight, LayoutGrid, Plus } from "lucide-react";
import { db, Journal, createJournal, createBlankBoard as createBlankBoardDb } from "@/lib/storage/db";

export default function Home() {
  const router = useRouter();
  const [journals, setJournals] = useState<Journal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasExistingWork, setHasExistingWork] = useState<boolean | null>(null);
  const hasStartedNewJournal = useRef(false);

  useEffect(() => {
    const init = async () => {
      const allJournals = await db.journals.orderBy("updatedAt").reverse().toArray();
      const allBoards = await db.boards.toArray();
      
      const hasWork = allJournals.length > 0 || allBoards.length > 0;
      
      if (!hasWork && !hasStartedNewJournal.current) {
        // New user - create journal immediately and redirect
        hasStartedNewJournal.current = true;
        const date = new Date();
        const title = `New Journal — ${date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
        const journal = await createJournal(title);
        router.replace(`/journal/${journal.id}`);
        return;
      }
      
      setJournals(allJournals);
      setHasExistingWork(hasWork);
      setIsLoading(false);
    };
    init();
  }, [router]);

  const startNewJournal = async () => {
    const date = new Date();
    const title = `New Journal — ${date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    const journal = await createJournal(title);
    router.push(`/journal/${journal.id}`);
  };

  const continueJournal = (id: string) => {
    router.push(`/journal/${id}`);
  };

  const openBoard = (boardId: string) => {
    router.push(`/board/${boardId}`);
  };

  const createBlankBoard = async () => {
    const title = `Vision Board — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    const boardId = await createBlankBoardDb(title);
    router.push(`/board/${boardId}`);
  };

  // Show nothing while redirecting new users (prevents flash)
  if (isLoading || hasExistingWork === null || !hasExistingWork) {
    return null;
  }

  // Dashboard for returning users with existing work
  return (
    <main className="min-h-screen bg-gradient-warm">
      {/* Decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-radial from-rose/10 to-transparent rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-radial from-lavender/10 to-transparent rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="text-center mb-12 sm:mb-16"
        >
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-medium text-charcoal mb-4 leading-tight">
            Welcome Back
          </h1>
          <p className="font-serif text-lg sm:text-xl text-slate max-w-xl mx-auto leading-relaxed">
            Continue your transformation or start a new journey.
          </p>
        </motion.div>

        {/* Action Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8"
        >
          {/* Start New Journey */}
          <motion.button
            onClick={startNewJournal}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            className="group prompt-card p-6 sm:p-8 text-left transition-gentle hover:shadow-xl"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-terracotta to-terracotta-dark flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-gentle">
              <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-cream" />
            </div>
            <h2 className="font-display text-xl sm:text-2xl text-charcoal mb-2 sm:mb-3">
              New Journal
            </h2>
            <p className="font-serif text-sm sm:text-base text-slate mb-4 sm:mb-6">
              Start fresh with a new guided reflection and vision board.
            </p>
            <div className="flex items-center gap-2 text-terracotta-dark font-sans text-sm font-medium group-hover:gap-3 transition-all">
              <span>Start Protocol</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </motion.button>

          {/* Create Blank Board */}
          <motion.button
            onClick={createBlankBoard}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            className="group prompt-card p-6 sm:p-8 text-left transition-gentle hover:shadow-xl"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-lavender to-lavender-dark flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-gentle">
              <LayoutGrid className="w-6 h-6 sm:w-7 sm:h-7 text-cream" />
            </div>
            <h2 className="font-display text-xl sm:text-2xl text-charcoal mb-2 sm:mb-3">
              Blank Canvas
            </h2>
            <p className="font-serif text-sm sm:text-base text-slate mb-4 sm:mb-6">
              Create a vision board from scratch without the guided process.
            </p>
            <div className="flex items-center gap-2 text-lavender-dark font-sans text-sm font-medium group-hover:gap-3 transition-all">
              <Plus className="w-4 h-4" />
              <span>Create Board</span>
            </div>
          </motion.button>
        </motion.div>

        {/* Previous Work */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <motion.div
            className="prompt-card p-5 sm:p-8 transition-gentle"
          >
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-sage to-sage-dark flex items-center justify-center shrink-0">
                <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-cream" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-display text-xl sm:text-2xl text-charcoal mb-2 sm:mb-3">
                  Your Work
                </h2>
                <p className="font-serif text-sm sm:text-base text-slate mb-4 sm:mb-6">
                  Continue where you left off or revisit a previous excavation.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                  {journals.slice(0, 6).map((journal) => (
                    <button
                      key={journal.id}
                      onClick={() => journal.boardId ? openBoard(journal.boardId) : continueJournal(journal.id)}
                      className="flex items-center justify-between p-3 rounded-xl bg-cream-dark/50 hover:bg-cream-dark transition-gentle text-left group"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-serif text-charcoal text-sm truncate">{journal.title}</p>
                        <p className="font-sans text-xs text-slate">
                          {journal.boardId ? "View Board" : `${journal.responses.length} responses`}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate group-hover:text-terracotta transition-gentle shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}
