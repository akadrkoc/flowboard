"use client";

import { Suspense, type ReactNode } from "react";
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
  return (
    <div className="flex flex-col h-screen bg-[#fbf6ef] dark:bg-[#16161e] text-gray-900 dark:text-white overflow-hidden">
      <TopToolbar />

      <div className="flex flex-col flex-1 min-w-0 min-h-0">
        {children}
      </div>

      {taskId && <TaskDetailPanel taskId={taskId} boardId={boardId} />}

      <UndoToast />
      <ErrorToast />
      <BulkActionsBar />
      <Suspense fallback={null}>
        <KeyboardShortcuts />
      </Suspense>
    </div>
  );
}
