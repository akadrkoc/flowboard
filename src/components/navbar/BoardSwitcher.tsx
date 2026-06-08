"use client";

import { useState, useEffect } from "react";
import { Check, ChevronDown, Plus, X } from "lucide-react";
import { useBoardStore } from "@/store/boardStore";
import { useBoardNavigation } from "@/hooks/useBoardNavigation";
import { useClickOutside } from "@/hooks/useClickOutside";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function BoardSwitcher() {
  const boardId = useBoardStore((s) => s.boardId);
  const boards = useBoardStore((s) => s.boards);
  const loadBoards = useBoardStore((s) => s.loadBoards);
  const { navigateToBoard, createAndNavigate } = useBoardNavigation();

  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [creating, setCreating] = useState(false);
  const dialogRef = useClickOutside(open, () => setOpen(false));

  useEffect(() => {
    loadBoards();
  }, [loadBoards]);

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
      await createAndNavigate(name);
      setNewBoardName("");
      setCreateOpen(false);
      setOpen(false);
    } catch {
      // Store pushError handles feedback.
    } finally {
      setCreating(false);
    }
  };

  const handleCreateOpenChange = (next: boolean) => {
    setCreateOpen(next);
    if (!next) setNewBoardName("");
  };

  const handleSwitchBoard = async (id: string) => {
    if (id === boardId) {
      setOpen(false);
      return;
    }
    await navigateToBoard(id);
    setOpen(false);
  };

  const openCreateDialog = () => {
    setOpen(false);
    setCreateOpen(true);
  };

  return (
    <>
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
              <button
                onClick={() => setOpen(false)}
                aria-label="Close board switcher"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="space-y-0.5 max-h-56 overflow-y-auto mb-2">
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

            <button
              onClick={openCreateDialog}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-md border border-dashed border-[#ead7c3] dark:border-white/[0.1] text-[12px] font-medium text-gray-600 dark:text-gray-300 hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-300 hover:bg-violet-500/5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New board
            </button>
          </div>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={handleCreateOpenChange}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New board</DialogTitle>
            <DialogDescription>Give your board a name.</DialogDescription>
          </DialogHeader>
          <input
            autoFocus
            value={newBoardName}
            onChange={(e) => setNewBoardName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateBoard()}
            placeholder="Board name..."
            className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-violet-500/40 transition-colors"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateBoard}
              disabled={!newBoardName.trim() || creating}
              className="flex-1 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium text-white transition-colors"
            >
              Create board
            </button>
            <button
              onClick={() => handleCreateOpenChange(false)}
              className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
