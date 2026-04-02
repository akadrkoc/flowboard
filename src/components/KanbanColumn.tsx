"use client";

import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import type { Column } from "@/types/board";
import KanbanCard from "./KanbanCard";
import AddCardForm from "./AddCardForm";

const accentColors = [
  "bg-blue-500",
  "bg-amber-500",
  "bg-violet-500",
  "bg-emerald-500",
];

interface KanbanColumnProps {
  column: Column;
  index?: number;
}

export default function KanbanColumn({ column, index = 0 }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: "column", column },
  });

  const cardIds = column.cards.map((c) => c.id);

  return (
    <div className="flex-shrink-0 w-[300px] flex flex-col max-h-full">
      {/* Column header */}
      <div className="flex items-center gap-2.5 px-1 mb-3">
        <span
          className={`w-2.5 h-2.5 rounded-full ${
            accentColors[index % accentColors.length]
          }`}
        />
        <h2 className="text-[13px] font-semibold text-gray-700 dark:text-gray-200 tracking-tight">
          {column.title}
        </h2>
        <span className="ml-auto text-[11px] font-medium text-gray-500 bg-gray-100 dark:bg-white/[0.05] px-2 py-0.5 rounded-full">
          {column.cards.length}
        </span>
      </div>

      {/* Cards container */}
      <div
        ref={setNodeRef}
        className={`flex-1 overflow-y-auto space-y-2 p-1.5 rounded-xl transition-colors duration-200 ${
          isOver ? "bg-gray-100 dark:bg-white/[0.03] ring-1 ring-gray-200 dark:ring-white/[0.06]" : ""
        }`}
        style={{ minHeight: "100px" }}
      >
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {column.cards.map((card) => (
            <KanbanCard key={card.id} card={card} />
          ))}
        </SortableContext>

        {/* Add card */}
        <div className="pt-1">
          <AddCardForm columnId={column.id} />
        </div>
      </div>
    </div>
  );
}
