"use client";

import { useState } from "react";
import { ChevronDown, Tag } from "lucide-react";
import { useClickOutside } from "@/hooks/useClickOutside";

interface LabelPickerDropdownProps {
  labels: string[];
  selectedLabels: string[];
  onToggle: (label: string) => void;
  newLabelDraft: string;
  onNewLabelDraftChange: (value: string) => void;
  onAddCustomLabel: (name: string) => void;
}

export function LabelPickerDropdown({
  labels,
  selectedLabels,
  onToggle,
  newLabelDraft,
  onNewLabelDraftChange,
  onAddCustomLabel,
}: LabelPickerDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(open, () => setOpen(false));

  const summary =
    selectedLabels.length === 0
      ? "No labels"
      : selectedLabels.length === 1
        ? selectedLabels[0]
        : `${selectedLabels.length} labels`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border border-[#ead7c3] dark:border-white/[0.08] bg-white dark:bg-[#252530] hover:bg-[#f3ede4] dark:hover:bg-[#2a2a38] transition-colors"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 min-w-0">
          <Tag className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-xs font-medium text-foreground truncate">
            {summary}
          </span>
          {selectedLabels.length > 0 && (
            <span className="flex gap-1 flex-shrink-0">
              {selectedLabels.slice(0, 2).map((l) => (
                <span
                  key={l}
                  className="px-1.5 py-0.5 rounded bg-violet-500/15 text-[10px] font-medium text-violet-600 dark:text-violet-300"
                >
                  {l}
                </span>
              ))}
            </span>
          )}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted-foreground flex-shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute z-[100] mt-1 w-full rounded-md border border-border bg-popover shadow-lg p-2">
          <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto mb-2">
            {labels.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => onToggle(label)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  selectedLabels.includes(label)
                    ? "bg-violet-500/20 text-violet-600 dark:text-violet-300 ring-1 ring-violet-500/30"
                    : "bg-muted/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <input
            value={newLabelDraft}
            onChange={(e) => onNewLabelDraftChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const name = newLabelDraft.trim();
                if (!name) return;
                onAddCustomLabel(name);
              }
            }}
            placeholder="Add custom label..."
            className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-violet-500/40"
          />
        </div>
      )}
    </div>
  );
}
