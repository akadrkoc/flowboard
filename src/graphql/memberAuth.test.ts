import { describe, expect, it } from "vitest";
import { GraphQLError } from "graphql";
import {
  assertRemoveMemberAllowed,
  isBoardMemberUser,
} from "./memberAuth";

const OWNER = "owner-id";
const MEMBER = "member-id";
const OUTSIDER = "outsider-id";

describe("isBoardMemberUser", () => {
  it("treats owner as a member even if not in memberIds", () => {
    expect(isBoardMemberUser(OWNER, OWNER, [])).toBe(true);
  });

  it("detects listed members", () => {
    expect(isBoardMemberUser(MEMBER, OWNER, [MEMBER])).toBe(true);
    expect(isBoardMemberUser(OUTSIDER, OWNER, [MEMBER])).toBe(false);
  });
});

describe("assertRemoveMemberAllowed", () => {
  it("blocks outsider self-remove IDOR", () => {
    expect(() =>
      assertRemoveMemberAllowed({
        currentUserId: OUTSIDER,
        targetUserId: OUTSIDER,
        ownerId: OWNER,
        isCurrentUserMember: false,
      })
    ).toThrow(/not a member/i);
  });

  it("allows member self-remove", () => {
    expect(
      assertRemoveMemberAllowed({
        currentUserId: MEMBER,
        targetUserId: MEMBER,
        ownerId: OWNER,
        isCurrentUserMember: true,
      })
    ).toBe("self");
  });

  it("allows owner to remove another member", () => {
    expect(
      assertRemoveMemberAllowed({
        currentUserId: OWNER,
        targetUserId: MEMBER,
        ownerId: OWNER,
        isCurrentUserMember: true,
      })
    ).toBe("owner");
  });

  it("blocks non-owner from removing others", () => {
    expect(() =>
      assertRemoveMemberAllowed({
        currentUserId: MEMBER,
        targetUserId: OUTSIDER,
        ownerId: OWNER,
        isCurrentUserMember: true,
      })
    ).toThrow(GraphQLError);
  });

  it("blocks removing the board owner", () => {
    expect(() =>
      assertRemoveMemberAllowed({
        currentUserId: OWNER,
        targetUserId: OWNER,
        ownerId: OWNER,
        isCurrentUserMember: true,
      })
    ).toThrow(/board owner/i);
  });
});
