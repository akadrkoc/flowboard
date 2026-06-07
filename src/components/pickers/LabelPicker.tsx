"use client";

interface LabelPickerProps {
  labels: string[];
  selectedLabels: string[];
  onToggle: (label: string) => void;
  newLabelDraft: string;
  onNewLabelDraftChange: (value: string) => void;
  onAddCustomLabel: (name: string) => void;
  inputClassName?: string;
  badgeClassName?: string;
}

export function LabelPicker({
  labels,
  selectedLabels,
  onToggle,
  newLabelDraft,
  onNewLabelDraftChange,
  onAddCustomLabel,
  inputClassName = "w-full bg-transparent border-b border-dashed border-[#ead7c3] dark:border-white/[0.08] px-1 py-1 text-[11px] text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-violet-400",
  badgeClassName = "px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors",
}: LabelPickerProps) {
  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {labels.map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => onToggle(label)}
            className={`${badgeClassName} ${
              selectedLabels.includes(label)
                ? "bg-violet-500/30 text-violet-600 dark:text-violet-300 ring-1 ring-violet-500/30"
                : "bg-[#dce0d9] dark:bg-white/[0.05] text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mt-2">
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
          placeholder="+ Add custom label (Enter)"
          className={inputClassName}
        />
      </div>
    </>
  );
}
