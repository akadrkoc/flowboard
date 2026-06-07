"use client";

import { useState, useMemo } from "react";
import { useBoardStore } from "@/store/boardStore";
import { Search, X, SlidersHorizontal, CheckSquare } from "lucide-react";
import { useClickOutside } from "@/hooks/useClickOutside";
import FilterPanel from "@/components/filters/FilterPanel";

const PRIORITIES = ["high", "med", "low"];
const CANONICAL_LABELS = ["Frontend", "Backend", "Design", "Auth", "DevOps", "Docs"];

const priorityStyle: Record<string, string> = {
  high: "bg-red-500/20 text-red-600 dark:text-red-400 ring-red-500/30",
  med: "bg-amber-500/20 text-amber-600 dark:text-amber-400 ring-amber-500/30",
  low: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 ring-emerald-500/30",
};

function initialsOf(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function FilterBar() {
  const searchQuery = useBoardStore((s) => s.searchQuery);
  const filterPriority = useBoardStore((s) => s.filterPriority);
  const filterLabel = useBoardStore((s) => s.filterLabel);
  const filterAssignee = useBoardStore((s) => s.filterAssignee);
  const setSearchQuery = useBoardStore((s) => s.setSearchQuery);
  const setFilterPriority = useBoardStore((s) => s.setFilterPriority);
  const setFilterLabel = useBoardStore((s) => s.setFilterLabel);
  const setFilterAssignee = useBoardStore((s) => s.setFilterAssignee);
  const clearFilters = useBoardStore((s) => s.clearFilters);
  const columns = useBoardStore((s) => s.columns);
  const members = useBoardStore((s) => s.members);
  const selectMode = useBoardStore((s) => s.selectMode);
  const toggleSelectMode = useBoardStore((s) => s.toggleSelectMode);

  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useClickOutside(filterOpen, () => setFilterOpen(false));

  const hasFilters = !!(searchQuery || filterPriority || filterLabel || filterAssignee);
  const activeFilterCount = [filterPriority, filterLabel, filterAssignee].filter(Boolean).length;

  const allLabels = useMemo(() => {
    const seen = new Set<string>(CANONICAL_LABELS);
    for (const col of columns) {
      for (const card of col.cards) {
        for (const l of card.labels || []) {
          if (l) seen.add(l);
        }
      }
    }
    return Array.from(seen);
  }, [columns]);

  const assigneeOptions = useMemo(() => {
    return [
      { value: "unassigned", label: "Unassigned" },
      ...members.map((m) => ({
        value: initialsOf(m.name),
        label: m.name,
      })),
    ];
  }, [members]);

  const assigneeLabel = useMemo(() => {
    if (!filterAssignee) return null;
    return assigneeOptions.find((o) => o.value === filterAssignee)?.label ?? filterAssignee;
  }, [filterAssignee, assigneeOptions]);

  const filterPanelProps = {
    priorities: PRIORITIES,
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
  };

  return (
    <div className="relative z-30 flex-shrink-0 border-b border-[#ead7c3] dark:border-white/[0.06] bg-[#fbf6ef] dark:bg-[#16161e]">
      <div className="flex items-center gap-3 px-4 sm:px-6 py-2.5">
        {/* Search */}
        <div className="relative flex-1 min-w-0 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            id="filter-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search cards..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-muted/40 text-sm text-foreground outline-none focus:ring-1 focus:ring-violet-500/40 transition-colors"
          />
        </div>

        {/* Filters dropdown */}
        <div className="relative" ref={filterRef}>
          <button
            type="button"
            onClick={() => setFilterOpen((v) => !v)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeFilterCount > 0
                ? "bg-violet-500/10 text-violet-600 dark:text-violet-300 ring-1 ring-violet-500/25"
                : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted/70"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-violet-500 text-[10px] font-semibold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          {filterOpen && (
            <div className="absolute left-0 top-full mt-2 w-72 rounded-lg border border-border bg-popover shadow-xl z-[100] p-3">
              <FilterPanel {...filterPanelProps} />
            </div>
          )}
        </div>

        {/* Active filter chips */}
        {(filterPriority || filterLabel || assigneeLabel) && (
          <div className="hidden md:flex items-center gap-1.5 min-w-0 overflow-x-auto">
            {filterPriority && (
              <button
                type="button"
                onClick={() => setFilterPriority(null)}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium capitalize ${priorityStyle[filterPriority]} ring-1`}
              >
                {filterPriority}
                <X className="w-3 h-3 opacity-60" />
              </button>
            )}
            {filterLabel && (
              <button
                type="button"
                onClick={() => setFilterLabel(null)}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-violet-500/15 text-violet-600 dark:text-violet-300 ring-1 ring-violet-500/25"
              >
                {filterLabel}
                <X className="w-3 h-3 opacity-60" />
              </button>
            )}
            {assigneeLabel && (
              <button
                type="button"
                onClick={() => setFilterAssignee(null)}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-muted text-foreground ring-1 ring-border"
              >
                {assigneeLabel}
                <X className="w-3 h-3 opacity-60" />
              </button>
            )}
          </div>
        )}

        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="hidden sm:flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Clear
          </button>
        )}

        {/* Select mode */}
        <button
          type="button"
          onClick={toggleSelectMode}
          title={selectMode ? "Exit select mode" : "Select multiple cards"}
          className={`ml-auto flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectMode
              ? "bg-violet-500/15 text-violet-600 dark:text-violet-300 ring-1 ring-violet-500/30"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span className="hidden sm:inline">{selectMode ? "Done" : "Select"}</span>
        </button>
      </div>
    </div>
  );
}
