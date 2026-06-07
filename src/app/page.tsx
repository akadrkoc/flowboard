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
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function Home() {
  const loadBoards = useBoardStore((s) => s.loadBoards);
  const createBoard = useBoardStore((s) => s.createBoard);
  const loadBoard = useBoardStore((s) => s.loadBoard);
  const initSocket = useBoardStore((s) => s.initSocket);
  const loadMembers = useBoardStore((s) => s.loadMembers);
  const loadSprints = useBoardStore((s) => s.loadSprints);
  const pushError = useBoardStore((s) => s.pushError);
  const loading = useBoardStore((s) => s.loading);
  const columns = useBoardStore((s) => s.columns);
  const activeView = useBoardStore((s) => s.activeView);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        const message = (err as Error).message || "Failed to initialize board";
        setError(message);
        pushError(message);
      } finally {
        setInitializing(false);
      }
    }

    init();
  }, [loadBoards, createBoard, loadBoard, initSocket, loadMembers, loadSprints, pushError]);

  if (initializing) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#fbf6ef] dark:bg-[#16161e] text-gray-900 dark:text-white">
        <LoadingSpinner label="Loading board..." />
      </div>
    );
  }

  if (error && columns.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#fbf6ef] dark:bg-[#16161e] text-gray-900 dark:text-white px-4">
        <p className="text-lg text-red-400 mb-4">Error: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-md bg-violet-600 hover:bg-violet-500 text-sm font-medium text-white transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!loading && columns.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#fbf6ef] dark:bg-[#16161e] text-gray-900 dark:text-white">
        <p className="text-lg opacity-60">No board found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#fbf6ef] dark:bg-[#16161e] text-gray-900 dark:text-white">
      <Navbar />
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner label="Loading board..." />
        </div>
      ) : activeView === "analytics" ? (
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
