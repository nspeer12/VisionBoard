"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { createJournal } from "@/lib/storage/db";

export default function Home() {
  const router = useRouter();
  const hasStarted = useRef(false);

  useEffect(() => {
    const init = async () => {
      if (hasStarted.current) return;
      hasStarted.current = true;
      
      // Always create a new journal and go straight to questionnaire
      const date = new Date();
      const title = `New Journal — ${date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
      const journal = await createJournal(title);
      router.replace(`/journal/${journal.id}`);
    };
    init();
  }, [router]);

  // Show nothing while creating journal
  return null;
}
