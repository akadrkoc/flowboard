import { GraphQLError } from "graphql";

export type RemoveMemberMode = "self" | "owner";

export interface RemoveMemberContext {
  currentUserId: string;
  targetUserId: string;
  ownerId: string;
  isCurrentUserMember: boolean;
}

export function isBoardMemberUser(
  userId: string,
  ownerId: string,
  memberIds: string[]
): boolean {
  return ownerId === userId || memberIds.includes(userId);
}

/** Enforce removeMember authorization; throws GraphQLError on violation. */
export function assertRemoveMemberAllowed(
  ctx: RemoveMemberContext
): RemoveMemberMode {
  if (ctx.ownerId === ctx.targetUserId) {
    throw new GraphQLError("Cannot remove the board owner", {
      extensions: { code: "FORBIDDEN" },
    });
  }

  const isSelfRemove = ctx.currentUserId === ctx.targetUserId;
  const isOwner = ctx.ownerId === ctx.currentUserId;

  if (isSelfRemove) {
    if (!ctx.isCurrentUserMember) {
      throw new GraphQLError("You are not a member of this board", {
        extensions: { code: "FORBIDDEN" },
      });
    }
    return "self";
  }

  if (!isOwner) {
    throw new GraphQLError("Only the board owner can remove members", {
      extensions: { code: "FORBIDDEN" },
    });
  }

  return "owner";
}
