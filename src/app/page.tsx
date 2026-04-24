"use client";

import { useEffect, useState } from "react";
import { useBoardStore } from "@/store/boardStore";
import Navbar from "@/components/Navbar";
import Board from "@/components/Board";
import FilterBar from "@/components/FilterBar";
import StatsBar from "@/components/StatsBar";
import UndoToast from "@/components/UndoToast";
import ErrorToast from "@/components/ErrorToast";
import BulkActionsBar from "@/components/BulkActionsBar";
import KeyboardShortcuts from "@/components/KeyboardShortcuts";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";

export default function Home() {
  const loadBoards = useBoardStore((s) => s.loadBoards);
  const createBoard = useBoardStore((s) => s.createBoard);
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
        const boards = await loadBoards();

        let boardId: string;

        if (boards.length > 0) {
          // En son kullanilan board'u tercih et; yoksa ilkini ac.
          const lastId = typeof window !== "undefined"
            ? localStorage.getItem("flowboard-last-board")
            : null;
          boardId =
            boards.find((b) => b.id === lastId)?.id ?? boards[0].id;
        } else {
          const created = await createBoard("My Board");
          boardId = created.id;
        }

        await loadBoard(boardId);
        initSocket();
        loadMembers();
        loadSprints();

        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("flowboard-last-board", boardId);
          } catch {
            // Ignore quota / private mode errors.
          }
        }
      } catch (err) {
        console.error("Init error:", err);
        setError((err as Error).message);
      } finally {
        setInitializing(false);
      }
    }

    init();
  }, [loadBoards, createBoard, loadBoard, initSocket, loadMembers, loadSprints]);

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
      <ErrorToast />
      <BulkActionsBar />
      <KeyboardShortcuts />
    </div>
  );
}
