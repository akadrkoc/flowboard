"use client";

import { SearchX } from "lucide-react";

interface FilterEmptyBannerProps {
  show: boolean;
}

export default function FilterEmptyBanner({ show }: FilterEmptyBannerProps) {
  if (!show) return null;

  return (
    <div className="mx-3 sm:mx-4 md:mx-6 mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[12px]">
      <SearchX className="w-3.5 h-3.5 flex-shrink-0" />
      <span>No cards match the current filters.</span>
    </div>
  );
}
