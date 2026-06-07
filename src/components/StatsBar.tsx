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
    <div className="flex items-center justify-between h-11 px-4 sm:px-6 border-t border-[#ead7c3] dark:border-white/[0.06] bg-[#fbf6ef] dark:bg-[#16161e] text-xs">
      <div className="flex items-center gap-4 sm:gap-6 min-w-0 overflow-x-auto">
        <span className="flex items-center gap-2 text-muted-foreground flex-shrink-0">
          <Layers className="w-3.5 h-3.5" />
          <span className="font-medium text-foreground">{totalCards}</span>
          <span>cards</span>
        </span>

        <span className="flex items-center gap-2 text-muted-foreground flex-shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span className="font-medium text-foreground">{doneCards}</span>
          <span>done</span>
        </span>

        <span className="flex items-center gap-2 text-muted-foreground flex-shrink-0">
          <Flame className="w-3.5 h-3.5 text-amber-500" />
          <span className="font-medium text-foreground">{totalPoints}</span>
          <span>pts</span>
        </span>

        <div className="hidden md:flex items-center gap-2.5 flex-shrink-0">
          <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
          <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${donePercent}%` }}
            />
          </div>
          <span className="text-muted-foreground font-medium">{donePercent}%</span>
        </div>
      </div>

      <span className="flex items-center gap-2 text-muted-foreground flex-shrink-0 ml-4">
        <Users className="w-3.5 h-3.5" />
        <span className="font-medium text-emerald-500">{memberCount || 1}</span>
        <span className="hidden sm:inline">
          {memberCount === 1 ? "member" : "members"}
        </span>
      </span>
    </div>
  );
}
