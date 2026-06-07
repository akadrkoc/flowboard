"use client";

import { useState, useRef, useEffect } from "react";
import type { Column } from "@/types/board";
import { useBoardStore } from "@/store/boardStore";
import { getColumnStatusStyle } from "@/lib/columnColors";
import { MoreHorizontal, Trash2 } from "lucide-react";

interface KanbanColumnHeaderProps {
  column: Column;
  index: number;
}

export default function KanbanColumnHeader({
  column,
  index,
}: KanbanColumnHeaderProps) {
  const renameColumn = useBoardStore((s) => s.renameColumn);
  const deleteColumn = useBoardStore((s) => s.deleteColumn);
  const columnsCount = useBoardStore((s) => s.columns.length);

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(column.title);
  const [menuOpen, setMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const statusStyle = getColumnStatusStyle(index);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    setEditName(column.title);
  }, [column.title]);

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

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 mb-3 rounded-lg border ${statusStyle.chip}`}
    >
        <span
          className={`w-2 h-2 rounded-full flex-shrink-0 ${statusStyle.dot}`}
        />
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
            className="flex-1 text-sm font-semibold bg-transparent outline-none border-b border-current/30 px-0.5 min-w-0"
          />
        ) : (
          <h2
            className="flex-1 text-sm font-semibold tracking-tight cursor-pointer truncate"
            onDoubleClick={() => {
              setEditName(column.title);
              setEditing(true);
            }}
          >
            {column.title}
          </h2>
        )}
        <span className="text-xs font-medium opacity-70 px-1.5 py-0.5 rounded-full bg-black/5 dark:bg-white/5">
          {column.cards.length}
        </span>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Column options"
            aria-expanded={menuOpen}
            className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 text-current/60 hover:text-current transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-36 rounded-lg border border-border bg-popover shadow-lg z-[100]">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setEditName(column.title);
                  setEditing(true);
                }}
                className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                Rename
              </button>
              {columnsCount > 1 && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    deleteColumn(column.id);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
    </div>
  );
}
