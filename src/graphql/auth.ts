import { GraphQLError } from "graphql";
import { connectDB } from "@/lib/mongodb";
import { Board } from "@/models/Board";
import type { GraphQLContext } from "@/app/api/graphql/route";

// ---------- Auth Helpers ----------

export function requireAuth(ctx: GraphQLContext): string {
  if (!ctx.userId) {
    throw new GraphQLError("You must be logged in", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }
  return ctx.userId;
}

export async function requireBoardMember(
  ctx: GraphQLContext,
  boardId: string
): Promise<string> {
  const userId = requireAuth(ctx);
  await connectDB();

  const board = await Board.findById(boardId).lean();
  if (!board) {
    throw new GraphQLError("Board not found", {
      extensions: { code: "NOT_FOUND" },
    });
  }

  const b = board as { ownerId: { toString(): string }; memberIds: { toString(): string }[] };
  const isOwner = b.ownerId.toString() === userId;
  const isMember = b.memberIds.some((id) => id.toString() === userId);

  if (!isOwner && !isMember) {
    throw new GraphQLError("You are not a member of this board", {
      extensions: { code: "FORBIDDEN" },
    });
  }

  return userId;
}

export async function requireBoardOwner(
  ctx: GraphQLContext,
  boardId: string
): Promise<string> {
  const userId = requireAuth(ctx);
  await connectDB();

  const board = await Board.findById(boardId).lean();
  if (!board) {
    throw new GraphQLError("Board not found", {
      extensions: { code: "NOT_FOUND" },
    });
  }

  const b = board as { ownerId: { toString(): string } };
  if (b.ownerId.toString() !== userId) {
    throw new GraphQLError("Only the board owner can perform this action", {
      extensions: { code: "FORBIDDEN" },
    });
  }

  return userId;
}

// ---------- Input Validation ----------

const CARD_INPUT_ALLOWED_FIELDS = [
  "title",
  "description",
  "labels",
  "priority",
  "dueDate",
  "storyPoints",
  "assigneeInitials",
  "assigneeColor",
] as const;

const VALID_PRIORITIES = ["high", "med", "low"];

export function sanitizeCardInput(input: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const key of CARD_INPUT_ALLOWED_FIELDS) {
    if (key in input && input[key] !== undefined) {
      sanitized[key] = input[key];
    }
  }

  // title: non-empty string, max 200 chars
  if (sanitized.title !== undefined) {
    if (typeof sanitized.title !== "string" || sanitized.title.trim().length === 0) {
      throw new GraphQLError("Title must be a non-empty string", {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }
    if (sanitized.title.length > 200) {
      throw new GraphQLError("Title must be at most 200 characters", {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }
    sanitized.title = sanitized.title.trim();
  }

  // description: max 5000 chars
  if (sanitized.description !== undefined && sanitized.description !== null) {
    if (typeof sanitized.description !== "string") {
      throw new GraphQLError("Description must be a string", {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }
    if (sanitized.description.length > 5000) {
      throw new GraphQLError("Description must be at most 5000 characters", {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }
  }

  // priority: must be valid enum
  if (sanitized.priority !== undefined) {
    if (!VALID_PRIORITIES.includes(sanitized.priority as string)) {
      throw new GraphQLError(`Priority must be one of: ${VALID_PRIORITIES.join(", ")}`, {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }
  }

  // storyPoints: non-negative integer
  if (sanitized.storyPoints !== undefined) {
    const sp = sanitized.storyPoints as number;
    if (typeof sp !== "number" || !Number.isInteger(sp) || sp < 0 || sp > 100) {
      throw new GraphQLError("Story points must be an integer between 0 and 100", {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }
  }

  // labels: array of strings, max 10 labels, each max 50 chars
  if (sanitized.labels !== undefined) {
    if (!Array.isArray(sanitized.labels)) {
      throw new GraphQLError("Labels must be an array", {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }
    if (sanitized.labels.length > 10) {
      throw new GraphQLError("Maximum 10 labels allowed", {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }
    for (const label of sanitized.labels) {
      if (typeof label !== "string" || label.length > 50) {
        throw new GraphQLError("Each label must be a string of at most 50 characters", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }
    }
  }

  return sanitized;
}

export function validateName(name: string, fieldName: string = "Name"): void {
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    throw new GraphQLError(`${fieldName} must be a non-empty string`, {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }
  if (name.length > 100) {
    throw new GraphQLError(`${fieldName} must be at most 100 characters`, {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }
}

export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    throw new GraphQLError("Invalid email address", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }
}

export function validateDateRange(startDate: string, endDate: string): void {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime())) {
    throw new GraphQLError("Invalid start date", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }
  if (isNaN(end.getTime())) {
    throw new GraphQLError("Invalid end date", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }
  if (end <= start) {
    throw new GraphQLError("End date must be after start date", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }
}
