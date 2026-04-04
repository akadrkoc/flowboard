"use client";

import { useEffect, useState } from "react";
import { useBoardStore } from "@/store/boardStore";
import { graphqlFetch } from "@/lib/graphqlFetch";
import Navbar from "@/components/Navbar";
import Board from "@/components/Board";
import FilterBar from "@/components/FilterBar";
import StatsBar from "@/components/StatsBar";
import UndoToast from "@/components/UndoToast";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";

const GET_BOARDS_QUERY = `query { boards { id name } }`;
const CREATE_BOARD_MUTATION = `mutation CreateBoard($name: String!) { createBoard(name: $name) { id name } }`;

export default function Home() {
  const loadBoard = useBoardStore((s) => s.loadBoard);
  const initSocket = useBoardStore((s) => s.initSocket);
  const loadMembers = useBoardStore((s) => s.loadMembers);
  const loadSprints = useBoardStore((s) => s.loadSprints);
  const loading = useBoardStore((s) => s.loading);
  const columns = useBoardStore((s) => s.columns);
  const activeView = useBoardStore((s) => s.activeView);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sync dark mode class with store state on mount
  useEffect(() => {
    const saved = localStorage.getItem("flowboard-dark");
    const isDark = saved !== null ? saved === "true" : true;
    document.documentElement.classList.toggle("dark", isDark);
    if (!isDark) useBoardStore.setState({ darkMode: false });
  }, []);

  useEffect(() => {
    async function init() {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any = await graphqlFetch(GET_BOARDS_QUERY);

        let boardId: string;

        if (data.boards.length > 0) {
          boardId = data.boards[0].id;
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const createData: any = await graphqlFetch(CREATE_BOARD_MUTATION, {
            name: "My Board",
          });
          boardId = createData.createBoard.id;
        }

        await loadBoard(boardId);
        initSocket();
        loadMembers();
        loadSprints();
      } catch (err) {
        console.error("Init error:", err);
        setError((err as Error).message);
      } finally {
        setInitializing(false);
      }
    }

    init();
  }, [loadBoard, initSocket, loadMembers, loadSprints]);

  if (initializing || loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#fbf6ef] dark:bg-[#16161e] text-gray-900 dark:text-white">
        <div className="text-lg opacity-60">Loading board...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#fbf6ef] dark:bg-[#16161e] text-gray-900 dark:text-white">
        <div className="text-lg text-red-400">Error: {error}</div>
      </div>
    );
  }

  if (columns.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#fbf6ef] dark:bg-[#16161e] text-gray-900 dark:text-white">
        <div className="text-lg opacity-60">No board found</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#fbf6ef] dark:bg-[#16161e] text-gray-900 dark:text-white">
      <Navbar />
      {activeView === "analytics" ? (
        <AnalyticsDashboard />
      ) : (
        <>
          <FilterBar />
          <Board />
          <StatsBar />
        </>
      )}
      <UndoToast />
    </div>
  );
}
