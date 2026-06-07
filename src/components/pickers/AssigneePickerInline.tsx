"use client";

import { AssigneeAvatar } from "./AssigneeAvatar";
import type { AssigneeOption } from "./types";

interface AssigneePickerInlineProps {
  options: AssigneeOption[];
  selectedOption: AssigneeOption | null;
  onSelect: (id: string) => void;
}

export function AssigneePickerInline({
  options,
  selectedOption,
  onSelect,
}: AssigneePickerInlineProps) {
  return (
    <div className="flex items-center flex-wrap gap-1.5">
      {options.map((opt) => {
        const isSelected = selectedOption?.id === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onSelect(opt.id)}
            title={opt.name}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-full transition-colors ${
              isSelected
                ? "bg-violet-500/15 ring-1 ring-violet-500/60"
                : "hover:bg-[#dce0d9] dark:hover:bg-white/[0.05]"
            }`}
          >
            <AssigneeAvatar option={opt} size="md" />
            <span
              className={`text-[11px] font-medium truncate max-w-[140px] ${
                isSelected
                  ? "text-violet-600 dark:text-violet-300"
                  : "text-gray-600 dark:text-gray-300"
              }`}
            >
              {opt.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
