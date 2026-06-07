"use client";

import { LayoutGrid, BarChart3, ChevronRight } from "lucide-react";
import { useBoardStore } from "@/store/boardStore";
import SprintPanel from "@/components/navbar/SprintPanel";
import MembersPanel from "@/components/navbar/MembersPanel";
import UserControls from "@/components/navbar/UserControls";

interface TopToolbarProps {
  boardId: string;
}

export default function TopToolbar({ boardId }: TopToolbarProps) {
  const boards = useBoardStore((s) => s.boards);
  const activeView = useBoardStore((s) => s.activeView);
  const setActiveView = useBoardStore((s) => s.setActiveView);
  const activeSprint = useBoardStore((s) => s.activeSprint);

  const boardName = boards.find((b) => b.id === boardId)?.name ?? "Board";

  return (
    <header className="flex items-center justify-between gap-3 h-12 px-4 border-b border-[#ead7c3] dark:border-white/[0.06] bg-[#fbf6ef]/80 dark:bg-[#12121a]/80 backdrop-blur-md flex-shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <nav
          aria-label="Breadcrumb"
          className="hidden sm:flex items-center gap-1.5 text-[12px] text-gray-500 dark:text-gray-400 min-w-0"
        >
          <span className="font-medium text-gray-700 dark:text-gray-300 truncate">
            {boardName}
          </span>
          {activeSprint && (
            <>
              <ChevronRight className="w-3 h-3 flex-shrink-0" />
              <span className="truncate text-violet-600 dark:text-violet-300">
                {activeSprint.name}
              </span>
            </>
          )}
        </nav>

        <div className="flex items-center gap-1 ml-0 sm:ml-3 p-0.5 rounded-lg bg-[#dce0d9]/60 dark:bg-white/[0.04]">
          <button
            onClick={() => setActiveView("kanban")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
              activeView === "kanban"
                ? "bg-[#fbf6ef] dark:bg-[#1e1e2e] text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Board
          </button>
          <button
            onClick={() => setActiveView("analytics")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
              activeView === "analytics"
                ? "bg-[#fbf6ef] dark:bg-[#1e1e2e] text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Analytics
          </button>
        </div>
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
