"use client";

import { useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { useBoardStore } from "@/store/boardStore";
import type { Subtask } from "@/store/boardTypes";

interface SubtaskListProps {
  cardId: string;
  subtasks: Subtask[];
}

export default function SubtaskList({ cardId, subtasks }: SubtaskListProps) {
  const addSubtask = useBoardStore((s) => s.addSubtask);
  const toggleSubtask = useBoardStore((s) => s.toggleSubtask);
  const deleteSubtask = useBoardStore((s) => s.deleteSubtask);
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);

  const completed = subtasks.filter((s) => s.completed).length;

  const handleAdd = async () => {
    const title = draft.trim();
    if (!title) return;
    setAdding(true);
    try {
      await addSubtask(cardId, title);
      setDraft("");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="text-xs font-medium text-muted-foreground">
          Subtasks
        </label>
        {subtasks.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {completed}/{subtasks.length}
          </span>
        )}
      </div>

      {subtasks.length > 0 && (
        <ul className="space-y-1 mb-2">
          {subtasks.map((subtask) => (
            <li
              key={subtask.id}
              className="group flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[#dce0d9]/60 dark:hover:bg-white/[0.03] transition-colors"
            >
              <button
                type="button"
                onClick={() => toggleSubtask(subtask.id, cardId)}
                aria-label={
                  subtask.completed ? "Mark incomplete" : "Mark complete"
                }
                className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                  subtask.completed
                    ? "bg-violet-600 border-violet-600"
                    : "border-[#d4c4ae] dark:border-white/20 hover:border-violet-400"
                }`}
              >
                {subtask.completed && (
                  <Check className="w-2.5 h-2.5 text-white" />
                )}
              </button>
              <span
                className={`flex-1 text-[12px] ${
                  subtask.completed
                    ? "line-through text-gray-400"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                {subtask.title}
              </span>
              <button
                type="button"
                onClick={() => deleteSubtask(subtask.id, cardId)}
                aria-label="Delete subtask"
                className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-red-500 transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Add subtask..."
          className="flex-1 rounded-md border border-[#ead7c3] dark:border-white/[0.08] bg-[#dce0d9] dark:bg-white/[0.03] px-2.5 py-1.5 text-[12px] text-gray-800 dark:text-gray-100 outline-none focus:border-violet-400 transition-colors"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!draft.trim() || adding}
          aria-label="Add subtask"
          className="p-1.5 rounded-md bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
