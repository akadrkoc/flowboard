"use client";

import Link from "next/link";
import { ChevronRight, LayoutGrid } from "lucide-react";
import { useBoardStore } from "@/store/boardStore";
import BoardSwitcher from "@/components/navbar/BoardSwitcher";
import SprintPanel from "@/components/navbar/SprintPanel";
import MembersPanel from "@/components/navbar/MembersPanel";
import UserControls from "@/components/navbar/UserControls";
import ViewTabs from "./ViewTabs";

export default function TopToolbar() {
  const activeSprint = useBoardStore((s) => s.activeSprint);

  return (
    <header className="relative z-40 flex items-center justify-between gap-4 h-14 px-4 sm:px-6 border-b border-[#ead7c3] dark:border-white/[0.06] bg-[#fbf6ef] dark:bg-[#16161e] flex-shrink-0">
      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2 flex-shrink-0 rounded-md px-1.5 py-1 hover:bg-[#dce0d9] dark:hover:bg-white/[0.05] transition-colors"
            aria-label="Go to home"
          >
            <LayoutGrid className="w-4 h-4 text-violet-400" />
            <span className="hidden sm:inline text-[13px] font-bold text-gray-900 dark:text-white">
              FlowBoard
            </span>
          </Link>

          <div className="hidden sm:block w-px h-5 bg-border/60" />

          <BoardSwitcher />

          {activeSprint && (
            <nav
              aria-label="Breadcrumb"
              className="hidden md:flex items-center gap-2 text-sm text-muted-foreground min-w-0"
            >
              <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
              <span className="truncate text-violet-600 dark:text-violet-300 max-w-[140px]">
                {activeSprint.name}
              </span>
            </nav>
          )}
        </div>

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
