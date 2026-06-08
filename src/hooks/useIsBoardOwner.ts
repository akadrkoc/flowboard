"use client";

import { useSession } from "next-auth/react";
import { useBoardStore } from "@/store/boardStore";

export function useIsBoardOwner(): boolean {
  const boardOwnerId = useBoardStore((s) => s.boardOwnerId);
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  return Boolean(boardOwnerId && userId && boardOwnerId === userId);
}
