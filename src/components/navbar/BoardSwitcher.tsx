"use client";

import { useState, useEffect } from "react";
import { Check, ChevronDown, Plus, X } from "lucide-react";
import { useBoardStore } from "@/store/boardStore";
import { useClickOutside } from "@/hooks/useClickOutside";

export default function BoardSwitcher() {
  const boardId = useBoardStore((s) => s.boardId);
  const boards = useBoardStore((s) => s.boards);
  const loadBoards = useBoardStore((s) => s.loadBoards);
  const switchBoard = useBoardStore((s) => s.switchBoard);
  const createBoard = useBoardStore((s) => s.createBoard);

  const [open, setOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [creating, setCreating] = useState(false);
  const dialogRef = useClickOutside(open, () => setOpen(false));

  useEffect(() => {
    if (open) loadBoards();
  }, [open, loadBoards]);

  const currentBoardName =
    boards.find((b) => b.id === boardId)?.name || "Board";

  const handleCreateBoard = async () => {
    const name = newBoardName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const created = await createBoard(name);
      setNewBoardName("");
      await switchBoard(created.id);
      setOpen(false);
    } catch {
      // Store pushError handles feedback.
    } finally {
      setCreating(false);
    }
  };

  const handleSwitchBoard = async (id: string) => {
    if (id === boardId) {
      setOpen(false);
      return;
    }
    await switchBoard(id);
    setOpen(false);
  };

  return (
    <div className="relative min-w-0">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Switch board"
        aria-expanded={open}
        className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-1 rounded-md hover:bg-[#dce0d9] dark:hover:bg-white/[0.05] transition-colors min-w-0"
      >
        <span className="text-[13px] sm:text-[14px] font-bold text-gray-900 dark:text-white tracking-tight truncate max-w-[140px] sm:max-w-[200px]">
          {currentBoardName}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
      </button>

      {open && (
        <div
          ref={dialogRef}
          className="absolute left-0 top-full mt-2 w-[calc(100vw-1.5rem)] sm:w-72 max-w-[18rem] rounded-lg border border-[#ead7c3] dark:border-white/[0.08] bg-[#fbf6ef] dark:bg-[#1e1e2e] shadow-xl z-50 p-3"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-semibold text-gray-800 dark:text-gray-100">
              Boards ({boards.length})
            </h3>
            <button onClick={() => setOpen(false)} aria-label="Close board switcher">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <div className="space-y-0.5 max-h-56 overflow-y-auto mb-3">
            {boards.map((b) => {
              const isCurrent = b.id === boardId;
              return (
                <button
                  key={b.id}
                  onClick={() => handleSwitchBoard(b.id)}
                  className={`w-full flex items-center justify-between gap-2 py-1.5 px-2 rounded-md text-left transition-colors ${
                    isCurrent
                      ? "bg-violet-500/15 text-violet-600 dark:text-violet-300"
                      : "text-gray-700 dark:text-gray-300 hover:bg-[#dce0d9] dark:hover:bg-white/[0.03]"
                  }`}
                >
                  <span className="text-[12px] font-medium truncate">
                    {b.name}
                  </span>
                  {isCurrent && (
                    <Check className="w-3.5 h-3.5 flex-shrink-0" />
                  )}
                </button>
              );
            })}
            {boards.length === 0 && (
              <p className="text-[11px] text-gray-500 dark:text-gray-400 py-2 text-center">
                No boards yet
              </p>
            )}
          </div>

          <div className="border-t border-[#ead7c3] dark:border-white/[0.06] pt-2.5">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">
              Create new board
            </p>
            <div className="flex items-center gap-2">
              <input
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateBoard();
                }}
                placeholder="Board name..."
                className="flex-1 rounded-md border border-[#ead7c3] dark:border-white/[0.08] bg-[#dce0d9] dark:bg-white/[0.03] px-2.5 py-1.5 text-[11px] text-gray-800 dark:text-gray-100 outline-none focus:border-violet-400 transition-colors"
              />
              <button
                onClick={handleCreateBoard}
                disabled={!newBoardName.trim() || creating}
                className="flex items-center gap-1 px-2 py-1.5 rounded-md bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-medium text-white transition-colors"
              >
                <Plus className="w-3 h-3" />
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
