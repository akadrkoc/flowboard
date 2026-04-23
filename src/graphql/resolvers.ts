import { GraphQLError } from "graphql";
import { connectDB } from "@/lib/mongodb";
import { Board } from "@/models/Board";
import { Column } from "@/models/Column";
import { Card } from "@/models/Card";
import { Comment } from "@/models/Comment";
import { User } from "@/models/User";
import { Sprint } from "@/models/Sprint";
import type { GraphQLContext } from "@/app/api/graphql/route";
import {
  requireAuth,
  requireBoardMember,
  requireBoardOwner,
  sanitizeCardInput,
  validateName,
  validateEmail,
  validateDateRange,
} from "@/graphql/auth";

export const resolvers = {
  Query: {
    boards: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx);
      await connectDB();
      return Board.find({
        $or: [{ ownerId: userId }, { memberIds: userId }],
      }).lean();
    },

    board: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      await requireBoardMember(ctx, id);
      return Board.findById(id).lean();
    },

    me: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      if (!ctx.userId) return null;
      await connectDB();
      return User.findById(ctx.userId).lean();
    },

    comments: async (_: unknown, { cardId }: { cardId: string }, ctx: GraphQLContext) => {
      requireAuth(ctx);
      await connectDB();

      const card = await Card.findById(cardId).lean();
      if (!card) throw new GraphQLError("Card not found", { extensions: { code: "NOT_FOUND" } });
      await requireBoardMember(ctx, (card as { boardId: { toString(): string } }).boardId.toString());

      return Comment.find({ cardId }).sort({ createdAt: 1 }).lean();
    },

    sprints: async (_: unknown, { boardId }: { boardId: string }, ctx: GraphQLContext) => {
      await requireBoardMember(ctx, boardId);
      return Sprint.find({ boardId }).sort({ createdAt: -1 }).lean();
    },

    activeSprint: async (_: unknown, { boardId }: { boardId: string }, ctx: GraphQLContext) => {
      await requireBoardMember(ctx, boardId);
      return Sprint.findOne({ boardId, isActive: true }).lean();
    },

    boardMembers: async (_: unknown, { boardId }: { boardId: string }, ctx: GraphQLContext) => {
      await requireBoardMember(ctx, boardId);
      const board = await Board.findById(boardId).lean();
      if (!board) throw new GraphQLError("Board not found", { extensions: { code: "NOT_FOUND" } });
      const memberIds = (board as { memberIds: string[] }).memberIds || [];
      if (memberIds.length === 0) return [];
      return User.find({ _id: { $in: memberIds } }).lean();
    },
  },

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
    // Date objelerini her zaman ISO string olarak gonder; yoksa default
    // String scalar Date.toString() kullanir ve client-side parse edilemez
    // biçimde NaN/Invalid Date uretir.
    createdAt: (parent: { createdAt?: Date | string | null }) =>
      parent.createdAt instanceof Date
        ? parent.createdAt.toISOString()
        : parent.createdAt ?? null,
    completedAt: (parent: { completedAt?: Date | string | null }) =>
      parent.completedAt instanceof Date
        ? parent.completedAt.toISOString()
        : parent.completedAt ?? null,
    deletedAt: (parent: { deletedAt?: Date | string | null }) =>
      parent.deletedAt instanceof Date
        ? parent.deletedAt.toISOString()
        : parent.deletedAt ?? null,
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
        : parent.createdAt ?? new Date().toISOString(),
  },

  Mutation: {
    createBoard: async (_: unknown, { name }: { name: string }, ctx: GraphQLContext) => {
      const userId = requireAuth(ctx);
      validateName(name, "Board name");
      await connectDB();

      const board = await Board.create({
        name: name.trim(),
        ownerId: userId,
        memberIds: [userId],
        columnIds: [],
      });

      // Varsayılan 4 kolon oluştur
      const defaultColumns = ["To Do", "In Progress", "Review", "Done"];
      const columnDocs = await Column.insertMany(
        defaultColumns.map((colName, i) => ({
          name: colName,
          boardId: board._id,
          order: i,
        }))
      );

      board.columnIds = columnDocs.map((c) => c._id);
      await board.save();

      return board;
    },

    createCard: async (
      _: unknown,
      { columnId, input }: { columnId: string; input: Record<string, unknown> },
      ctx: GraphQLContext
    ) => {
      requireAuth(ctx);
      await connectDB();

      const column = await Column.findById(columnId);
      if (!column) throw new GraphQLError("Column not found", { extensions: { code: "NOT_FOUND" } });

      await requireBoardMember(ctx, column.boardId.toString());
      const sanitized = sanitizeCardInput(input);

      // Sıradaki order değerini bul
      const lastCard = await Card.findOne({ columnId })
        .sort({ order: -1 })
        .lean();
      const nextOrder = lastCard ? (lastCard as { order: number }).order + 1 : 0;

      const card = await Card.create({
        ...sanitized,
        columnId,
        boardId: column.boardId,
        order: nextOrder,
      });

      return card;
    },

    moveCard: async (
      _: unknown,
      {
        cardId,
        toColumnId,
        newIndex,
      }: { cardId: string; toColumnId: string; newIndex: number },
      ctx: GraphQLContext
    ) => {
      requireAuth(ctx);
      await connectDB();

      const card = await Card.findById(cardId);
      if (!card) throw new GraphQLError("Card not found", { extensions: { code: "NOT_FOUND" } });

      await requireBoardMember(ctx, card.boardId.toString());

      // Security: target column must belong to the same board as the card.
      // Without this a malicious client could POST { toColumnId: <another board's column id> }
      // and smuggle a card into a board the attacker is not a member of.
      const toColumn = await Column.findById(toColumnId).lean();
      if (!toColumn) {
        throw new GraphQLError("Target column not found", { extensions: { code: "NOT_FOUND" } });
      }
      if (
        (toColumn as { boardId: { toString(): string } }).boardId.toString() !==
        card.boardId.toString()
      ) {
        throw new GraphQLError("Cannot move card across boards", {
          extensions: { code: "FORBIDDEN" },
        });
      }

      const fromColumnId = card.columnId.toString();
      const isMovingColumns = fromColumnId !== toColumnId;

      if (isMovingColumns) {
        // Eski kolondaki kartları güncelle (boşluğu kapat)
        await Card.updateMany(
          { columnId: fromColumnId, order: { $gt: card.order } },
          { $inc: { order: -1 } }
        );

        // Yeni kolondaki kartlara yer aç
        await Card.updateMany(
          { columnId: toColumnId, order: { $gte: newIndex } },
          { $inc: { order: 1 } }
        );

        card.columnId = toColumnId as unknown as typeof card.columnId;

        // Son kolona (Done) taşınıyorsa completedAt set et
        const allColumns = await Column.find({ boardId: card.boardId })
          .sort({ order: 1 })
          .lean();
        const lastColumn = allColumns[allColumns.length - 1];
        if (lastColumn && lastColumn._id.toString() === toColumnId) {
          card.completedAt = new Date();
        } else {
          card.completedAt = null as unknown as Date;
        }
      } else {
        // Aynı kolon içinde yeniden sıralama
        const oldIndex = card.order;
        if (oldIndex < newIndex) {
          await Card.updateMany(
            {
              columnId: toColumnId,
              order: { $gt: oldIndex, $lte: newIndex },
            },
            { $inc: { order: -1 } }
          );
        } else if (oldIndex > newIndex) {
          await Card.updateMany(
            {
              columnId: toColumnId,
              order: { $gte: newIndex, $lt: oldIndex },
            },
            { $inc: { order: 1 } }
          );
        }
      }

      card.order = newIndex;
      await card.save();

      return card;
    },

    updateCard: async (
      _: unknown,
      {
        cardId,
        input,
      }: { cardId: string; input: Record<string, unknown> },
      ctx: GraphQLContext
    ) => {
      requireAuth(ctx);
      await connectDB();

      const existingCard = await Card.findById(cardId);
      if (!existingCard) throw new GraphQLError("Card not found", { extensions: { code: "NOT_FOUND" } });

      await requireBoardMember(ctx, existingCard.boardId.toString());
      const sanitized = sanitizeCardInput(input);

      const card = await Card.findByIdAndUpdate(cardId, sanitized, {
        new: true,
      }).lean();

      return card;
    },

    deleteCard: async (_: unknown, { cardId }: { cardId: string }, ctx: GraphQLContext) => {
      requireAuth(ctx);
      await connectDB();

      const card = await Card.findById(cardId);
      if (!card) throw new GraphQLError("Card not found", { extensions: { code: "NOT_FOUND" } });

      await requireBoardMember(ctx, card.boardId.toString());

      // Soft delete: set deletedAt
      card.deletedAt = new Date();
      await card.save();

      // Silinen karttan sonraki kartların order'ını düşür
      await Card.updateMany(
        { columnId: card.columnId, deletedAt: null, order: { $gt: card.order } },
        { $inc: { order: -1 } }
      );

      return true;
    },

    restoreCard: async (_: unknown, { cardId }: { cardId: string }, ctx: GraphQLContext) => {
      requireAuth(ctx);
      await connectDB();

      const card = await Card.findById(cardId);
      if (!card) throw new GraphQLError("Card not found", { extensions: { code: "NOT_FOUND" } });

      await requireBoardMember(ctx, card.boardId.toString());

      // Restore ancak daha once silinmis bir kart icin anlamlidir; aksi halde
      // client yanlis state'te demektir, istegi reddet.
      if (!card.deletedAt) {
        throw new GraphQLError("Card is not deleted", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      // Restore: clear deletedAt and append to end of column
      const lastCard = await Card.findOne({ columnId: card.columnId, deletedAt: null })
        .sort({ order: -1 })
        .lean();
      const nextOrder = lastCard ? (lastCard as { order: number }).order + 1 : 0;

      card.deletedAt = null as unknown as Date;
      card.order = nextOrder;
      await card.save();

      return card;
    },

    addColumn: async (
      _: unknown,
      { boardId, name }: { boardId: string; name: string },
      ctx: GraphQLContext
    ) => {
      await requireBoardMember(ctx, boardId);
      validateName(name, "Column name");
      await connectDB();

      const board = await Board.findById(boardId);
      if (!board) throw new GraphQLError("Board not found", { extensions: { code: "NOT_FOUND" } });

      const lastColumn = await Column.findOne({ boardId })
        .sort({ order: -1 })
        .lean();
      const nextOrder = lastColumn ? (lastColumn as { order: number }).order + 1 : 0;

      const column = await Column.create({ name: name.trim(), boardId, order: nextOrder });
      board.columnIds.push(column._id);
      await board.save();

      return column;
    },

    renameColumn: async (
      _: unknown,
      { columnId, name }: { columnId: string; name: string },
      ctx: GraphQLContext
    ) => {
      requireAuth(ctx);
      validateName(name, "Column name");
      await connectDB();

      const col = await Column.findById(columnId);
      if (!col) throw new GraphQLError("Column not found", { extensions: { code: "NOT_FOUND" } });

      await requireBoardMember(ctx, col.boardId.toString());

      const column = await Column.findByIdAndUpdate(columnId, { name: name.trim() }, { new: true }).lean();
      return column;
    },

    deleteColumn: async (_: unknown, { columnId }: { columnId: string }, ctx: GraphQLContext) => {
      requireAuth(ctx);
      await connectDB();

      const column = await Column.findById(columnId);
      if (!column) throw new GraphQLError("Column not found", { extensions: { code: "NOT_FOUND" } });

      // Kolon silme destructive bir operasyon; yalniz board owner'i yapabilsin.
      await requireBoardOwner(ctx, column.boardId.toString());

      // Move cards to first column of the board
      const firstColumn = await Column.findOne({
        boardId: column.boardId,
        _id: { $ne: columnId },
      })
        .sort({ order: 1 })
        .lean();

      if (firstColumn) {
        const lastCard = await Card.findOne({ columnId: firstColumn._id, deletedAt: null })
          .sort({ order: -1 })
          .lean();
        let nextOrder = lastCard ? (lastCard as { order: number }).order + 1 : 0;

        const cardsToMove = await Card.find({ columnId, deletedAt: null }).sort({ order: 1 });
        for (const card of cardsToMove) {
          card.columnId = firstColumn._id;
          card.order = nextOrder++;
          await card.save();
        }
      }

      // Remove from board's columnIds
      await Board.findByIdAndUpdate(column.boardId, {
        $pull: { columnIds: column._id },
      });

      await Column.findByIdAndDelete(columnId);
      return true;
    },

    inviteMember: async (
      _: unknown,
      { boardId, email }: { boardId: string; email: string },
      ctx: GraphQLContext
    ) => {
      await requireBoardOwner(ctx, boardId);
      validateEmail(email);
      await connectDB();

      const board = await Board.findById(boardId);
      if (!board) throw new GraphQLError("Board not found", { extensions: { code: "NOT_FOUND" } });

      const user = await User.findOne({ email }).lean();
      if (!user) throw new GraphQLError("User not found with that email", { extensions: { code: "NOT_FOUND" } });

      const userId = (user as { _id: { toString(): string } })._id.toString();
      if (!board.memberIds.map((id: { toString(): string }) => id.toString()).includes(userId)) {
        board.memberIds.push(userId as unknown as typeof board.memberIds[0]);
        await board.save();
      }

      return board;
    },

    removeMember: async (
      _: unknown,
      { boardId, userId: targetUserId }: { boardId: string; userId: string },
      ctx: GraphQLContext
    ) => {
      const currentUserId = requireAuth(ctx);
      await connectDB();

      const board = await Board.findById(boardId);
      if (!board) throw new GraphQLError("Board not found", { extensions: { code: "NOT_FOUND" } });

      const isOwner = board.ownerId.toString() === currentUserId;
      const isSelfRemove = currentUserId === targetUserId;

      // Only owner can remove others; members can remove themselves
      if (!isOwner && !isSelfRemove) {
        throw new GraphQLError("Only the board owner can remove members", {
          extensions: { code: "FORBIDDEN" },
        });
      }

      // Owner cannot be removed
      if (board.ownerId.toString() === targetUserId) {
        throw new GraphQLError("Cannot remove the board owner", {
          extensions: { code: "FORBIDDEN" },
        });
      }

      board.memberIds = board.memberIds.filter(
        (id: { toString(): string }) => id.toString() !== targetUserId
      );
      await board.save();
      return board;
    },

    createSprint: async (
      _: unknown,
      { boardId, name, startDate, endDate }: { boardId: string; name: string; startDate: string; endDate: string },
      ctx: GraphQLContext
    ) => {
      await requireBoardMember(ctx, boardId);
      validateName(name, "Sprint name");
      validateDateRange(startDate, endDate);
      await connectDB();

      // Deactivate any current active sprint
      await Sprint.updateMany({ boardId, isActive: true }, { isActive: false });

      const sprint = await Sprint.create({
        name: name.trim(),
        boardId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: true,
      });

      return sprint;
    },

    completeSprint: async (_: unknown, { sprintId }: { sprintId: string }, ctx: GraphQLContext) => {
      requireAuth(ctx);
      await connectDB();

      const sprint = await Sprint.findById(sprintId);
      if (!sprint) throw new GraphQLError("Sprint not found", { extensions: { code: "NOT_FOUND" } });

      await requireBoardMember(ctx, sprint.boardId.toString());

      sprint.isActive = false;
      await sprint.save();

      return sprint;
    },

    addComment: async (
      _: unknown,
      { cardId, text }: { cardId: string; text: string },
      ctx: GraphQLContext
    ) => {
      const userId = requireAuth(ctx);
      await connectDB();

      // Validate text
      if (!text || typeof text !== "string" || text.trim().length === 0) {
        throw new GraphQLError("Comment text must be non-empty", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }
      if (text.length > 2000) {
        throw new GraphQLError("Comment text must be at most 2000 characters", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      const card = await Card.findById(cardId).lean();
      if (!card) throw new GraphQLError("Card not found", { extensions: { code: "NOT_FOUND" } });

      await requireBoardMember(ctx, (card as { boardId: { toString(): string } }).boardId.toString());

      const user = await User.findById(userId).lean();
      const authorName = user ? (user as { name: string }).name : "Unknown";
      const authorImage = user ? (user as { image?: string }).image : undefined;

      const comment = await Comment.create({
        text: text.trim(),
        cardId,
        authorId: userId,
        authorName,
        authorImage,
      });

      return comment;
    },
  },
};
