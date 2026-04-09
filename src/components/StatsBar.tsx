"use client";

import { useBoardStore } from "@/store/boardStore";
import { CheckCircle2, Layers, Flame, Users, TrendingUp } from "lucide-react";

export default function StatsBar() {
  const columns = useBoardStore((s) => s.columns);
  const memberCount = useBoardStore((s) => s.members.length);

  const allCards = columns.flatMap((col) => col.cards);
  const totalCards = allCards.length;
  const lastColumn = columns[columns.length - 1];
  const doneCards = lastColumn?.cards.length ?? 0;
  const totalPoints = allCards.reduce((sum, c) => sum + c.storyPoints, 0);
  const donePercent = totalCards > 0 ? Math.round((doneCards / totalCards) * 100) : 0;

  return (
    <div className="flex items-center justify-between h-10 sm:h-11 px-3 sm:px-5 border-t border-[#ead7c3] dark:border-white/[0.06] bg-[#fbf6ef]/80 dark:bg-[#12121a]/80 backdrop-blur-md text-[10px] sm:text-[11px]">
      <div className="flex items-center gap-3 sm:gap-5 min-w-0 overflow-x-auto">
        <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 flex-shrink-0">
          <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span className="font-medium text-gray-700 dark:text-gray-300">{totalCards}</span> cards
        </span>

        <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 flex-shrink-0">
          <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500 dark:text-emerald-400" />
          <span className="font-medium text-gray-700 dark:text-gray-300">{doneCards}</span> done
        </span>

        <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 flex-shrink-0">
          <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 dark:text-amber-400" />
          <span className="font-medium text-gray-700 dark:text-gray-300">{totalPoints}</span> pts
        </span>

        {/* Progress bar */}
        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
          <div className="w-20 lg:w-24 h-1.5 rounded-full bg-[#dce0d9] dark:bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${donePercent}%` }}
            />
          </div>
          <span className="text-gray-500 dark:text-gray-400 font-medium">{donePercent}%</span>
        </div>
      </div>

      <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 flex-shrink-0 ml-3">
        <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        <span className="font-medium text-emerald-500 dark:text-emerald-400">{memberCount || 1}</span>
        <span className="hidden sm:inline">{memberCount === 1 ? " member" : " members"}</span>
      </span>
    </div>
  );
}
