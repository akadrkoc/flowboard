"use client";

import { useState, useCallback, useMemo } from "react";
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
  const searchQuery = useBoardStore((s) => s.searchQuery);
  const filterPriority = useBoardStore((s) => s.filterPriority);
  const filterLabel = useBoardStore((s) => s.filterLabel);
  const [activeCard, setActiveCard] = useState<Card | null>(null);

  const filteredColumns = useMemo(() => {
    if (!searchQuery && !filterPriority && !filterLabel) return columns;
    const q = searchQuery.toLowerCase();
    return columns.map((col) => ({
      ...col,
      cards: col.cards.filter((card) => {
        if (q && !card.title.toLowerCase().includes(q) && !(card.description || "").toLowerCase().includes(q)) return false;
        if (filterPriority && card.priority !== filterPriority) return false;
        if (filterLabel && !card.labels.includes(filterLabel)) return false;
        return true;
      }),
    }));
  }, [columns, searchQuery, filterPriority, filterLabel]);

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

      // Drag bitince kartin son lokasyonunu bul ve onu server'a iletelim.
      // handleDragOver zaten client state'i optimistic olarak guncelledigi
      // icin current position guvenilir kaynaktir. Bu yaklasim, kullanici
      // yeni kolonun BOS alanina biraktiginda da (over.id = column.id,
      // overIdx = -1) moveCard'in cagrilmasini garanti eder.
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
      <div className="flex-1 overflow-y-auto md:overflow-x-auto">
        <div
          className="flex flex-col md:flex-row gap-3 md:gap-5 p-3 sm:p-4 md:p-6 pb-4"
          style={{ justifyContent: "safe center" }}
        >
          {filteredColumns.map((column, index) => (
            <KanbanColumn key={column.id} column={column} index={index} isLast={index === filteredColumns.length - 1} />
          ))}
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
