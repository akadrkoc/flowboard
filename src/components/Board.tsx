"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  pointerWithin,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  type CollisionDetection,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useBoardStore } from "@/store/boardStore";
import { useFilteredColumns } from "@/hooks/useFilteredColumns";
import KanbanColumn from "./KanbanColumn";
import AddColumnHeader from "./AddColumnHeader";
import KanbanCard from "./KanbanCard";
import FilterEmptyBanner from "./views/FilterEmptyBanner";
import type { Card } from "@/types/board";

export default function Board() {
  const columns = useBoardStore((s) => s.columns);
  const moveCard = useBoardStore((s) => s.moveCard);
  const moveCardLocal = useBoardStore((s) => s.moveCardLocal);
  const { filteredColumns, hasActiveFilters, totalFilteredCards } =
    useFilteredColumns();
  const [activeCard, setActiveCard] = useState<Card | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const collisionDetection: CollisionDetection = useCallback((args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) return pointerCollisions;
    const rectCollisions = rectIntersection(args);
    if (rectCollisions.length > 0) return rectCollisions;
    return closestCenter(args);
  }, []);

  const findColumnByCardId = useCallback(
    (cardId: string) => {
      return columns.find((col) => col.cards.some((c) => c.id === cardId));
    },
    [columns]
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const col = findColumnByCardId(active.id as string);
      const card = col?.cards.find((c) => c.id === active.id);
      if (card) setActiveCard(card);
    },
    [findColumnByCardId]
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      const activeCol = findColumnByCardId(activeId);
      const overCol =
        columns.find((c) => c.id === overId) || findColumnByCardId(overId);

      if (!activeCol || !overCol || activeCol.id === overCol.id) return;

      const overCardIdx = overCol.cards.findIndex((c) => c.id === overId);
      const newIndex = overCardIdx >= 0 ? overCardIdx : overCol.cards.length;

      moveCardLocal(activeId, overCol.id, newIndex);
    },
    [columns, findColumnByCardId, moveCardLocal]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveCard(null);

      if (!over) return;

      const activeId = active.id as string;
      const currentCol = findColumnByCardId(activeId);
      if (!currentCol) return;

      const currentIdx = currentCol.cards.findIndex((c) => c.id === activeId);
      if (currentIdx < 0) return;

      moveCard(activeId, currentCol.id, currentIdx);
    },
    [findColumnByCardId, moveCard]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 min-h-0 overflow-y-auto md:overflow-x-auto md:overflow-y-hidden">
        <FilterEmptyBanner
          show={hasActiveFilters && totalFilteredCards === 0}
        />
        <div
          className="flex flex-col md:flex-row md:items-start gap-3 md:gap-5 px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 md:h-full md:min-w-max"
          style={{ justifyContent: "safe center" }}
        >
          {filteredColumns.map((column, index) => (
            <KanbanColumn
              key={column.id}
              column={column}
              index={index}
            />
          ))}
          <div className="flex-shrink-0">
            <AddColumnHeader />
          </div>
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
        {activeCard ? (
          <KanbanCard card={activeCard} isDraggingOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
