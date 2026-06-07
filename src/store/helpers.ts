import type { Card, Column } from "@/types/board";

export function errMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string") return err;
  return fallback;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapApiCard(card: any): Card {
  return {
    id: card.id,
    title: card.title,
    description: card.description || "",
    labels: card.labels || [],
    priority: card.priority,
    dueDate: card.dueDate || "",
    storyPoints: card.storyPoints,
    assigneeInitials: card.assigneeInitials || "",
    assigneeColor: card.assigneeColor || "bg-gray-500",
    columnId: card.columnId,
    order: card.order,
    completedAt: card.completedAt || undefined,
    createdAt: card.createdAt || undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapApiColumns(columns: any[]): Column[] {
  return columns.map((col) => ({
    id: col.id,
    title: col.name,
    cards: (col.cards || []).map(mapApiCard),
  }));
}

/** Optimistic card move shared by moveCardLocal and socket card-moved handler. */
export function applyCardMove(
  columns: Column[],
  cardId: string,
  toColumnId: string,
  newIndex: number
): Column[] | null {
  const next = columns.map((col) => ({
    ...col,
    cards: [...col.cards],
  }));

  let movedCard: Card | undefined;
  let fromColumnId: string | undefined;
  for (const col of next) {
    const idx = col.cards.findIndex((c) => c.id === cardId);
    if (idx !== -1) {
      movedCard = { ...col.cards[idx] };
      fromColumnId = col.id;
      col.cards.splice(idx, 1);
      break;
    }
  }

  if (!movedCard) return null;

  const targetCol = next.find((c) => c.id === toColumnId);
  if (!targetCol) return null;

  movedCard.columnId = toColumnId;

  if (fromColumnId !== toColumnId) {
    const lastCol = next[next.length - 1];
    if (lastCol && lastCol.id === toColumnId) {
      movedCard.completedAt = new Date().toISOString();
    } else {
      movedCard.completedAt = undefined;
    }
  }

  const clampedIndex = Math.min(newIndex, targetCol.cards.length);
  targetCol.cards.splice(clampedIndex, 0, movedCard);

  for (const col of next) {
    col.cards.forEach((card, i) => {
      card.order = i;
    });
  }

  return next;
}

/** Merge deleted column's cards into the first remaining column. */
export function mergeColumnOnDelete(
  columns: Column[],
  columnId: string
): Column[] {
  const deletedCol = columns.find((c) => c.id === columnId);
  const firstOtherCol = columns.find((c) => c.id !== columnId);

  return columns
    .filter((c) => c.id !== columnId)
    .map((c) => {
      if (c.id === firstOtherCol?.id && deletedCol) {
        const baseOrder = c.cards.length;
        const merged = [
          ...c.cards,
          ...deletedCol.cards.map((card, i) => ({
            ...card,
            columnId: c.id,
            order: baseOrder + i,
          })),
        ];
        return { ...c, cards: merged };
      }
      return c;
    });
}
