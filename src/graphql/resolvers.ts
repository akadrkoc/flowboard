import { connectDB } from "@/lib/mongodb";
import { Board } from "@/models/Board";
import { Column } from "@/models/Column";
import { Card } from "@/models/Card";
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
      // Phase 3'te NextAuth session'dan gelecek
      return null;
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
      const cards = await Card.find({ columnId: parent._id })
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

      // Silinen karttan sonraki kartların order'ını düşür
      await Card.updateMany(
        { columnId: card.columnId, order: { $gt: card.order } },
        { $inc: { order: -1 } }
      );

      await Card.findByIdAndDelete(cardId);
      return true;
    },

    inviteMember: async (
      _: unknown,
      { boardId, email }: { boardId: string; email: string }
    ) => {
      await connectDB();

      // Phase 3'te User lookup ile gerçekleşecek
      const board = await Board.findById(boardId);
      if (!board) throw new Error("Board not found");

      // Placeholder - email ile user bulup memberIds'e ekleyeceğiz
      void email;
      return board;
    },
  },
};
