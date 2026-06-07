"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useClickOutside } from "@/hooks/useClickOutside";
import { getColumnStatusStyle } from "@/lib/columnColors";
import type { Column } from "@/types/board";

interface StatusPickerDropdownProps {
  columns: Column[];
  value: string;
  onChange: (columnId: string) => void;
}

export function StatusPickerDropdown({
  columns,
  value,
  onChange,
}: StatusPickerDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(open, () => setOpen(false));

  const selectedIndex = columns.findIndex((c) => c.id === value);
  const selected = columns[selectedIndex];
  const selectedStyle = getColumnStatusStyle(
    selectedIndex >= 0 ? selectedIndex : 0
  );

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${selectedStyle.chip}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 min-w-0">
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${selectedStyle.dot}`}
          />
          <span className="truncate">{selected?.title ?? "Select status"}</span>
        </span>
        <ChevronDown
          className={`w-4 h-4 flex-shrink-0 opacity-60 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute z-[100] mt-1 w-full rounded-lg border border-[#ead7c3] dark:border-white/[0.08] bg-[#fbf6ef] dark:bg-[#252530] shadow-lg p-1"
        >
          {columns.map((col, index) => {
            const style = getColumnStatusStyle(index);
            const isSelected = col.id === value;
            return (
              <button
                key={col.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(col.id);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-left transition-colors ${
                  isSelected
                    ? style.chip
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${style.dot}`}
                />
                <span className="truncate">{col.title}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
