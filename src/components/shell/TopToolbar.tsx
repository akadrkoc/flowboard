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
    <header className="flex items-center justify-between gap-3 h-12 px-4 border-b border-[#ead7c3] dark:border-white/[0.06] bg-[#fbf6ef]/80 dark:bg-[#12121a]/80 backdrop-blur-md flex-shrink-0">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <nav
          aria-label="Breadcrumb"
          className="hidden md:flex items-center gap-1.5 text-[12px] text-gray-500 dark:text-gray-400 min-w-0 flex-shrink-0"
        >
          <span className="font-medium text-gray-700 dark:text-gray-300 truncate max-w-[120px]">
            {boardName}
          </span>
          {activeSprint && (
            <>
              <ChevronRight className="w-3 h-3 flex-shrink-0" />
              <span className="truncate text-violet-600 dark:text-violet-300 max-w-[100px]">
                {activeSprint.name}
              </span>
            </>
          )}
        </nav>

        <ViewTabs />
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <SprintPanel />
        <MembersPanel />
        <div className="hidden sm:block w-px h-5 bg-[#ead7c3] dark:bg-white/[0.08]" />
        <UserControls />
      </div>
    </header>
  );
}
