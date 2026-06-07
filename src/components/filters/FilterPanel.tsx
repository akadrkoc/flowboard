"use client";

interface FilterPanelProps {
  priorities: string[];
  priorityStyle: Record<string, string>;
  filterPriority: string | null;
  setFilterPriority: (p: string | null) => void;
  allLabels: string[];
  filterLabel: string | null;
  setFilterLabel: (l: string | null) => void;
  assigneeOptions: { value: string; label: string }[];
  filterAssignee: string | null;
  setFilterAssignee: (a: string | null) => void;
  hasFilters: boolean;
  clearFilters: () => void;
}

export default function FilterPanel({
  priorities,
  priorityStyle,
  filterPriority,
  setFilterPriority,
  allLabels,
  filterLabel,
  setFilterLabel,
  assigneeOptions,
  filterAssignee,
  setFilterAssignee,
  hasFilters,
  clearFilters,
}: FilterPanelProps) {
  return (
    <div className="space-y-4 p-1">
      <div>
        <p className="text-[11px] font-medium text-muted-foreground mb-2">
          Priority
        </p>
        <div className="flex gap-2">
          {priorities.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() =>
                setFilterPriority(filterPriority === p ? null : p)
              }
              className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
                filterPriority === p
                  ? `${priorityStyle[p]} ring-1`
                  : "bg-muted/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-medium text-muted-foreground mb-2">
          Assignee
        </p>
        <select
          value={filterAssignee ?? ""}
          onChange={(e) => setFilterAssignee(e.target.value || null)}
          className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-violet-500/40 transition-colors"
        >
          <option value="">All assignees</option>
          {assigneeOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className="text-[11px] font-medium text-muted-foreground mb-2">
          Labels
        </p>
        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
          {allLabels.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setFilterLabel(filterLabel === l ? null : l)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                filterLabel === l
                  ? "bg-violet-500/15 text-violet-600 dark:text-violet-300 ring-1 ring-violet-500/30"
                  : "bg-muted/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={clearFilters}
          className="w-full py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
