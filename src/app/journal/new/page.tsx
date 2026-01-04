"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createJournal } from "@/lib/storage/db";

export default function NewJournalPage() {
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const date = new Date();
      const title = `My 2026 Vision — ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
      const journal = await createJournal(title);
      router.replace(`/journal/${journal.id}`);
    };
    init();
  }, [router]);

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="font-serif text-slate">Preparing your journey...</p>
      </div>
    </div>
  );
}
