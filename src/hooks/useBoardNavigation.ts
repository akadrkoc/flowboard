"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useBoardStore } from "@/store/boardStore";

export function useBoardNavigation() {
  const router = useRouter();
  const boardId = useBoardStore((s) => s.boardId);
  const switchBoard = useBoardStore((s) => s.switchBoard);
  const createBoard = useBoardStore((s) => s.createBoard);

  const navigateToBoard = useCallback(
    async (targetBoardId: string) => {
      if (targetBoardId === boardId) return;
      await switchBoard(targetBoardId);
      router.push(`/board/${targetBoardId}`, { scroll: false });
    },
    [boardId, switchBoard, router]
  );

  const openTask = useCallback(
    (taskId: string, targetBoardId?: string) => {
      const id = targetBoardId ?? boardId;
      if (!id) return;
      router.push(`/board/${id}?task=${taskId}`, { scroll: false });
    },
    [boardId, router]
  );

  const closeTask = useCallback(() => {
    if (!boardId) return;
    router.push(`/board/${boardId}`, { scroll: false });
  }, [boardId, router]);

  const createAndNavigate = useCallback(
    async (name: string) => {
      const board = await createBoard(name);
      await switchBoard(board.id);
      router.push(`/board/${board.id}`, { scroll: false });
      return board;
    },
    [createBoard, switchBoard, router]
  );

  return {
    navigateToBoard,
    openTask,
    closeTask,
    createAndNavigate,
  };
}
