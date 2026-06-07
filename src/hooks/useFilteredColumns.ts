"use client";

import { useMemo } from "react";
import { useBoardStore } from "@/store/boardStore";
import type { Column } from "@/types/board";

function cardMatchesFilters(
  card: Column["cards"][number],
  q: string,
  filterPriority: string | null,
  filterLabel: string | null,
  filterAssignee: string | null
): boolean {
  if (
    q &&
    !card.title.toLowerCase().includes(q) &&
    !(card.description || "").toLowerCase().includes(q)
  ) {
    return false;
  }
  if (filterPriority && card.priority !== filterPriority) return false;
  if (filterLabel && !card.labels.includes(filterLabel)) return false;
  if (filterAssignee) {
    if (filterAssignee === "unassigned") {
      if (card.assigneeInitials) return false;
    } else if (card.assigneeInitials !== filterAssignee) {
      return false;
    }
  }
  return true;
}

export function useFilteredColumns() {
  const columns = useBoardStore((s) => s.columns);
  const searchQuery = useBoardStore((s) => s.searchQuery);
  const filterPriority = useBoardStore((s) => s.filterPriority);
  const filterLabel = useBoardStore((s) => s.filterLabel);
  const filterAssignee = useBoardStore((s) => s.filterAssignee);

  const filteredColumns = useMemo(() => {
    if (!searchQuery && !filterPriority && !filterLabel && !filterAssignee) {
      return columns;
    }
    const q = searchQuery.toLowerCase();
    return columns.map((col) => ({
      ...col,
      cards: col.cards.filter((card) =>
        cardMatchesFilters(
          card,
          q,
          filterPriority,
          filterLabel,
          filterAssignee
        )
      ),
    }));
  }, [columns, searchQuery, filterPriority, filterLabel, filterAssignee]);

  const hasActiveFilters = !!(
    searchQuery ||
    filterPriority ||
    filterLabel ||
    filterAssignee
  );

  const totalFilteredCards = useMemo(
    () => filteredColumns.reduce((sum, col) => sum + col.cards.length, 0),
    [filteredColumns]
  );

  return { filteredColumns, hasActiveFilters, totalFilteredCards };
}
