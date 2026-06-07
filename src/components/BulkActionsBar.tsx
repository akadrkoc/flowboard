"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useBoardStore } from "@/store/boardStore";
import { Trash2, MoveRight, X } from "lucide-react";

export default function BulkActionsBar() {
  const selectMode = useBoardStore((s) => s.selectMode);
  const selectedCardIds = useBoardStore((s) => s.selectedCardIds);
  const columns = useBoardStore((s) => s.columns);
  const setSelectMode = useBoardStore((s) => s.setSelectMode);
  const clearSelection = useBoardStore((s) => s.clearSelection);
  const bulkDeleteSelected = useBoardStore((s) => s.bulkDeleteSelected);
  const bulkMoveSelected = useBoardStore((s) => s.bulkMoveSelected);

  const [moveOpen, setMoveOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const popRef = useRef<HTMLDivElement>(null);

  const selectedCount = useMemo(
    () => Object.keys(selectedCardIds).length,
    [selectedCardIds]
  );

  useEffect(() => {
    if (!moveOpen) return;
    const onClick = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        setMoveOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [moveOpen]);

  if (!selectMode) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 px-4 w-full max-w-sm pointer-events-none">
      <div className="pointer-events-auto mx-auto flex items-center gap-1 rounded-xl border border-border bg-background shadow-2xl px-2 py-1.5">
        <span className="px-2 text-sm font-medium text-foreground whitespace-nowrap">
          {selectedCount} selected
        </span>

        <div className="w-px h-5 bg-border/60" />

        {/* Move */}
        <div className="relative" ref={popRef}>
          <button
            onClick={() => setMoveOpen((v) => !v)}
            disabled={selectedCount === 0}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Move to column"
          >
            <MoveRight className="w-4 h-4" />
          </button>

          {moveOpen && (
            <div className="absolute bottom-full mb-2 left-0 min-w-[160px] rounded-lg border border-border bg-popover shadow-xl p-1">
              {columns.map((col) => (
                <button
                  key={col.id}
                  onClick={() => {
                    bulkMoveSelected(col.id);
                    setMoveOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-md text-sm text-foreground hover:bg-muted transition-colors"
                >
                  {col.title}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Delete */}
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            disabled={selectedCount === 0}
            className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Delete selected"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        ) : (
          <>
            <button
              onClick={() => {
                bulkDeleteSelected();
                setConfirmDelete(false);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-500 transition-colors"
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-2 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </>
        )}

        {selectedCount > 0 && (
          <>
            <div className="w-px h-5 bg-border/60" />
            <button
              onClick={clearSelection}
              className="px-2 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Clear selection"
            >
              Clear
            </button>
          </>
        )}

        <div className="w-px h-5 bg-border/60" />

        <button
          onClick={() => setSelectMode(false)}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Exit select mode"
          aria-label="Exit select mode"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
