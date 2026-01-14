"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sparkles, BookOpen, ArrowRight, LayoutGrid, Plus } from "lucide-react";
import { db, Journal, createBlankBoard as createBlankBoardDb } from "@/lib/storage/db";

export default function Home() {
  const router = useRouter();
  const [journals, setJournals] = useState<Journal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadJournals = async () => {
      const allJournals = await db.journals.orderBy("updatedAt").reverse().toArray();
      setJournals(allJournals);
      setIsLoading(false);
    };
    loadJournals();
  }, []);

  const startNewJournal = () => {
    router.push("/journal/new");
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

  return (
    <main className="min-h-screen bg-gradient-warm">
      {/* Decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-radial from-rose/10 to-transparent rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-radial from-lavender/10 to-transparent rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-20">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cream-dark/60 text-terracotta-dark text-sm font-sans mb-8"
          >
            <Sparkles className="w-4 h-4" />
            <span>The Transformation Protocol</span>
          </motion.div>

          <h1 className="font-display text-5xl md:text-7xl font-medium text-charcoal mb-6 leading-tight">
            Excavate.
            <br />
            <span className="text-gradient">Transform.</span>
            <br />
            Become.
          </h1>

          <p className="font-serif text-xl text-slate max-w-xl mx-auto leading-relaxed">
            A deep psychological excavation to uncover your hidden patterns, 
            confront uncomfortable truths, and build a vision so clear that 
            distractions lose their power.
          </p>
        </motion.div>

        {/* Action Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="grid md:grid-cols-2 gap-6 mb-8"
        >
          {/* Start New Journey */}
          <motion.button
            onClick={startNewJournal}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            className="group prompt-card p-8 text-left transition-gentle hover:shadow-xl"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-terracotta to-terracotta-dark flex items-center justify-center mb-6 group-hover:scale-110 transition-gentle">
              <Sparkles className="w-7 h-7 text-cream" />
            </div>
            <h2 className="font-display text-2xl text-charcoal mb-3">
              Begin Excavation
            </h2>
            <p className="font-serif text-slate mb-6">
              A deep dive into your psyche. Uncover hidden patterns, 
              confront your anti-vision, and build an unshakeable vision.
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
            className="group prompt-card p-8 text-left transition-gentle hover:shadow-xl"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-lavender to-lavender-dark flex items-center justify-center mb-6 group-hover:scale-110 transition-gentle">
              <LayoutGrid className="w-7 h-7 text-cream" />
            </div>
            <h2 className="font-display text-2xl text-charcoal mb-3">
              Blank Canvas
            </h2>
            <p className="font-serif text-slate mb-6">
              Skip the guided reflection and dive straight into 
              creating your vision board from scratch.
            </p>
            <div className="flex items-center gap-2 text-lavender-dark font-sans text-sm font-medium group-hover:gap-3 transition-all">
              <Plus className="w-4 h-4" />
              <span>Create Board</span>
            </div>
          </motion.button>
        </motion.div>

        {/* Continue / Previous Work */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mb-16"
        >
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="prompt-card p-8 transition-gentle hover:shadow-xl"
          >
            <div className="flex items-start gap-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sage to-sage-dark flex items-center justify-center shrink-0">
                <BookOpen className="w-7 h-7 text-cream" />
              </div>
              <div className="flex-1">
                <h2 className="font-display text-2xl text-charcoal mb-3">
                  Continue the Work
                </h2>
                <p className="font-serif text-slate mb-6">
                  Pick up where you left off or revisit a previous 
                  excavation to deepen your transformation.
                </p>
                
                {isLoading ? (
                  <div className="h-12 bg-cream-dark/50 rounded-xl animate-pulse" />
                ) : journals.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
                ) : (
                  <p className="font-sans text-sm text-slate/60 italic">
                    No journals yet. Start your first journey above.
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Philosophy */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="text-center"
        >
          <p className="font-serif text-lg text-slate/80 max-w-2xl mx-auto italic">
            "If you want a specific outcome in life, you must have the lifestyle 
            that creates that outcome long before you reach it."
          </p>
          <p className="font-sans text-sm text-slate/60 mt-2">— Dan Koe</p>
        </motion.div>
      </div>
    </main>
  );
}
