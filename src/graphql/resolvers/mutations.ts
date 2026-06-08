import { GraphQLError } from "graphql";
import { connectDB } from "@/lib/mongodb";
import { Board } from "@/models/Board";
import { Column } from "@/models/Column";
import { Card } from "@/models/Card";
import { Comment } from "@/models/Comment";
import { Subtask } from "@/models/Subtask";
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
  validateMoveIndex,
} from "@/graphql/auth";
import { applyAssigneeInput } from "@/graphql/assigneeInput";
import { getActorFromUserId, logActivity } from "@/graphql/activityLog";
import {
  broadcastCardCreated,
  broadcastCardDeleted,
  broadcastCardMoved,
  broadcastCardUpdated,
  broadcastColumnAdded,
  broadcastColumnDeleted,
  broadcastColumnRenamed,
  broadcastCommentAdded,
} from "@/graphql/realtimeBroadcast";

export const mutationResolvers = {
  createBoard: async (
    _: unknown,
    { name }: { name: string },
    ctx: GraphQLContext
  ) => {
    const userId = requireAuth(ctx);
    validateName(name, "Board name");
    await connectDB();

    const board = await Board.create({
      name: name.trim(),
      ownerId: userId,
      memberIds: [userId],
      columnIds: [],
    });

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
    {
      columnId,
      input,
    }: { columnId: string; input: Record<string, unknown> },
    ctx: GraphQLContext
  ) => {
    const userId = requireAuth(ctx);
    await connectDB();

    const column = await Column.findById(columnId);
    if (!column)
      throw new GraphQLError("Column not found", {
        extensions: { code: "NOT_FOUND" },
      });

    await requireBoardMember(ctx, column.boardId.toString());
    let sanitized = sanitizeCardInput(input);
    sanitized = await applyAssigneeInput(
      sanitized,
      column.boardId.toString()
    );

    const lastCard = await Card.findOne({ columnId }).sort({ order: -1 }).lean();
    const nextOrder = lastCard ? (lastCard as { order: number }).order + 1 : 0;

    const card = await Card.create({
      ...sanitized,
      columnId,
      boardId: column.boardId,
      order: nextOrder,
    });

    const actor = await getActorFromUserId(userId);
    await logActivity({
      cardId: card._id.toString(),
      type: "created",
      text: "Created this task",
      actorId: userId,
      actorName: actor.actorName,
      actorImage: actor.actorImage,
    });

    broadcastCardCreated(column.boardId.toString(), card);

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
    const userId = requireAuth(ctx);
    await connectDB();

    const card = await Card.findById(cardId);
    if (!card)
      throw new GraphQLError("Card not found", {
        extensions: { code: "NOT_FOUND" },
      });

    await requireBoardMember(ctx, card.boardId.toString());

    const toColumn = await Column.findById(toColumnId).lean();
    if (!toColumn) {
      throw new GraphQLError("Target column not found", {
        extensions: { code: "NOT_FOUND" },
      });
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

    const targetCardCount = await Card.countDocuments({
      columnId: toColumnId,
      deletedAt: null,
    });
    const boundedIndex = validateMoveIndex(
      newIndex,
      targetCardCount,
      !isMovingColumns
    );

    if (isMovingColumns) {
      await Card.updateMany(
        { columnId: fromColumnId, order: { $gt: card.order } },
        { $inc: { order: -1 } }
      );

      await Card.updateMany(
        { columnId: toColumnId, order: { $gte: boundedIndex } },
        { $inc: { order: 1 } }
      );

      card.columnId = toColumnId as unknown as typeof card.columnId;

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
      const oldIndex = card.order;
      if (oldIndex < boundedIndex) {
        await Card.updateMany(
          {
            columnId: toColumnId,
            order: { $gt: oldIndex, $lte: boundedIndex },
          },
          { $inc: { order: -1 } }
        );
      } else if (oldIndex > boundedIndex) {
        await Card.updateMany(
          {
            columnId: toColumnId,
            order: { $gte: boundedIndex, $lt: oldIndex },
          },
          { $inc: { order: 1 } }
        );
      }
    }

    card.order = boundedIndex;
    await card.save();

    if (isMovingColumns) {
      const actor = await getActorFromUserId(userId);
      const toName = (toColumn as { name: string }).name;
      await logActivity({
        cardId,
        type: "status_changed",
        text: `Moved to ${toName}`,
        actorId: userId,
        actorName: actor.actorName,
        actorImage: actor.actorImage,
      });
    }

    broadcastCardMoved(
      card.boardId.toString(),
      cardId,
      toColumnId,
      boundedIndex
    );

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
    const userId = requireAuth(ctx);
    await connectDB();

    const existingCard = await Card.findById(cardId);
    if (!existingCard)
      throw new GraphQLError("Card not found", {
        extensions: { code: "NOT_FOUND" },
      });

    await requireBoardMember(ctx, existingCard.boardId.toString());
    let sanitized = sanitizeCardInput(input);
    const boardId = existingCard.boardId.toString();
    const hadAssigneeChange = "assigneeId" in sanitized;
    const oldAssignee = existingCard.assigneeId?.toString() ?? null;

    sanitized = await applyAssigneeInput(sanitized, boardId);

    if (hadAssigneeChange) {
      const newAssignee =
        sanitized.assigneeId === null || sanitized.assigneeId === undefined
          ? null
          : String(sanitized.assigneeId);

      if (oldAssignee !== newAssignee) {
        const actor = await getActorFromUserId(userId);
        if (!newAssignee) {
          await logActivity({
            cardId,
            type: "assignee_changed",
            text: "Unassigned this task",
            actorId: userId,
            actorName: actor.actorName,
            actorImage: actor.actorImage,
          });
        } else {
          const assignee = await User.findById(newAssignee).lean();
          const name = assignee
            ? (assignee as { name: string }).name
            : "member";
          await logActivity({
            cardId,
            type: "assignee_changed",
            text: `Assigned to ${name}`,
            actorId: userId,
            actorName: actor.actorName,
            actorImage: actor.actorImage,
          });
        }
      }
    }

    if (Object.keys(sanitized).length === 0) {
      return existingCard;
    }

    const card = await Card.findByIdAndUpdate(cardId, sanitized, {
      new: true,
    }).lean();

    broadcastCardUpdated(boardId, cardId, sanitized);

    return card;
  },

  deleteCard: async (
    _: unknown,
    { cardId }: { cardId: string },
    ctx: GraphQLContext
  ) => {
    requireAuth(ctx);
    await connectDB();

    const card = await Card.findById(cardId);
    if (!card)
      throw new GraphQLError("Card not found", {
        extensions: { code: "NOT_FOUND" },
      });

    await requireBoardMember(ctx, card.boardId.toString());

    card.deletedAt = new Date();
    await card.save();

    await Card.updateMany(
      { columnId: card.columnId, deletedAt: null, order: { $gt: card.order } },
      { $inc: { order: -1 } }
    );

    broadcastCardDeleted(card.boardId.toString(), cardId);

    return true;
  },

  restoreCard: async (
    _: unknown,
    { cardId }: { cardId: string },
    ctx: GraphQLContext
  ) => {
    requireAuth(ctx);
    await connectDB();

    const card = await Card.findById(cardId);
    if (!card)
      throw new GraphQLError("Card not found", {
        extensions: { code: "NOT_FOUND" },
      });

    await requireBoardMember(ctx, card.boardId.toString());

    if (!card.deletedAt) {
      throw new GraphQLError("Card is not deleted", {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }

    const lastCard = await Card.findOne({
      columnId: card.columnId,
      deletedAt: null,
    })
      .sort({ order: -1 })
      .lean();
    const nextOrder = lastCard ? (lastCard as { order: number }).order + 1 : 0;

    card.deletedAt = null as unknown as Date;
    card.order = nextOrder;
    await card.save();

    broadcastCardCreated(card.boardId.toString(), card);

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
    if (!board)
      throw new GraphQLError("Board not found", {
        extensions: { code: "NOT_FOUND" },
      });

    const lastColumn = await Column.findOne({ boardId })
      .sort({ order: -1 })
      .lean();
    const nextOrder = lastColumn ? (lastColumn as { order: number }).order + 1 : 0;

    const column = await Column.create({
      name: name.trim(),
      boardId,
      order: nextOrder,
    });
    board.columnIds.push(column._id);
    await board.save();

    broadcastColumnAdded(boardId, column._id.toString(), column.name);

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
    if (!col)
      throw new GraphQLError("Column not found", {
        extensions: { code: "NOT_FOUND" },
      });

    await requireBoardMember(ctx, col.boardId.toString());

    const column = await Column.findByIdAndUpdate(
      columnId,
      { name: name.trim() },
      { new: true }
    ).lean();

    broadcastColumnRenamed(
      col.boardId.toString(),
      columnId,
      (column as { name: string }).name
    );

    return column;
  },

  deleteColumn: async (
    _: unknown,
    { columnId }: { columnId: string },
    ctx: GraphQLContext
  ) => {
    requireAuth(ctx);
    await connectDB();

    const column = await Column.findById(columnId);
    if (!column)
      throw new GraphQLError("Column not found", {
        extensions: { code: "NOT_FOUND" },
      });

    await requireBoardOwner(ctx, column.boardId.toString());

    const firstColumn = await Column.findOne({
      boardId: column.boardId,
      _id: { $ne: columnId },
    })
      .sort({ order: 1 })
      .lean();

    if (firstColumn) {
      const lastCard = await Card.findOne({
        columnId: firstColumn._id,
        deletedAt: null,
      })
        .sort({ order: -1 })
        .lean();
      let nextOrder = lastCard ? (lastCard as { order: number }).order + 1 : 0;

      const cardsToMove = await Card.find({
        columnId,
        deletedAt: null,
      }).sort({ order: 1 });
      for (const card of cardsToMove) {
        card.columnId = firstColumn._id;
        card.order = nextOrder++;
        await card.save();
      }
    }

    await Board.findByIdAndUpdate(column.boardId, {
      $pull: { columnIds: column._id },
    });

    await Column.findByIdAndDelete(columnId);

    broadcastColumnDeleted(column.boardId.toString(), columnId);

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

    const normalizedEmail = email.trim().toLowerCase();

    const board = await Board.findById(boardId);
    if (!board)
      throw new GraphQLError("Board not found", {
        extensions: { code: "NOT_FOUND" },
      });

    const user = await User.findOne({ email: normalizedEmail }).lean();
    if (!user) {
      throw new GraphQLError("Unable to invite user", {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }

    const userId = (user as { _id: { toString(): string } })._id.toString();
    if (
      !board.memberIds
        .map((id: { toString(): string }) => id.toString())
        .includes(userId)
    ) {
      board.memberIds.push(userId as unknown as (typeof board.memberIds)[0]);
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
    if (!board)
      throw new GraphQLError("Board not found", {
        extensions: { code: "NOT_FOUND" },
      });

    const isOwner = board.ownerId.toString() === currentUserId;
    const isSelfRemove = currentUserId === targetUserId;

    if (isSelfRemove) {
      await requireBoardMember(ctx, boardId);
    } else if (!isOwner) {
      throw new GraphQLError("Only the board owner can remove members", {
        extensions: { code: "FORBIDDEN" },
      });
    }

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
    {
      boardId,
      name,
      startDate,
      endDate,
    }: {
      boardId: string;
      name: string;
      startDate: string;
      endDate: string;
    },
    ctx: GraphQLContext
  ) => {
    await requireBoardMember(ctx, boardId);
    validateName(name, "Sprint name");
    validateDateRange(startDate, endDate);
    await connectDB();

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

  completeSprint: async (
    _: unknown,
    { sprintId }: { sprintId: string },
    ctx: GraphQLContext
  ) => {
    requireAuth(ctx);
    await connectDB();

    const sprint = await Sprint.findById(sprintId);
    if (!sprint)
      throw new GraphQLError("Sprint not found", {
        extensions: { code: "NOT_FOUND" },
      });

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
    if (!card)
      throw new GraphQLError("Card not found", {
        extensions: { code: "NOT_FOUND" },
      });

    await requireBoardMember(
      ctx,
      (card as { boardId: { toString(): string } }).boardId.toString()
    );

    const user = await User.findById(userId).lean();
    const authorName = user ? (user as { name: string }).name : "Unknown";
    const authorImage = user
      ? (user as { image?: string }).image
      : undefined;

    const comment = await Comment.create({
      text: text.trim(),
      cardId,
      authorId: userId,
      authorName,
      authorImage,
    });

    const boardId = (card as { boardId: { toString(): string } }).boardId.toString();
    broadcastCommentAdded(boardId, cardId, comment);

    return comment;
  },

  addSubtask: async (
    _: unknown,
    { cardId, title }: { cardId: string; title: string },
    ctx: GraphQLContext
  ) => {
    const userId = requireAuth(ctx);
    validateName(title, "Subtask title");
    await connectDB();

    const card = await Card.findById(cardId);
    if (!card)
      throw new GraphQLError("Card not found", {
        extensions: { code: "NOT_FOUND" },
      });
    await requireBoardMember(ctx, card.boardId.toString());

    const last = await Subtask.findOne({ cardId }).sort({ order: -1 }).lean();
    const nextOrder = last ? (last as { order: number }).order + 1 : 0;

    const subtask = await Subtask.create({
      cardId,
      title: title.trim(),
      order: nextOrder,
    });

    const actor = await getActorFromUserId(userId);
    await logActivity({
      cardId,
      type: "subtask_added",
      text: `Added subtask "${title.trim()}"`,
      actorId: userId,
      actorName: actor.actorName,
      actorImage: actor.actorImage,
    });

    return subtask;
  },

  toggleSubtask: async (
    _: unknown,
    { subtaskId }: { subtaskId: string },
    ctx: GraphQLContext
  ) => {
    const userId = requireAuth(ctx);
    await connectDB();

    const subtask = await Subtask.findById(subtaskId);
    if (!subtask)
      throw new GraphQLError("Subtask not found", {
        extensions: { code: "NOT_FOUND" },
      });

    const card = await Card.findById(subtask.cardId);
    if (!card)
      throw new GraphQLError("Card not found", {
        extensions: { code: "NOT_FOUND" },
      });
    await requireBoardMember(ctx, card.boardId.toString());

    subtask.completed = !subtask.completed;
    await subtask.save();

    const actor = await getActorFromUserId(userId);
    await logActivity({
      cardId: subtask.cardId.toString(),
      type: "subtask_completed",
      text: subtask.completed
        ? `Completed "${subtask.title}"`
        : `Reopened "${subtask.title}"`,
      actorId: userId,
      actorName: actor.actorName,
      actorImage: actor.actorImage,
    });

    return subtask;
  },

  updateSubtask: async (
    _: unknown,
    { subtaskId, title }: { subtaskId: string; title: string },
    ctx: GraphQLContext
  ) => {
    requireAuth(ctx);
    validateName(title, "Subtask title");
    await connectDB();

    const subtask = await Subtask.findById(subtaskId);
    if (!subtask)
      throw new GraphQLError("Subtask not found", {
        extensions: { code: "NOT_FOUND" },
      });

    const card = await Card.findById(subtask.cardId);
    if (!card)
      throw new GraphQLError("Card not found", {
        extensions: { code: "NOT_FOUND" },
      });
    await requireBoardMember(ctx, card.boardId.toString());

    subtask.title = title.trim();
    await subtask.save();
    return subtask;
  },

  deleteSubtask: async (
    _: unknown,
    { subtaskId }: { subtaskId: string },
    ctx: GraphQLContext
  ) => {
    requireAuth(ctx);
    await connectDB();

    const subtask = await Subtask.findById(subtaskId);
    if (!subtask)
      throw new GraphQLError("Subtask not found", {
        extensions: { code: "NOT_FOUND" },
      });

    const card = await Card.findById(subtask.cardId);
    if (!card)
      throw new GraphQLError("Card not found", {
        extensions: { code: "NOT_FOUND" },
      });
    await requireBoardMember(ctx, card.boardId.toString());

    await Subtask.findByIdAndDelete(subtaskId);
    return true;
  },
};
