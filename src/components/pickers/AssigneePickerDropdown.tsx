"use client";

import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { useClickOutside } from "@/hooks/useClickOutside";
import { AssigneeAvatar } from "./AssigneeAvatar";
import type { AssigneeOption } from "./types";

interface AssigneePickerDropdownProps {
  options: AssigneeOption[];
  assigneeId: string;
  onAssigneeIdChange: (id: string) => void;
  label?: string;
}

export function AssigneePickerDropdown({
  options,
  assigneeId,
  onAssigneeIdChange,
  label = "Assign to",
}: AssigneePickerDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(open, () => setOpen(false));

  const defaultSelfOption = options.find((o) => !o.unassigned) ?? null;
  const selectedOption = assigneeId
    ? options.find((o) => o.id === assigneeId) ?? defaultSelfOption
    : defaultSelfOption;

  return (
    <div>
      {label ? (
        <p className="text-xs font-medium text-muted-foreground mb-1.5">
          {label}
        </p>
      ) : null}
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border border-[#ead7c3] dark:border-white/[0.08] bg-white dark:bg-[#252530] hover:bg-[#f3ede4] dark:hover:bg-[#2a2a38] transition-colors"
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className="flex items-center gap-1.5 min-w-0">
            {selectedOption ? (
              <AssigneeAvatar option={selectedOption} />
            ) : null}
            <span className="text-xs font-medium text-foreground truncate">
              {selectedOption?.name ?? "Unassigned"}
            </span>
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-gray-500 dark:text-gray-400 flex-shrink-0 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        {open && (
          <div
            role="listbox"
            className="absolute z-[100] mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg p-1"
          >
            {options.map((opt) => {
              const isSelected = opt.id === (selectedOption?.id ?? "");
              return (
                <button
                  key={opt.id || "me"}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onAssigneeIdChange(opt.id);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-sm text-left transition-colors ${
                    isSelected
                      ? "bg-violet-500/15 text-violet-600 dark:text-violet-300"
                      : "hover:bg-muted text-foreground"
                  }`}
                >
                  <AssigneeAvatar option={opt} />
                  <span className="text-[11px] font-medium truncate flex-1">
                    {opt.name}
                  </span>
                  {isSelected && <Check className="w-3 h-3 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
