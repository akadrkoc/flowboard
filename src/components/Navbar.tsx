"use client";

import { LayoutGrid, BarChart3 } from "lucide-react";
import { useBoardStore } from "@/store/boardStore";
import BoardSwitcher from "./navbar/BoardSwitcher";
import SprintPanel from "./navbar/SprintPanel";
import MembersPanel from "./navbar/MembersPanel";
import UserControls from "./navbar/UserControls";

export default function Navbar() {
  const activeView = useBoardStore((s) => s.activeView);
  const setActiveView = useBoardStore((s) => s.setActiveView);

  return (
    <nav className="relative z-50 flex items-center justify-between h-12 sm:h-14 px-3 sm:px-5 border-b border-[#ead7c3] dark:border-white/[0.06] bg-[#fbf6ef]/80 dark:bg-[#12121a]/80 backdrop-blur-md">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <button
          onClick={() => setActiveView("kanban")}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0"
          title="FlowBoard"
        >
          <LayoutGrid className="w-5 h-5 text-violet-400" />
        </button>

        <BoardSwitcher />
        <SprintPanel />
      </div>

      <button
        onClick={() =>
          setActiveView(activeView === "analytics" ? "kanban" : "analytics")
        }
        className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
          activeView === "analytics"
            ? "bg-violet-500/15 text-violet-600 dark:text-violet-300"
            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-[#dce0d9] dark:hover:bg-white/[0.05]"
        }`}
      >
        <BarChart3 className="w-3.5 h-3.5" />
        Analytics
      </button>

      <div className="flex items-center gap-2 sm:gap-3">
        <MembersPanel />
        <div className="w-px h-5 bg-[#ead7c3] dark:bg-white/[0.08]" />
        <UserControls />
      </div>
    </nav>
  );
}
