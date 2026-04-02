"use client";

import { useBoardStore } from "@/store/boardStore";
import { CheckCircle2, Layers, Flame, Users, TrendingUp } from "lucide-react";

export default function StatsBar() {
  const columns = useBoardStore((s) => s.columns);

  const allCards = columns.flatMap((col) => col.cards);
  const totalCards = allCards.length;
  const lastColumn = columns[columns.length - 1];
  const doneCards = lastColumn?.cards.length ?? 0;
  const totalPoints = allCards.reduce((sum, c) => sum + c.storyPoints, 0);
  const donePercent = totalCards > 0 ? Math.round((doneCards / totalCards) * 100) : 0;

  return (
    <div className="flex items-center justify-between h-11 px-5 border-t border-white/[0.06] bg-[#12121a]/80 backdrop-blur-md text-[11px]">
      <div className="flex items-center gap-5">
        <span className="flex items-center gap-1.5 text-gray-400">
          <Layers className="w-3.5 h-3.5" />
          <span className="font-medium text-gray-300">{totalCards}</span> cards
        </span>

        <span className="flex items-center gap-1.5 text-gray-400">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-medium text-gray-300">{doneCards}</span> done
        </span>

        <span className="flex items-center gap-1.5 text-gray-400">
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-medium text-gray-300">{totalPoints}</span> pts
        </span>

        {/* Progress bar */}
        <div className="hidden sm:flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
          <div className="w-24 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${donePercent}%` }}
            />
          </div>
          <span className="text-gray-400 font-medium">{donePercent}%</span>
        </div>
      </div>

      <span className="flex items-center gap-1.5 text-gray-400">
        <Users className="w-3.5 h-3.5" />
        <span className="font-medium text-emerald-400">3</span> online
      </span>
    </div>
  );
}
