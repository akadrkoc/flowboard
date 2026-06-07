"use client";

import { ChevronRight } from "lucide-react";
import { useBoardStore } from "@/store/boardStore";
import SprintPanel from "@/components/navbar/SprintPanel";
import MembersPanel from "@/components/navbar/MembersPanel";
import UserControls from "@/components/navbar/UserControls";
import ViewTabs from "./ViewTabs";

interface TopToolbarProps {
  boardId: string;
}

export default function TopToolbar({ boardId }: TopToolbarProps) {
  const boards = useBoardStore((s) => s.boards);
  const activeSprint = useBoardStore((s) => s.activeSprint);

  const boardName = boards.find((b) => b.id === boardId)?.name ?? "Board";

  return (
    <header className="relative z-40 flex items-center justify-between gap-4 h-14 px-4 sm:px-6 border-b border-[#ead7c3] dark:border-white/[0.06] bg-[#fbf6ef] dark:bg-[#16161e] flex-shrink-0">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <nav
          aria-label="Breadcrumb"
          className="hidden md:flex items-center gap-2 text-sm text-muted-foreground min-w-0 flex-shrink-0"
        >
          <span className="font-medium text-foreground truncate max-w-[160px]">
            {boardName}
          </span>
          {activeSprint && (
            <>
              <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
              <span className="truncate text-violet-600 dark:text-violet-300 max-w-[140px]">
                {activeSprint.name}
              </span>
            </>
          )}
        </nav>

        <ViewTabs />
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <SprintPanel />
        <MembersPanel />
        <div className="hidden sm:block w-px h-6 bg-border/60" />
        <UserControls />
      </div>
    </header>
  );
}
