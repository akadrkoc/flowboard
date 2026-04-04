import { connectDB } from "@/lib/mongodb";
import { Board } from "@/models/Board";
import { Column } from "@/models/Column";
import { Card } from "@/models/Card";
import { Comment } from "@/models/Comment";
import { User } from "@/models/User";
import { Sprint } from "@/models/Sprint";
import type { GraphQLContext } from "@/app/api/graphql/route";

export const resolvers = {
  Query: {
    boards: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      await connectDB();
      // Kullanıcının üyesi olduğu veya owner olduğu board'lar
      if (ctx.userId) {
        return Board.find({
          $or: [{ ownerId: ctx.userId }, { memberIds: ctx.userId }],
        }).lean();
      }
      return Board.find().lean();
    },

    board: async (_: unknown, { id }: { id: string }) => {
      await connectDB();
      return Board.findById(id).lean();
    },

    me: async () => {
      return null;
    },

    comments: async (_: unknown, { cardId }: { cardId: string }) => {
      await connectDB();
      return Comment.find({ cardId }).sort({ createdAt: 1 }).lean();
    },

    sprints: async (_: unknown, { boardId }: { boardId: string }) => {
      await connectDB();
      return Sprint.find({ boardId }).sort({ createdAt: -1 }).lean();
    },

    activeSprint: async (_: unknown, { boardId }: { boardId: string }) => {
      await connectDB();
      return Sprint.findOne({ boardId, isActive: true }).lean();
    },

    boardMembers: async (_: unknown, { boardId }: { boardId: string }) => {
      await connectDB();
      const board = await Board.findById(boardId).lean();
      if (!board) throw new Error("Board not found");
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
  },

  Mutation: {
    createBoard: async (_: unknown, { name }: { name: string }, ctx: GraphQLContext) => {
      await connectDB();

      const board = await Board.create({
        name,
        ownerId: ctx.userId || "000000000000000000000000",
        memberIds: ctx.userId ? [ctx.userId] : [],
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
      { columnId, input }: { columnId: string; input: Record<string, unknown> }
    ) => {
      await connectDB();

      const column = await Column.findById(columnId);
      if (!column) throw new Error("Column not found");

      // Sıradaki order değerini bul
      const lastCard = await Card.findOne({ columnId })
        .sort({ order: -1 })
        .lean();
      const nextOrder = lastCard ? (lastCard as { order: number }).order + 1 : 0;

      const card = await Card.create({
        ...input,
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
      }: { cardId: string; toColumnId: string; newIndex: number }
    ) => {
      await connectDB();

      const card = await Card.findById(cardId);
      if (!card) throw new Error("Card not found");

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
      }: { cardId: string; input: Record<string, unknown> }
    ) => {
      await connectDB();

      const card = await Card.findByIdAndUpdate(cardId, input, {
        new: true,
      }).lean();

      if (!card) throw new Error("Card not found");
      return card;
    },

    deleteCard: async (_: unknown, { cardId }: { cardId: string }) => {
      await connectDB();

      const card = await Card.findById(cardId);
      if (!card) throw new Error("Card not found");

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

    restoreCard: async (_: unknown, { cardId }: { cardId: string }) => {
      await connectDB();

      const card = await Card.findById(cardId);
      if (!card) throw new Error("Card not found");

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
      { boardId, name }: { boardId: string; name: string }
    ) => {
      await connectDB();

      const board = await Board.findById(boardId);
      if (!board) throw new Error("Board not found");

      const lastColumn = await Column.findOne({ boardId })
        .sort({ order: -1 })
        .lean();
      const nextOrder = lastColumn ? (lastColumn as { order: number }).order + 1 : 0;

      const column = await Column.create({ name, boardId, order: nextOrder });
      board.columnIds.push(column._id);
      await board.save();

      return column;
    },

    renameColumn: async (
      _: unknown,
      { columnId, name }: { columnId: string; name: string }
    ) => {
      await connectDB();

      const column = await Column.findByIdAndUpdate(columnId, { name }, { new: true }).lean();
      if (!column) throw new Error("Column not found");
      return column;
    },

    deleteColumn: async (_: unknown, { columnId }: { columnId: string }) => {
      await connectDB();

      const column = await Column.findById(columnId);
      if (!column) throw new Error("Column not found");

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
      { boardId, email }: { boardId: string; email: string }
    ) => {
      await connectDB();

      const board = await Board.findById(boardId);
      if (!board) throw new Error("Board not found");

      const user = await User.findOne({ email }).lean();
      if (!user) throw new Error("User not found with that email");

      const userId = (user as { _id: { toString(): string } })._id.toString();
      if (!board.memberIds.map((id: { toString(): string }) => id.toString()).includes(userId)) {
        board.memberIds.push(userId as unknown as typeof board.memberIds[0]);
        await board.save();
      }

      return board;
    },

    removeMember: async (
      _: unknown,
      { boardId, userId }: { boardId: string; userId: string }
    ) => {
      await connectDB();

      const board = await Board.findById(boardId);
      if (!board) throw new Error("Board not found");

      board.memberIds = board.memberIds.filter(
        (id: { toString(): string }) => id.toString() !== userId
      );
      await board.save();
      return board;
    },

    createSprint: async (
      _: unknown,
      { boardId, name, startDate, endDate }: { boardId: string; name: string; startDate: string; endDate: string }
    ) => {
      await connectDB();

      // Deactivate any current active sprint
      await Sprint.updateMany({ boardId, isActive: true }, { isActive: false });

      const sprint = await Sprint.create({
        name,
        boardId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: true,
      });

      return sprint;
    },

    completeSprint: async (_: unknown, { sprintId }: { sprintId: string }) => {
      await connectDB();

      const sprint = await Sprint.findByIdAndUpdate(
        sprintId,
        { isActive: false },
        { new: true }
      ).lean();

      if (!sprint) throw new Error("Sprint not found");
      return sprint;
    },

    addComment: async (
      _: unknown,
      { cardId, text }: { cardId: string; text: string },
      ctx: GraphQLContext
    ) => {
      await connectDB();

      let authorName = "Anonymous";
      let authorImage: string | undefined;

      if (ctx.userId) {
        const user = await User.findById(ctx.userId).lean();
        if (user) {
          authorName = (user as { name: string }).name;
          authorImage = (user as { image?: string }).image;
        }
      }

      const comment = await Comment.create({
        text,
        cardId,
        authorName,
        authorImage,
      });

      return comment;
    },
  },
};
