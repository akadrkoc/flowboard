import { GraphQLError } from "graphql";
import mongoose from "mongoose";
import { Board } from "@/models/Board";
import { User } from "@/models/User";

const UNASSIGNED_COLOR = "bg-gray-500";

function initialsOf(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const ASSIGNEE_COLORS = [
  "bg-violet-500",
  "bg-sky-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-indigo-500",
  "bg-teal-500",
  "bg-orange-500",
];

function colorForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return ASSIGNEE_COLORS[Math.abs(hash) % ASSIGNEE_COLORS.length];
}

export async function applyAssigneeInput(
  input: Record<string, unknown>,
  boardId: string
): Promise<Record<string, unknown>> {
  if (!("assigneeId" in input)) return input;

  const raw = input.assigneeId;
  const next = { ...input };

  if (raw === null || raw === undefined || raw === "") {
    next.assigneeId = null;
    next.assigneeInitials = "";
    next.assigneeColor = UNASSIGNED_COLOR;
    return next;
  }

  if (typeof raw !== "string" || !mongoose.Types.ObjectId.isValid(raw)) {
    throw new GraphQLError("Invalid assignee ID", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  const board = await Board.findById(boardId).lean();
  if (!board) {
    throw new GraphQLError("Board not found", {
      extensions: { code: "NOT_FOUND" },
    });
  }

  const memberIds = (
    board as { memberIds: { toString(): string }[] }
  ).memberIds.map((id) => id.toString());
  const ownerId = (
    board as { ownerId: { toString(): string } }
  ).ownerId.toString();

  if (!memberIds.includes(raw) && ownerId !== raw) {
    throw new GraphQLError("Assignee must be a board member", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  const user = await User.findById(raw).lean();
  if (!user) {
    throw new GraphQLError("Assignee user not found", {
      extensions: { code: "NOT_FOUND" },
    });
  }

  const userId = (user as { _id: { toString(): string } })._id.toString();
  next.assigneeId = raw;
  next.assigneeInitials = initialsOf((user as { name: string }).name);
  next.assigneeColor = colorForId(userId);
  return next;
}
