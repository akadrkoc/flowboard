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
import KanbanColumn from "./KanbanColumn";
import KanbanCard from "./KanbanCard";
import type { Card } from "@/types/board";

export default function Board() {
  const columns = useBoardStore((s) => s.columns);
  const moveCard = useBoardStore((s) => s.moveCard);
  const moveCardLocal = useBoardStore((s) => s.moveCardLocal);
  const [activeCard, setActiveCard] = useState<Card | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Custom collision detection: önce pointer'ın içinde olduğu alanı kontrol et,
  // sonra en yakın merkeze bak. Bu boş kolonlara da drop etmeyi sağlar.
  const collisionDetection: CollisionDetection = useCallback((args) => {
    // Önce pointer'ın doğrudan üzerinde olduğu elemanları bul
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) return pointerCollisions;

    // Pointer hiçbir şeyin üzerinde değilse rect intersection dene
    const rectCollisions = rectIntersection(args);
    if (rectCollisions.length > 0) return rectCollisions;

    // Son çare: en yakın merkez
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
      // Over might be a column or a card
      const overCol =
        columns.find((c) => c.id === overId) || findColumnByCardId(overId);

      if (!activeCol || !overCol || activeCol.id === overCol.id) return;

      // Card is moving to a different column
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
      const overId = over.id as string;

      if (activeId === overId) return;

      const activeCol = findColumnByCardId(activeId);
      const overCol =
        columns.find((c) => c.id === overId) || findColumnByCardId(overId);

      if (!activeCol || !overCol) return;

      if (activeCol.id === overCol.id) {
        // Reorder within same column
        const overIdx = overCol.cards.findIndex((c) => c.id === overId);
        if (overIdx >= 0) {
          moveCard(activeId, overCol.id, overIdx);
        }
      } else {
        // Move to different column (already handled in dragOver, finalize)
        const overIdx = overCol.cards.findIndex((c) => c.id === overId);
        const newIndex = overIdx >= 0 ? overIdx : overCol.cards.length;
        moveCard(activeId, overCol.id, newIndex);
      }
    },
    [columns, findColumnByCardId, moveCard]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 flex justify-center gap-5 overflow-x-auto p-6 pb-4">
        {columns.map((column, index) => (
          <KanbanColumn key={column.id} column={column} index={index} />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
        {activeCard ? (
          <KanbanCard card={activeCard} isDraggingOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
