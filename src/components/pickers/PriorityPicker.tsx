"use client";

import type { Priority } from "@/types/board";

const PRIORITIES: Priority[] = ["low", "med", "high"];

interface PriorityPickerProps {
  value: Priority;
  onChange: (priority: Priority) => void;
  size?: "sm" | "md";
}

export function PriorityPicker({
  value,
  onChange,
  size = "sm",
}: PriorityPickerProps) {
  const dim = size === "sm" ? "w-5 h-5" : "w-7 h-7";
  const dotDim = size === "sm" ? "w-2 h-2" : "w-2.5 h-2.5";

  return (
    <div className="flex items-center gap-1">
      {PRIORITIES.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          title={`Priority: ${p}`}
          className={`${dim} rounded-full border-2 transition-colors flex items-center justify-center ${
            value === p
              ? p === "high"
                ? "border-red-500 bg-red-500/20"
                : p === "med"
                  ? "border-amber-500 bg-amber-500/20"
                  : "border-emerald-500 bg-emerald-500/20"
              : "border-[#ead7c3] dark:border-gray-600 hover:border-gray-400"
          }`}
        >
          {value === p && (
            <div
              className={`${dotDim} rounded-full ${
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
  );
}
