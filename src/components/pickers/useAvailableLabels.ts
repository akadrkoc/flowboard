import { useMemo } from "react";
import type { Column } from "@/types/board";
import { CANONICAL_LABELS } from "./constants";

/** Collect canonical + board-wide + currently selected labels. */
export function useAvailableLabels(
  columns: Column[],
  selectedLabels: string[]
): string[] {
  return useMemo(() => {
    const set = new Set<string>(CANONICAL_LABELS);
    for (const col of columns) {
      for (const card of col.cards) {
        for (const l of card.labels || []) {
          if (l) set.add(l);
        }
      }
    }
    for (const l of selectedLabels) set.add(l);
    return Array.from(set);
  }, [columns, selectedLabels]);
}
