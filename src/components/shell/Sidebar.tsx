"use client";

import { useState, useEffect } from "react";
import { LayoutGrid, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useBoardStore } from "@/store/boardStore";
import { useBoardNavigation } from "@/hooks/useBoardNavigation";

interface SidebarProps {
  boardId: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({
  boardId,
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  const boards = useBoardStore((s) => s.boards);
  const loadBoards = useBoardStore((s) => s.loadBoards);
  const { navigateToBoard, createAndNavigate } = useBoardNavigation();
  const [newBoardName, setNewBoardName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  const handleCreate = async () => {
    const name = newBoardName.trim();
    if (!name) return;
    setCreating(true);
    try {
      await createAndNavigate(name);
      setNewBoardName("");
    } catch {
      // pushError in store
    } finally {
      setCreating(false);
    }
  };

  return (
    <aside
      className={`flex flex-col flex-shrink-0 border-r border-[#ead7c3] dark:border-white/[0.06] bg-[#f3ede4] dark:bg-[#0f0f17] transition-all duration-200 ${
        collapsed ? "w-14" : "w-56"
      }`}
    >
      <div className="flex items-center justify-between h-12 px-3 border-b border-[#ead7c3] dark:border-white/[0.06]">
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <LayoutGrid className="w-4 h-4 text-violet-400 flex-shrink-0" />
            <span className="text-[13px] font-bold text-gray-900 dark:text-white truncate">
              FlowBoard
            </span>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`p-1.5 rounded-md hover:bg-[#dce0d9] dark:hover:bg-white/[0.05] text-gray-500 dark:text-gray-400 transition-colors ${
            collapsed ? "mx-auto" : ""
          }`}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {!collapsed && (
          <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Boards
          </p>
        )}
        <nav className="space-y-0.5 px-2">
          {boards.map((b) => {
            const isActive = b.id === boardId;
            return (
              <button
                key={b.id}
                onClick={() => navigateToBoard(b.id)}
                title={collapsed ? b.name : undefined}
                className={`w-full flex items-center gap-2 px-2 py-2 rounded-md text-left transition-colors ${
                  isActive
                    ? "bg-violet-500/15 text-violet-600 dark:text-violet-300"
                    : "text-gray-600 dark:text-gray-400 hover:bg-[#dce0d9] dark:hover:bg-white/[0.04]"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    isActive ? "bg-violet-500" : "bg-gray-400/50"
                  }`}
                />
                {!collapsed && (
                  <span className="text-[12px] font-medium truncate">{b.name}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {!collapsed && (
        <div className="p-2 border-t border-[#ead7c3] dark:border-white/[0.06]">
          <div className="flex items-center gap-1.5">
            <input
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="New board..."
              className="flex-1 min-w-0 rounded-md border border-[#ead7c3] dark:border-white/[0.08] bg-[#dce0d9] dark:bg-white/[0.03] px-2 py-1.5 text-[11px] text-gray-800 dark:text-gray-100 outline-none focus:border-violet-400 transition-colors"
            />
            <button
              onClick={handleCreate}
              disabled={!newBoardName.trim() || creating}
              aria-label="Create board"
              className="p-1.5 rounded-md bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
