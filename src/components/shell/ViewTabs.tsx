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
    <div
      role="tablist"
      aria-label="Board views"
      className="flex items-center gap-0.5 p-1 rounded-lg bg-muted/50"
    >
      {VIEW_TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          role="tab"
          aria-selected={activeView === id}
          aria-label={label}
          title={label}
          onClick={() => setActiveView(id)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            activeView === id
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Icon className="w-4 h-4" />
          <span className="hidden lg:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
