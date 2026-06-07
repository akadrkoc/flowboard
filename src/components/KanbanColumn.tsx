"use client";

import { useState, useRef, useEffect } from "react";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import type { Column } from "@/types/board";
import { useBoardStore } from "@/store/boardStore";
import { getColumnStatusStyle } from "@/lib/columnColors";
import KanbanCard from "./KanbanCard";
import AddCardForm from "./AddCardForm";
import { MoreHorizontal, Trash2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface KanbanColumnProps {
  column: Column;
  index?: number;
  isLast?: boolean;
}

export default function KanbanColumn({ column, index = 0, isLast }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: "column", column },
  });

  const renameColumn = useBoardStore((s) => s.renameColumn);
  const deleteColumn = useBoardStore((s) => s.deleteColumn);
  const addColumn = useBoardStore((s) => s.addColumn);
  const columnsCount = useBoardStore((s) => s.columns.length);

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(column.title);
  const [menuOpen, setMenuOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const cardIds = column.cards.map((c) => c.id);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const handleRename = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== column.title) {
      renameColumn(column.id, trimmed);
    } else {
      setEditName(column.title);
    }
    setEditing(false);
  };

  const handleAddColumn = () => {
    const trimmed = newColumnName.trim();
    if (!trimmed) return;
    addColumn(trimmed);
    setNewColumnName("");
    setAddDialogOpen(false);
  };

  const statusStyle = getColumnStatusStyle(index);

  return (
    <div className="flex-shrink-0 flex flex-col md:flex-row gap-2">
      <div className="w-full md:w-[280px] lg:w-[300px] flex flex-col md:max-h-full">
        {/* Column header — status chip */}
        <div
          className={`flex items-center gap-2 px-2.5 py-1.5 mb-3 rounded-lg border ${statusStyle.chip}`}
        >
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusStyle.dot}`} />
          {editing ? (
            <input
              ref={inputRef}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") {
                  setEditName(column.title);
                  setEditing(false);
                }
              }}
              className="flex-1 text-[12px] font-semibold bg-transparent outline-none border-b border-current/30 px-0.5"
            />
          ) : (
            <h2
              className="flex-1 text-[12px] font-semibold tracking-tight cursor-pointer truncate"
              onDoubleClick={() => {
                setEditName(column.title);
                setEditing(true);
              }}
            >
              {column.title}
            </h2>
          )}
          <span className="text-[10px] font-medium opacity-70 px-1.5 py-0.5 rounded-full bg-black/5 dark:bg-white/5">
            {column.cards.length}
          </span>

          {/* Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Column options"
              aria-expanded={menuOpen}
              className="p-1 rounded hover:bg-[#dce0d9] dark:hover:bg-white/[0.05] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-36 rounded-md border border-[#ead7c3] dark:border-white/[0.08] bg-[#fbf6ef] dark:bg-[#1e1e2e] shadow-lg z-50">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setEditName(column.title);
                    setEditing(true);
                  }}
                  className="w-full text-left px-3 py-2 text-[12px] text-gray-700 dark:text-gray-300 hover:bg-[#dce0d9] dark:hover:bg-white/[0.05] transition-colors"
                >
                  Rename
                </button>
                {columnsCount > 1 && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      deleteColumn(column.id);
                    }}
                    className="w-full text-left px-3 py-2 text-[12px] text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Cards container */}
        <div
          ref={setNodeRef}
          className={`flex-1 md:overflow-y-auto space-y-2 p-1.5 rounded-xl transition-colors duration-200 ${
            isOver ? "bg-[#dce0d9] dark:bg-white/[0.03] ring-1 ring-[#ead7c3] dark:ring-white/[0.06]" : ""
          }`}
          style={{ minHeight: "100px" }}
        >
          <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
            {column.cards.map((card) => (
              <KanbanCard key={card.id} card={card} />
            ))}
          </SortableContext>

          {column.cards.length === 0 && (
            <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center py-4 px-2">
              Drop cards here
            </p>
          )}

          {/* Add card */}
          <div className="pt-1">
            <AddCardForm columnId={column.id} />
          </div>
        </div>
      </div>

      {/* Add column after last column */}
      {isLast && (
        <>
          <button
            onClick={() => setAddDialogOpen(true)}
            className="flex-shrink-0 w-full md:w-[280px] lg:w-[300px] h-10 mt-3 md:mt-8 flex items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-[#ead7c3] dark:border-white/[0.08] text-gray-400 dark:text-gray-500 hover:border-violet-400 dark:hover:border-violet-500 hover:text-violet-500 dark:hover:text-violet-400 transition-colors text-[12px] font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Column
          </button>

          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>New Column</DialogTitle>
                <DialogDescription>Give your column a name.</DialogDescription>
              </DialogHeader>
              <input
                autoFocus
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddColumn()}
                placeholder="Column name..."
                className="w-full rounded-md border border-[#ead7c3] dark:border-white/[0.08] bg-[#dce0d9] dark:bg-white/[0.03] px-3 py-2 text-[13px] text-gray-800 dark:text-gray-100 outline-none focus:border-violet-400 dark:focus:border-violet-500 transition-colors"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddColumn}
                  disabled={!newColumnName.trim()}
                  className="flex-1 py-2 rounded-md bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-[13px] font-medium text-white transition-colors"
                >
                  Add Column
                </button>
                <button
                  onClick={() => {
                    setNewColumnName("");
                    setAddDialogOpen(false);
                  }}
                  className="px-3 py-2 rounded-md text-[13px] font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-[#dce0d9] dark:hover:bg-white/[0.05] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
