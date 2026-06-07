"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useBoardStore } from "@/store/boardStore";
import { useBoardNavigation } from "@/hooks/useBoardNavigation";
import { useFilteredColumns } from "@/hooks/useFilteredColumns";
import type { Card } from "@/types/board";
import FilterEmptyBanner from "./FilterEmptyBanner";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildMonthGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];

  for (let i = 0; i < first.getDay(); i++) cells.push(null);
  for (let d = 1; d <= lastDay; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

const priorityDot: Record<string, string> = {
  high: "bg-red-500",
  med: "bg-amber-500",
  low: "bg-emerald-500",
};

interface CalendarCardProps {
  card: Card;
}

function CalendarCard({ card }: CalendarCardProps) {
  const { openTask } = useBoardNavigation();

  return (
    <button
      type="button"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/card-id", card.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={() => openTask(card.id)}
      className="w-full text-left px-1.5 py-1 rounded text-[10px] font-medium bg-violet-500/15 text-violet-700 dark:text-violet-300 hover:bg-violet-500/25 border border-violet-500/20 truncate flex items-center gap-1 transition-colors"
      title={card.title}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${priorityDot[card.priority]}`} />
      <span className="truncate">{card.title}</span>
    </button>
  );
}

export default function CalendarView() {
  const updateCard = useBoardStore((s) => s.updateCard);
  const [cursor, setCursor] = useState(() => new Date());
  const { filteredColumns, hasActiveFilters, totalFilteredCards } =
    useFilteredColumns();

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthLabel = cursor.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const { byDate, unscheduled } = useMemo(() => {
    const map = new Map<string, Card[]>();
    const noDate: Card[] = [];

    for (const col of filteredColumns) {
      for (const card of col.cards) {
        if (card.dueDate) {
          const list = map.get(card.dueDate) ?? [];
          list.push(card);
          map.set(card.dueDate, list);
        } else {
          noDate.push(card);
        }
      }
    }

    return { byDate: map, unscheduled: noDate };
  }, [filteredColumns]);

  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const todayKey = toDateKey(new Date());

  const prevMonth = () =>
    setCursor(new Date(year, month - 1, 1));
  const nextMonth = () =>
    setCursor(new Date(year, month + 1, 1));

  const handleDrop = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData("text/card-id");
    if (!cardId) return;
    updateCard(cardId, { dueDate: toDateKey(date) });
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
      <FilterEmptyBanner
        show={hasActiveFilters && totalFilteredCards === 0}
      />

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[15px] font-semibold text-gray-800 dark:text-gray-100">
          {monthLabel}
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            aria-label="Previous month"
            className="p-1.5 rounded-md hover:bg-[#dce0d9] dark:hover:bg-white/[0.05] text-gray-500 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCursor(new Date())}
            className="px-2 py-1 rounded-md text-[11px] font-medium text-gray-600 dark:text-gray-400 hover:bg-[#dce0d9] dark:hover:bg-white/[0.05] transition-colors"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            aria-label="Next month"
            className="p-1.5 rounded-md hover:bg-[#dce0d9] dark:hover:bg-white/[0.05] text-gray-500 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-[#ead7c3] dark:border-white/[0.06] overflow-hidden">
        <div className="grid grid-cols-7 bg-[#dce0d9]/40 dark:bg-white/[0.02]">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-gray-400"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {grid.map((date, i) => {
            if (!date) {
              return (
                <div
                  key={`empty-${i}`}
                  className="min-h-[88px] border-t border-r border-[#ead7c3]/50 dark:border-white/[0.04] bg-[#fbf6ef]/40 dark:bg-[#16161e]/40"
                />
              );
            }

            const key = toDateKey(date);
            const cards = byDate.get(key) ?? [];
            const isToday = key === todayKey;

            return (
              <div
                key={key}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, date)}
                className={`min-h-[88px] border-t border-r border-[#ead7c3]/50 dark:border-white/[0.04] p-1.5 ${
                  isToday ? "bg-violet-500/5" : "bg-[#fbf6ef] dark:bg-[#1a1a24]"
                }`}
              >
                <span
                  className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-[11px] font-medium mb-1 ${
                    isToday
                      ? "bg-violet-600 text-white"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {date.getDate()}
                </span>
                <div className="space-y-1">
                  {cards.slice(0, 3).map((card) => (
                    <CalendarCard key={card.id} card={card} />
                  ))}
                  {cards.length > 3 && (
                    <span className="text-[10px] text-gray-400 pl-1">
                      +{cards.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {unscheduled.length > 0 && (
        <section className="mt-6">
          <h3 className="text-[12px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            No due date ({unscheduled.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {unscheduled.map((card) => (
              <CalendarCard key={card.id} card={card} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
