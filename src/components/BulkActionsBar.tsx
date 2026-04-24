"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useBoardStore } from "@/store/boardStore";
import { Trash2, MoveRight, X, ChevronDown } from "lucide-react";

// Secim modunda en az bir kart secildiginde ekranin altinda beliren
// aksiyon cubugu. Toplu tasima ve silme burada yapilir.
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

  // Mode kapandi veya hic kart secilmedi ise sadece "exit" butonu kalacak.
  if (!selectMode) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 px-4 w-full max-w-md pointer-events-none">
      <div className="pointer-events-auto mx-auto flex items-center gap-2 rounded-full border border-[#ead7c3] dark:border-white/[0.08] bg-[#fbf6ef] dark:bg-[#1e1e2e] shadow-xl px-3 py-2">
        <span className="text-[12px] font-semibold text-gray-800 dark:text-gray-100 pl-1">
          {selectedCount} selected
        </span>

        {/* Move to... */}
        <div className="relative" ref={popRef}>
          <button
            onClick={() => setMoveOpen((v) => !v)}
            disabled={selectedCount === 0}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium text-gray-700 dark:text-gray-200 bg-[#dce0d9] dark:bg-white/[0.05] hover:bg-[#d4c4ae] dark:hover:bg-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Move to column"
          >
            <MoveRight className="w-3 h-3" />
            Move
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {moveOpen && (
            <div className="absolute bottom-full mb-2 left-0 min-w-[140px] rounded-lg border border-[#ead7c3] dark:border-white/[0.08] bg-[#fbf6ef] dark:bg-[#1e1e2e] shadow-xl p-1">
              {columns.map((col) => (
                <button
                  key={col.id}
                  onClick={() => {
                    bulkMoveSelected(col.id);
                    setMoveOpen(false);
                  }}
                  className="w-full text-left px-2 py-1 rounded-md text-[11px] text-gray-700 dark:text-gray-200 hover:bg-[#dce0d9] dark:hover:bg-white/[0.05] transition-colors"
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
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Delete selected"
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                bulkDeleteSelected();
                setConfirmDelete(false);
              }}
              className="px-2.5 py-1 rounded-full text-[11px] font-semibold text-white bg-red-600 hover:bg-red-500 transition-colors"
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-2 py-1 rounded-full text-[11px] font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              No
            </button>
          </div>
        )}

        {selectedCount > 0 && (
          <button
            onClick={clearSelection}
            className="px-2 py-1 rounded-full text-[11px] font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-[#dce0d9] dark:hover:bg-white/[0.05] transition-colors"
            title="Clear selection"
          >
            Clear
          </button>
        )}

        <button
          onClick={() => setSelectMode(false)}
          className="ml-auto p-1 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-[#dce0d9] dark:hover:bg-white/[0.05] transition-colors"
          title="Exit select mode"
          aria-label="Exit select mode"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
