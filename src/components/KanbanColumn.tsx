"use client";

import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import type { Column } from "@/types/board";
import KanbanCard from "./KanbanCard";
import AddCardForm from "./AddCardForm";
import KanbanColumnHeader from "./KanbanColumnHeader";

interface KanbanColumnProps {
  column: Column;
  index: number;
}

export default function KanbanColumn({ column, index }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: "column", column },
  });

  const cardIds = column.cards.map((c) => c.id);

  return (
    <div className="w-full md:w-[280px] lg:w-[300px] flex-shrink-0 flex flex-col md:h-full md:min-h-0">
      <KanbanColumnHeader column={column} index={index} />

      <div
        ref={setNodeRef}
        className={`flex-1 md:min-h-0 md:overflow-y-auto space-y-2 p-1.5 rounded-xl transition-colors duration-200 ${
          isOver ? "bg-muted/50 ring-1 ring-border" : ""
        }`}
      >
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {column.cards.map((card) => (
            <KanbanCard key={card.id} card={card} />
          ))}
        </SortableContext>

        <div className="pt-1">
          <AddCardForm columnId={column.id} />
        </div>
      </div>
    </div>
  );
}
