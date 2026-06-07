import { Column } from "@/models/Column";
import { Card } from "@/models/Card";

export const typeResolvers = {
  Board: {
    id: (parent: { _id: string }) => parent._id.toString(),
    columns: async (parent: { _id: string }) => {
      const columns = await Column.find({ boardId: parent._id })
        .sort({ order: 1 })
        .lean();
      return columns;
    },
  },

  Column: {
    id: (parent: { _id: string }) => parent._id.toString(),
    cards: async (parent: { _id: string }) => {
      const cards = await Card.find({ columnId: parent._id, deletedAt: null })
        .sort({ order: 1 })
        .lean();
      return cards;
    },
  },

  Card: {
    id: (parent: { _id: string }) => parent._id.toString(),
    columnId: (parent: { columnId: string }) => parent.columnId.toString(),
    boardId: (parent: { boardId: string }) => parent.boardId.toString(),
    assigneeId: (parent: { assigneeId?: { toString(): string } | null }) =>
      parent.assigneeId ? parent.assigneeId.toString() : null,
    createdAt: (parent: { createdAt?: Date | string | null }) =>
      parent.createdAt instanceof Date
        ? parent.createdAt.toISOString()
        : (parent.createdAt ?? null),
    completedAt: (parent: { completedAt?: Date | string | null }) =>
      parent.completedAt instanceof Date
        ? parent.completedAt.toISOString()
        : (parent.completedAt ?? null),
    deletedAt: (parent: { deletedAt?: Date | string | null }) =>
      parent.deletedAt instanceof Date
        ? parent.deletedAt.toISOString()
        : (parent.deletedAt ?? null),
  },

  User: {
    id: (parent: { _id: string }) => parent._id.toString(),
  },

  Sprint: {
    id: (parent: { _id: string }) => parent._id.toString(),
    boardId: (parent: { boardId: string }) => parent.boardId.toString(),
  },

  Comment: {
    id: (parent: { _id: string }) => parent._id.toString(),
    cardId: (parent: { cardId: string }) => parent.cardId.toString(),
    authorId: (parent: { authorId?: { toString(): string } }) =>
      parent.authorId ? parent.authorId.toString() : null,
    createdAt: (parent: { createdAt?: Date | string | null }) =>
      parent.createdAt instanceof Date
        ? parent.createdAt.toISOString()
        : (parent.createdAt ?? new Date().toISOString()),
  },

  Subtask: {
    id: (parent: { _id: string }) => parent._id.toString(),
    cardId: (parent: { cardId: string }) => parent.cardId.toString(),
  },
};
