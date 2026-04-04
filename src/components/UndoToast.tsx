"use client";

import { useEffect } from "react";
import { useBoardStore } from "@/store/boardStore";
import { Undo2 } from "lucide-react";

export default function UndoToast() {
  const lastDeletedCard = useBoardStore((s) => s.lastDeletedCard);
  const restoreCard = useBoardStore((s) => s.restoreCard);
  const dismissUndo = useBoardStore((s) => s.dismissUndo);

  useEffect(() => {
    if (!lastDeletedCard) return;
    const timer = setTimeout(() => dismissUndo(), 5000);
    return () => clearTimeout(timer);
  }, [lastDeletedCard, dismissUndo]);

  if (!lastDeletedCard) return null;

  return (
    <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-lg shadow-black/20 animate-in slide-in-from-bottom-4 fade-in duration-200">
      <span className="text-[13px]">
        Deleted <strong className="font-semibold">&quot;{lastDeletedCard.title}&quot;</strong>
      </span>
      <button
        onClick={restoreCard}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/20 dark:bg-black/10 hover:bg-white/30 dark:hover:bg-black/20 text-[12px] font-medium transition-colors"
      >
        <Undo2 className="w-3.5 h-3.5" />
        Undo
      </button>
    </div>
  );
}
