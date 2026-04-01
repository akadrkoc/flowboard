"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useBoardStore } from "@/store/boardStore";
import type { Priority } from "@/types/board";

const LABEL_OPTIONS = ["Frontend", "Backend", "Design", "Auth", "DevOps", "Docs"];
const ASSIGNEES = [
  { initials: "AK", color: "bg-violet-500" },
  { initials: "RJ", color: "bg-sky-500" },
  { initials: "ML", color: "bg-emerald-500" },
];

interface AddCardFormProps {
  columnId: string;
}

export default function AddCardForm({ columnId }: AddCardFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("med");
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [storyPoints, setStoryPoints] = useState(3);
  const [assigneeIdx, setAssigneeIdx] = useState(0);
  const addCard = useBoardStore((s) => s.addCard);

  const toggleLabel = (label: string) => {
    setSelectedLabels((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    const assignee = ASSIGNEES[assigneeIdx];
    addCard(columnId, {
      title: title.trim(),
      labels: selectedLabels.length ? selectedLabels : ["Frontend"],
      priority,
      dueDate: "Apr 10",
      storyPoints,
      assigneeInitials: assignee.initials,
      assigneeColor: assignee.color,
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
        className="w-full flex items-center justify-center gap-1.5 py-2 text-[12px] text-gray-500 hover:text-gray-300 hover:bg-white/[0.03] rounded-lg transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Add card
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-white/[0.08] bg-[#1e1e2e] p-3 space-y-3">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        placeholder="Card title..."
        className="w-full bg-transparent text-[13px] text-gray-100 placeholder-gray-500 outline-none"
      />

      {/* Labels */}
      <div className="flex flex-wrap gap-1">
        {LABEL_OPTIONS.map((label) => (
          <button
            key={label}
            onClick={() => toggleLabel(label)}
            className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
              selectedLabels.includes(label)
                ? "bg-violet-500/30 text-violet-300"
                : "bg-white/[0.05] text-gray-500 hover:text-gray-300"
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
                  : "border-gray-600 hover:border-gray-400"
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
                  ? "bg-white/10 text-white"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {pt}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 ml-auto">
          {ASSIGNEES.map((a, i) => (
            <button
              key={a.initials}
              onClick={() => setAssigneeIdx(i)}
              className={`w-5 h-5 rounded-full ${a.color} flex items-center justify-center transition-all ${
                assigneeIdx === i ? "ring-2 ring-white/30 scale-110" : "opacity-50"
              }`}
            >
              <span className="text-[8px] font-bold text-white">{a.initials}</span>
            </button>
          ))}
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
          className="p-1.5 rounded-md hover:bg-white/[0.05] text-gray-400 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
