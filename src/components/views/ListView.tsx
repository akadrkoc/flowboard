"use client";

import { Check } from "lucide-react";
import { useBoardStore } from "@/store/boardStore";
import { useBoardNavigation } from "@/hooks/useBoardNavigation";
import { useFilteredColumns } from "@/hooks/useFilteredColumns";
import { getColumnStatusStyle } from "@/lib/columnColors";
import { isUnassigned } from "@/lib/assignee";
import type { Card, Column } from "@/types/board";
import FilterEmptyBanner from "./FilterEmptyBanner";

const priorityStyle: Record<string, string> = {
  high: "text-red-600 dark:text-red-400",
  med: "text-amber-600 dark:text-amber-400",
  low: "text-emerald-600 dark:text-emerald-400",
};

interface ListRowProps {
  card: Card;
  column: Column;
  columnIndex: number;
}

function ListRow({ card, column, columnIndex }: ListRowProps) {
  const { openTask } = useBoardNavigation();
  const moveCard = useBoardStore((s) => s.moveCard);
  const columns = useBoardStore((s) => s.columns);
  const selectMode = useBoardStore((s) => s.selectMode);
  const isSelected = useBoardStore((s) => !!s.selectedCardIds[card.id]);
  const toggleCardSelection = useBoardStore((s) => s.toggleCardSelection);

  const statusStyle = getColumnStatusStyle(columnIndex);

  const handleClick = () => {
    if (selectMode) {
      toggleCardSelection(card.id);
      return;
    }
    openTask(card.id);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    const columnId = e.target.value;
    if (columnId === column.id) return;
    const targetCol = columns.find((c) => c.id === columnId);
    if (!targetCol) return;
    moveCard(card.id, columnId, targetCol.cards.length);
  };

  return (
    <tr
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Open task: ${card.title}`}
      className={`group border-b border-[#ead7c3]/60 dark:border-white/[0.04] hover:bg-[#dce0d9]/50 dark:hover:bg-white/[0.02] cursor-pointer transition-colors ${
        isSelected ? "bg-violet-500/10" : ""
      }`}
    >
      {selectMode && (
        <td className="py-2.5 pl-4 w-8">
          <div
            className={`w-4 h-4 rounded flex items-center justify-center border ${
              isSelected
                ? "bg-violet-600 border-violet-600"
                : "border-[#d4c4ae] dark:border-white/20"
            }`}
          >
            {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
          </div>
        </td>
      )}
      <td className="py-2.5 px-3 text-[13px] font-medium text-gray-800 dark:text-gray-100 max-w-[240px]">
        <span className="truncate block">{card.title}</span>
      </td>
      <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
        <select
          value={column.id}
          onChange={handleStatusChange}
          aria-label="Status"
          className={`rounded-md border px-2 py-0.5 text-[11px] font-medium outline-none ${statusStyle.chip}`}
        >
          {columns.map((col) => (
            <option key={col.id} value={col.id}>
              {col.title}
            </option>
          ))}
        </select>
      </td>
      <td className="py-2.5 px-3">
        <span
          className={`text-[11px] font-medium uppercase ${priorityStyle[card.priority]}`}
        >
          {card.priority}
        </span>
      </td>
      <td className="py-2.5 px-3 hidden sm:table-cell">
        {isUnassigned(card.assigneeInitials) ? (
          <span className="text-[11px] text-gray-400">—</span>
        ) : (
          <div className="flex items-center gap-1.5">
            <div
              className={`w-5 h-5 rounded-full ${card.assigneeColor} flex items-center justify-center`}
            >
              <span className="text-[8px] font-bold text-white">
                {card.assigneeInitials}
              </span>
            </div>
            <span className="text-[11px] text-gray-600 dark:text-gray-400">
              {card.assigneeInitials}
            </span>
          </div>
        )}
      </td>
      <td className="py-2.5 px-3 hidden md:table-cell text-[11px] text-gray-500 dark:text-gray-400">
        {card.dueDate || "—"}
      </td>
      <td className="py-2.5 px-3 hidden lg:table-cell text-[11px] text-gray-500 dark:text-gray-400">
        {card.storyPoints}
      </td>
    </tr>
  );
}

export default function ListView() {
  const selectMode = useBoardStore((s) => s.selectMode);
  const { filteredColumns, hasActiveFilters, totalFilteredCards } =
    useFilteredColumns();

  return (
    <div className="flex-1 overflow-y-auto">
      <FilterEmptyBanner
        show={hasActiveFilters && totalFilteredCards === 0}
      />
      <div className="p-3 sm:p-4 md:p-6 space-y-6">
        {filteredColumns.map((column, columnIndex) => {
          if (column.cards.length === 0 && hasActiveFilters) return null;
          const statusStyle = getColumnStatusStyle(columnIndex);

          return (
            <section key={column.id}>
              <div
                className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border mb-2 ${statusStyle.chip}`}
              >
                <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`} />
                <h3 className="text-[12px] font-semibold">{column.title}</h3>
                <span className="text-[10px] opacity-70">
                  {column.cards.length}
                </span>
              </div>

              {column.cards.length === 0 ? (
                <p className="text-[11px] text-gray-400 dark:text-gray-500 py-2 pl-1">
                  No tasks
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-[#ead7c3] dark:border-white/[0.06]">
                  <table className="w-full min-w-[480px]">
                    <thead>
                      <tr className="bg-[#dce0d9]/40 dark:bg-white/[0.02] text-left">
                        {selectMode && <th className="w-8" />}
                        <th className="py-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                          Task
                        </th>
                        <th className="py-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                          Status
                        </th>
                        <th className="py-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                          Priority
                        </th>
                        <th className="py-2 px-3 hidden sm:table-cell text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                          Assignee
                        </th>
                        <th className="py-2 px-3 hidden md:table-cell text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                          Due
                        </th>
                        <th className="py-2 px-3 hidden lg:table-cell text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                          Pts
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {column.cards.map((card) => (
                        <ListRow
                          key={card.id}
                          card={card}
                          column={column}
                          columnIndex={columnIndex}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
