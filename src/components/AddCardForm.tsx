"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useBoardStore } from "@/store/boardStore";
import type { Priority } from "@/types/board";

const LABEL_OPTIONS = ["Frontend", "Backend", "Design", "Auth", "DevOps", "Docs"];

interface AddCardFormProps {
  columnId: string;
}

export default function AddCardForm({ columnId }: AddCardFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("med");
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [storyPoints, setStoryPoints] = useState(3);
  const addCard = useBoardStore((s) => s.addCard);
  const { data: session } = useSession();

  // Logged-in user's initials and color
  const userInitials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";
  const userColor = "bg-violet-500";

  const toggleLabel = (label: string) => {
    setSelectedLabels((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    addCard(columnId, {
      title: title.trim(),
      labels: selectedLabels.length ? selectedLabels : ["Frontend"],
      priority,
      dueDate: "",
      storyPoints,
      assigneeInitials: userInitials,
      assigneeColor: userColor,
    });
    setTitle("");
    setSelectedLabels([]);
    setPriority("med");
    setStoryPoints(3);
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-1.5 py-2 text-[12px] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.03] rounded-lg transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Add card
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#1e1e2e] p-3 space-y-3">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        placeholder="Card title..."
        className="w-full bg-transparent text-[13px] text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none"
      />

      {/* Labels */}
      <div className="flex flex-wrap gap-1">
        {LABEL_OPTIONS.map((label) => (
          <button
            key={label}
            onClick={() => toggleLabel(label)}
            className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
              selectedLabels.includes(label)
                ? "bg-violet-500/30 text-violet-600 dark:text-violet-300"
                : "bg-gray-100 dark:bg-white/[0.05] text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Priority + Points */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          {(["low", "med", "high"] as Priority[]).map((p) => (
            <button
              key={p}
              onClick={() => setPriority(p)}
              className={`w-5 h-5 rounded-full border-2 transition-colors flex items-center justify-center ${
                priority === p
                  ? p === "high"
                    ? "border-red-500 bg-red-500/20"
                    : p === "med"
                    ? "border-amber-500 bg-amber-500/20"
                    : "border-emerald-500 bg-emerald-500/20"
                  : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
              }`}
            >
              {priority === p && (
                <div
                  className={`w-2 h-2 rounded-full ${
                    p === "high"
                      ? "bg-red-500"
                      : p === "med"
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                />
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          {[1, 2, 3, 5, 8].map((pt) => (
            <button
              key={pt}
              onClick={() => setStoryPoints(pt)}
              className={`w-6 h-6 rounded text-[10px] font-medium transition-colors ${
                storyPoints === pt
                  ? "bg-gray-200 dark:bg-white/10 text-gray-900 dark:text-white"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {pt}
            </button>
          ))}
        </div>

        {/* Current user avatar */}
        <div className="flex items-center ml-auto">
          <div
            className={`w-5 h-5 rounded-full ${userColor} flex items-center justify-center`}
          >
            <span className="text-[8px] font-bold text-white">{userInitials}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleSubmit}
          className="flex-1 py-1.5 rounded-md bg-violet-600 hover:bg-violet-500 text-[12px] font-medium text-white transition-colors"
        >
          Add
        </button>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/[0.05] text-gray-400 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
