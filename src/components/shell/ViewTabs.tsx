"use client";

import {
  LayoutGrid,
  List,
  Calendar,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import { useBoardStore } from "@/store/boardStore";
import type { BoardView } from "@/types/views";

const VIEW_TABS: { id: BoardView; label: string; icon: LucideIcon }[] = [
  { id: "kanban", label: "Board", icon: LayoutGrid },
  { id: "list", label: "List", icon: List },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
];

export default function ViewTabs() {
  const activeView = useBoardStore((s) => s.activeView);
  const setActiveView = useBoardStore((s) => s.setActiveView);

  return (
    <div className="flex items-center gap-1 ml-0 sm:ml-3 p-0.5 rounded-lg bg-[#dce0d9]/60 dark:bg-white/[0.04] overflow-x-auto max-w-[calc(100vw-8rem)] sm:max-w-none">
      {VIEW_TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => setActiveView(id)}
          className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
            activeView === id
              ? "bg-[#fbf6ef] dark:bg-[#1e1e2e] text-gray-900 dark:text-white shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
