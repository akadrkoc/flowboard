"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBoardStore } from "@/store/boardStore";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function Home() {
  const router = useRouter();
  const loadBoards = useBoardStore((s) => s.loadBoards);
  const createBoard = useBoardStore((s) => s.createBoard);

  useEffect(() => {
    async function redirect() {
      try {
        const boards = await loadBoards();
        let boardId: string;

        if (boards.length > 0) {
          const lastId = localStorage.getItem("flowboard-last-board");
          boardId =
            boards.find((b) => b.id === lastId)?.id ?? boards[0].id;
        } else {
          const created = await createBoard("My Board");
          boardId = created.id;
        }

        router.replace(`/board/${boardId}`);
      } catch {
        router.replace("/login");
      }
    }

    redirect();
  }, [loadBoards, createBoard, router]);

  return (
    <div className="flex items-center justify-center h-screen bg-[#fbf6ef] dark:bg-[#16161e]">
      <LoadingSpinner label="Loading FlowBoard..." />
    </div>
  );
}
