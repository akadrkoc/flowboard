"use client";

import { useState } from "react";
import { useBoardStore } from "@/store/boardStore";
import { Search, X, SlidersHorizontal } from "lucide-react";

const PRIORITIES = ["high", "med", "low"];
const LABELS = ["Frontend", "Backend", "Design", "Auth", "DevOps", "Docs"];

const priorityStyle: Record<string, string> = {
  high: "bg-red-500/20 text-red-600 dark:text-red-400 ring-red-500/30",
  med: "bg-amber-500/20 text-amber-600 dark:text-amber-400 ring-amber-500/30",
  low: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 ring-emerald-500/30",
};

export default function FilterBar() {
  const searchQuery = useBoardStore((s) => s.searchQuery);
  const filterPriority = useBoardStore((s) => s.filterPriority);
  const filterLabel = useBoardStore((s) => s.filterLabel);
  const setSearchQuery = useBoardStore((s) => s.setSearchQuery);
  const setFilterPriority = useBoardStore((s) => s.setFilterPriority);
  const setFilterLabel = useBoardStore((s) => s.setFilterLabel);

  const [mobileOpen, setMobileOpen] = useState(false);

  const hasFilters = searchQuery || filterPriority || filterLabel;

  const clearAll = () => {
    setSearchQuery("");
    setFilterPriority(null);
    setFilterLabel(null);
  };

  return (
    <div className="border-b border-[#ead7c3] dark:border-white/[0.06] bg-[#fbf6ef]/60 dark:bg-[#12121a]/60 backdrop-blur-md">
      {/* MOBILE BAR */}
      <div className="md:hidden flex items-center gap-2 px-3 py-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full pl-8 pr-3 py-1.5 rounded-md border border-[#ead7c3] dark:border-white/[0.08] bg-[#dce0d9] dark:bg-white/[0.03] text-[12px] text-gray-800 dark:text-gray-100 outline-none focus:border-violet-400 dark:focus:border-violet-500 transition-colors"
          />
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
            hasFilters
              ? "bg-violet-500/15 text-violet-600 dark:text-violet-300"
              : "bg-[#dce0d9] dark:bg-white/[0.05] text-gray-600 dark:text-gray-400"
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filters
          {hasFilters && (
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
          )}
        </button>
      </div>

      {/* MOBILE EXPANDED PANEL */}
      {mobileOpen && (
        <div className="md:hidden px-3 pb-3 space-y-3 border-t border-[#ead7c3] dark:border-white/[0.06]">
          <div>
            <p className="text-[10px] uppercase font-medium text-gray-400 mb-1.5 mt-2">
              Priority
            </p>
            <div className="flex gap-1.5">
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  onClick={() => setFilterPriority(filterPriority === p ? null : p)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                    filterPriority === p
                      ? `${priorityStyle[p]} ring-1`
                      : "bg-[#dce0d9] dark:bg-white/[0.05] text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase font-medium text-gray-400 mb-1.5">
              Labels
            </p>
            <div className="flex flex-wrap gap-1.5">
              {LABELS.map((l) => (
                <button
                  key={l}
                  onClick={() => setFilterLabel(filterLabel === l ? null : l)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                    filterLabel === l
                      ? "bg-violet-500/20 text-violet-600 dark:text-violet-300 ring-1 ring-violet-500/30"
                      : "bg-[#dce0d9] dark:bg-white/[0.05] text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          {hasFilters && (
            <button
              onClick={clearAll}
              className="w-full flex items-center justify-center gap-1 py-1.5 rounded-md text-[11px] font-medium text-gray-500 dark:text-gray-400 bg-[#dce0d9] dark:bg-white/[0.05] hover:bg-[#d4c4ae] dark:hover:bg-white/[0.08] transition-colors"
            >
              <X className="w-3 h-3" />
              Clear all
            </button>
          )}
        </div>
      )}

      {/* DESKTOP BAR */}
      <div className="hidden md:flex items-center gap-3 px-6 py-2.5">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search cards..."
            className="pl-8 pr-3 py-1.5 w-48 rounded-md border border-[#ead7c3] dark:border-white/[0.08] bg-[#dce0d9] dark:bg-white/[0.03] text-[12px] text-gray-800 dark:text-gray-100 outline-none focus:border-violet-400 dark:focus:border-violet-500 transition-colors"
          />
        </div>

        {/* Priority pills */}
        <div className="flex items-center gap-1">
          {PRIORITIES.map((p) => (
            <button
              key={p}
              onClick={() => setFilterPriority(filterPriority === p ? null : p)}
              className={`px-2 py-1 rounded-full text-[11px] font-medium transition-colors ${
                filterPriority === p
                  ? `${priorityStyle[p]} ring-1`
                  : "bg-[#dce0d9] dark:bg-white/[0.05] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-[#ead7c3] dark:bg-white/[0.08]" />

        {/* Label pills */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {LABELS.map((l) => (
            <button
              key={l}
              onClick={() => setFilterLabel(filterLabel === l ? null : l)}
              className={`px-2 py-1 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap ${
                filterLabel === l
                  ? "bg-violet-500/20 text-violet-600 dark:text-violet-300 ring-1 ring-violet-500/30"
                  : "bg-[#dce0d9] dark:bg-white/[0.05] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Clear */}
        {hasFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-[#dce0d9] dark:hover:bg-white/[0.05] transition-colors"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
