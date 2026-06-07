import { GraphQLError } from "graphql";
import { connectDB } from "@/lib/mongodb";
import { Board } from "@/models/Board";
import { Card } from "@/models/Card";
import { Comment } from "@/models/Comment";
import { Activity } from "@/models/Activity";
import { Subtask } from "@/models/Subtask";
import { User } from "@/models/User";
import { Sprint } from "@/models/Sprint";
import type { GraphQLContext } from "@/app/api/graphql/route";
import {
  requireAuth,
  requireBoardMember,
} from "@/graphql/auth";

async function assertCardAccess(ctx: GraphQLContext, cardId: string) {
  requireAuth(ctx);
  await connectDB();
  const card = await Card.findById(cardId).lean();
  if (!card)
    throw new GraphQLError("Card not found", {
      extensions: { code: "NOT_FOUND" },
    });
  await requireBoardMember(
    ctx,
    (card as { boardId: { toString(): string } }).boardId.toString()
  );
  return card as { boardId: { toString(): string } };
}

export const queryResolvers = {
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

  comments: async (
    _: unknown,
    { cardId }: { cardId: string },
    ctx: GraphQLContext
  ) => {
    requireAuth(ctx);
    await connectDB();

    const card = await Card.findById(cardId).lean();
    if (!card)
      throw new GraphQLError("Card not found", {
        extensions: { code: "NOT_FOUND" },
      });
    await requireBoardMember(
      ctx,
      (card as { boardId: { toString(): string } }).boardId.toString()
    );

    return Comment.find({ cardId }).sort({ createdAt: 1 }).lean();
  },

  subtasks: async (
    _: unknown,
    { cardId }: { cardId: string },
    ctx: GraphQLContext
  ) => {
    await assertCardAccess(ctx, cardId);
    return Subtask.find({ cardId }).sort({ order: 1 }).lean();
  },

  activityFeed: async (
    _: unknown,
    { cardId }: { cardId: string },
    ctx: GraphQLContext
  ) => {
    await assertCardAccess(ctx, cardId);

    const [comments, activities] = await Promise.all([
      Comment.find({ cardId }).sort({ createdAt: -1 }).lean(),
      Activity.find({ cardId }).sort({ createdAt: -1 }).lean(),
    ]);

    type FeedItem = {
      id: string;
      type: string;
      text: string;
      actorName: string;
      actorImage?: string;
      createdAt: string;
      sortTime: number;
    };

    const feed: FeedItem[] = [
      ...comments.map((c) => {
        const doc = c as {
          _id: { toString(): string };
          text: string;
          authorName: string;
          authorImage?: string;
          createdAt?: Date;
        };
        return {
          id: `comment-${doc._id.toString()}`,
          type: "comment",
          text: doc.text,
          actorName: doc.authorName,
          actorImage: doc.authorImage,
          createdAt:
            doc.createdAt instanceof Date
              ? doc.createdAt.toISOString()
              : new Date().toISOString(),
          sortTime: doc.createdAt ? doc.createdAt.getTime() : 0,
        };
      }),
      ...activities.map((a) => {
        const doc = a as {
          _id: { toString(): string };
          type: string;
          text: string;
          actorName: string;
          actorImage?: string;
          createdAt?: Date;
        };
        return {
          id: doc._id.toString(),
          type: doc.type,
          text: doc.text,
          actorName: doc.actorName,
          actorImage: doc.actorImage,
          createdAt:
            doc.createdAt instanceof Date
              ? doc.createdAt.toISOString()
              : new Date().toISOString(),
          sortTime: doc.createdAt ? doc.createdAt.getTime() : 0,
        };
      }),
    ];

    feed.sort((a, b) => b.sortTime - a.sortTime);

    return feed.map(({ sortTime, ...item }) => {
      void sortTime;
      return item;
    });
  },

  sprints: async (
    _: unknown,
    { boardId }: { boardId: string },
    ctx: GraphQLContext
  ) => {
    await requireBoardMember(ctx, boardId);
    return Sprint.find({ boardId }).sort({ createdAt: -1 }).lean();
  },

  activeSprint: async (
    _: unknown,
    { boardId }: { boardId: string },
    ctx: GraphQLContext
  ) => {
    await requireBoardMember(ctx, boardId);
    return Sprint.findOne({ boardId, isActive: true }).lean();
  },

  boardMembers: async (
    _: unknown,
    { boardId }: { boardId: string },
    ctx: GraphQLContext
  ) => {
    await requireBoardMember(ctx, boardId);
    const board = await Board.findById(boardId).lean();
    if (!board)
      throw new GraphQLError("Board not found", {
        extensions: { code: "NOT_FOUND" },
      });
    const memberIds = (board as { memberIds: string[] }).memberIds || [];
    if (memberIds.length === 0) return [];
    return User.find({ _id: { $in: memberIds } }).lean();
  },
};
