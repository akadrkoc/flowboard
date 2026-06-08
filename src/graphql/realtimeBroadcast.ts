import { broadcastToBoard } from "@/lib/realtime";

type CardDoc = {
  _id: { toString(): string };
  title: string;
  description?: string;
  labels: string[];
  priority: string;
  dueDate?: string;
  storyPoints: number;
  assigneeId?: { toString(): string } | null;
  assigneeInitials: string;
  assigneeColor: string;
  columnId: { toString(): string };
  order: number;
  completedAt?: Date | string | null;
  createdAt?: Date | string | null;
};

type CommentDoc = {
  _id: { toString(): string };
  text: string;
  cardId: { toString(): string };
  authorId?: { toString(): string } | null;
  authorName: string;
  authorImage?: string | null;
  createdAt?: Date | string | null;
};

function toIso(value: Date | string | null | undefined): string | undefined {
  if (!value) return undefined;
  return value instanceof Date ? value.toISOString() : value;
}

export function toRealtimeCard(card: CardDoc) {
  return {
    id: card._id.toString(),
    title: card.title,
    description: card.description || "",
    labels: card.labels || [],
    priority: card.priority,
    dueDate: card.dueDate || "",
    storyPoints: card.storyPoints,
    assigneeId: card.assigneeId ? card.assigneeId.toString() : null,
    assigneeInitials: card.assigneeInitials || "",
    assigneeColor: card.assigneeColor || "bg-gray-500",
    columnId: card.columnId.toString(),
    order: card.order,
    completedAt: toIso(card.completedAt),
    createdAt: toIso(card.createdAt),
  };
}

export function toRealtimeComment(comment: CommentDoc) {
  return {
    id: comment._id.toString(),
    text: comment.text,
    cardId: comment.cardId.toString(),
    authorId: comment.authorId ? comment.authorId.toString() : null,
    authorName: comment.authorName,
    authorImage: comment.authorImage ?? null,
    createdAt: toIso(comment.createdAt) ?? new Date().toISOString(),
  };
}

export function cardUpdatesFromSanitized(
  sanitized: Record<string, unknown>
): Record<string, unknown> {
  const updates: Record<string, unknown> = {};
  if ("title" in sanitized) updates.title = sanitized.title;
  if ("description" in sanitized) {
    updates.description = sanitized.description ?? "";
  }
  if ("labels" in sanitized) updates.labels = sanitized.labels;
  if ("priority" in sanitized) updates.priority = sanitized.priority;
  if ("dueDate" in sanitized) updates.dueDate = sanitized.dueDate ?? "";
  if ("storyPoints" in sanitized) updates.storyPoints = sanitized.storyPoints;
  if ("assigneeId" in sanitized) {
    updates.assigneeId = sanitized.assigneeId ?? null;
    updates.assigneeInitials = sanitized.assigneeInitials ?? "";
    updates.assigneeColor = sanitized.assigneeColor ?? "bg-gray-500";
  }
  return updates;
}

export function broadcastCardMoved(
  boardId: string,
  cardId: string,
  toColumnId: string,
  newIndex: number
): void {
  broadcastToBoard(boardId, "card-moved", {
    boardId,
    cardId,
    toColumnId,
    newIndex,
  });
}

export function broadcastCardCreated(
  boardId: string,
  card: CardDoc
): void {
  broadcastToBoard(boardId, "card-created", {
    boardId,
    card: toRealtimeCard(card),
  });
}

export function broadcastCardUpdated(
  boardId: string,
  cardId: string,
  sanitized: Record<string, unknown>
): void {
  broadcastToBoard(boardId, "card-updated", {
    boardId,
    cardId,
    updates: cardUpdatesFromSanitized(sanitized),
  });
}

export function broadcastCardDeleted(boardId: string, cardId: string): void {
  broadcastToBoard(boardId, "card-deleted", { boardId, cardId });
}

export function broadcastColumnAdded(
  boardId: string,
  columnId: string,
  name: string
): void {
  broadcastToBoard(boardId, "column-added", {
    boardId,
    column: { id: columnId, title: name, cards: [] },
  });
}

export function broadcastColumnRenamed(
  boardId: string,
  columnId: string,
  name: string
): void {
  broadcastToBoard(boardId, "column-renamed", { boardId, columnId, name });
}

export function broadcastColumnDeleted(
  boardId: string,
  columnId: string
): void {
  broadcastToBoard(boardId, "column-deleted", { boardId, columnId });
}

export function broadcastCommentAdded(
  boardId: string,
  cardId: string,
  comment: CommentDoc
): void {
  broadcastToBoard(boardId, "comment-added", {
    boardId,
    cardId,
    comment: toRealtimeComment(comment),
  });
}
