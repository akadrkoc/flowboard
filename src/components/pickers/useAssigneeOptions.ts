import { useMemo } from "react";
import type { Session } from "next-auth";
import { initialsOf, colorForId, UNASSIGNED_COLOR } from "@/lib/assignee";
import type { BoardMember } from "@/store/boardTypes";
import type { AssigneeOption } from "./types";

export function useAssigneeOptions(
  members: BoardMember[],
  session: Session | null
): AssigneeOption[] {
  const currentUser = session?.user;
  const currentUserEmail = currentUser?.email ?? null;
  const currentUserName = currentUser?.name ?? null;

  const currentMember = useMemo(() => {
    if (!currentUserEmail) return null;
    return (
      members.find(
        (m) => m.email?.toLowerCase() === currentUserEmail.toLowerCase()
      ) ?? null
    );
  }, [members, currentUserEmail]);

  return useMemo(() => {
    const list: AssigneeOption[] = [
      {
        id: "unassigned",
        name: "Unassigned",
        initials: "",
        color: UNASSIGNED_COLOR,
        unassigned: true,
      },
    ];

    if (currentMember) {
      list.push({
        id: currentMember.id,
        name: `${currentMember.name} (you)`,
        email: currentMember.email,
        image: currentMember.image,
        initials: initialsOf(currentMember.name),
        color: colorForId(currentMember.id),
      });
    } else if (currentUserName || currentUserEmail) {
      list.push({
        id: "",
        name: currentUserName ? `${currentUserName} (you)` : "You",
        email: currentUserEmail ?? undefined,
        image: currentUser?.image ?? undefined,
        initials: initialsOf(currentUserName),
        color: "bg-violet-500",
      });
    }

    for (const m of members) {
      if (currentMember && m.id === currentMember.id) continue;
      list.push({
        id: m.id,
        name: m.name,
        email: m.email,
        image: m.image,
        initials: initialsOf(m.name),
        color: colorForId(m.id),
      });
    }

    return list;
  }, [
    members,
    currentMember,
    currentUser?.image,
    currentUserEmail,
    currentUserName,
  ]);
}
