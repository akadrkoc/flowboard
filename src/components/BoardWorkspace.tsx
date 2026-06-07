"use client";

import { useEffect, useState, useRef } from "react";
import { useBoardStore } from "@/store/boardStore";
import AppShell from "@/components/shell/AppShell";
import Board from "@/components/Board";
import FilterBar from "@/components/FilterBar";
import StatsBar from "@/components/StatsBar";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface BoardWorkspaceProps {
  boardId: string;
  taskId?: string;
}

export default function BoardWorkspace({ boardId, taskId }: BoardWorkspaceProps) {
  const switchBoard = useBoardStore((s) => s.switchBoard);
  const initSocket = useBoardStore((s) => s.initSocket);
  const loading = useBoardStore((s) => s.loading);
  const columns = useBoardStore((s) => s.columns);
  const activeView = useBoardStore((s) => s.activeView);
  const pushError = useBoardStore((s) => s.pushError);

  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const socketInitialized = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem("flowboard-dark");
    const isDark = saved !== null ? saved === "true" : true;
    document.documentElement.classList.toggle("dark", isDark);
    if (!isDark) useBoardStore.setState({ darkMode: false });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError(null);
      setInitializing(true);
      try {
        const currentId = useBoardStore.getState().boardId;
        if (currentId !== boardId) {
          await switchBoard(boardId);
        }

        if (!socketInitialized.current) {
          initSocket();
          socketInitialized.current = true;
        }

        try {
          localStorage.setItem("flowboard-last-board", boardId);
        } catch {
          // Ignore storage errors.
        }
      } catch (err) {
        if (cancelled) return;
        console.error("Board load error:", err);
        const message = (err as Error).message || "Failed to load board";
        setError(message);
        pushError(message);
      } finally {
        if (!cancelled) setInitializing(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [boardId, switchBoard, initSocket, pushError]);

  if (initializing) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#fbf6ef] dark:bg-[#16161e]">
        <LoadingSpinner label="Loading board..." />
      </div>
    );
  }

  if (error && columns.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#fbf6ef] dark:bg-[#16161e] px-4">
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

  return (
    <AppShell boardId={boardId} taskId={taskId}>
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
    </AppShell>
  );
}
