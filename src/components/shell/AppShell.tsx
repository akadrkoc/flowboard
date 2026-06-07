"use client";

import { useState, useEffect, type ReactNode } from "react";
import Sidebar from "./Sidebar";
import TopToolbar from "./TopToolbar";
import TaskDetailPanel from "@/components/TaskDetailPanel";
import UndoToast from "@/components/UndoToast";
import ErrorToast from "@/components/ErrorToast";
import BulkActionsBar from "@/components/BulkActionsBar";
import KeyboardShortcuts from "@/components/KeyboardShortcuts";

interface AppShellProps {
  boardId: string;
  taskId?: string;
  children: ReactNode;
}

export default function AppShell({ boardId, taskId, children }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("flowboard-sidebar-collapsed");
    if (saved === "true") setSidebarCollapsed(true);
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("flowboard-sidebar-collapsed", String(next));
      return next;
    });
  };

  return (
    <div className="flex h-screen bg-[#fbf6ef] dark:bg-[#16161e] text-gray-900 dark:text-white overflow-hidden">
      <Sidebar
        boardId={boardId}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />

      <div className="flex flex-col flex-1 min-w-0">
        <TopToolbar boardId={boardId} />
        <div className="flex flex-1 min-h-0">
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            {children}
          </div>
          {taskId && <TaskDetailPanel taskId={taskId} boardId={boardId} />}
        </div>
      </div>

      <UndoToast />
      <ErrorToast />
      <BulkActionsBar />
      <KeyboardShortcuts />
    </div>
  );
}
