"use client";

import { useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Card as CardType } from "@/types/board";
import { Calendar, Flame, AlertCircle, Check, UserX } from "lucide-react";
import { useBoardStore } from "@/store/boardStore";
import { useBoardNavigation } from "@/hooks/useBoardNavigation";
import { isUnassigned } from "@/lib/assignee";

function getDueDateStatus(dueDate: string): "overdue" | "today" | "normal" {
  if (!dueDate) return "normal";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + "T00:00:00");
  if (due < today) return "overdue";
  if (due.getTime() === today.getTime()) return "today";
  return "normal";
}

const labelColors: Record<string, string> = {
  Frontend: "bg-violet-500/20 text-violet-600 dark:text-violet-300",
  Backend: "bg-teal-500/20 text-teal-600 dark:text-teal-300",
  Auth: "bg-red-500/20 text-red-600 dark:text-red-300",
  Design: "bg-amber-500/20 text-amber-600 dark:text-amber-300",
  DevOps: "bg-blue-500/20 text-blue-600 dark:text-blue-300",
  Docs: "bg-slate-500/20 text-slate-600 dark:text-slate-300",
};

const priorityBadge: Record<string, string> = {
  high: "bg-red-500/15 text-red-600 dark:text-red-400",
  med: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  low: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
};

interface KanbanCardProps {
  card: CardType;
  isDraggingOverlay?: boolean;
}

const DRAG_CLICK_THRESHOLD = 5;

export default function KanbanCard({ card, isDraggingOverlay }: KanbanCardProps) {
  const didDrag = useRef(false);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const { openTask } = useBoardNavigation();

  const selectMode = useBoardStore((s) => s.selectMode);
  const isSelected = useBoardStore((s) => !!s.selectedCardIds[card.id]);
  const toggleCardSelection = useBoardStore((s) => s.toggleCardSelection);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: { type: "card", card },
    disabled: selectMode,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 150ms ease",
    opacity: isDragging ? 0.4 : 1,
    scale: isDraggingOverlay ? "1.03" : "1",
  };

  const openCard = () => {
    if (isDragging || didDrag.current || isDraggingOverlay) return;
    if (selectMode) {
      toggleCardSelection(card.id);
      return;
    }
    openTask(card.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isDragging || isDraggingOverlay) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openCard();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      role="button"
      tabIndex={selectMode || isDraggingOverlay ? -1 : 0}
      aria-label={`Open card: ${card.title}`}
      onPointerDown={(e) => {
        didDrag.current = false;
        pointerStart.current = { x: e.clientX, y: e.clientY };
        listeners?.onPointerDown?.(e);
      }}
      onPointerMove={(e) => {
        if (!pointerStart.current) return;
        const dx = e.clientX - pointerStart.current.x;
        const dy = e.clientY - pointerStart.current.y;
        if (Math.hypot(dx, dy) >= DRAG_CLICK_THRESHOLD) {
          didDrag.current = true;
        }
      }}
      onPointerUp={() => {
        pointerStart.current = null;
      }}
      onPointerCancel={() => {
        pointerStart.current = null;
      }}
      onClick={openCard}
      onKeyDown={handleKeyDown}
      className={`
        group relative rounded-lg border border-[#ead7c3] dark:border-white/[0.06] bg-[#fbf6ef] dark:bg-[#1e1e2e] p-2.5
        shadow-sm hover:shadow-md hover:border-[#d4c4ae] dark:hover:border-white/[0.12]
        transition-all duration-150 cursor-grab active:cursor-grabbing
        ${isDraggingOverlay ? "shadow-xl shadow-black/20 dark:shadow-black/30 ring-1 ring-[#ead7c3] dark:ring-white/10" : ""}
        ${isDragging ? "opacity-40" : ""}
        ${isSelected ? "ring-2 ring-violet-500 dark:ring-violet-400" : ""}
      `}
    >
      {selectMode && (
        <div
          className={`absolute top-2 right-2 w-5 h-5 rounded-md flex items-center justify-center border transition-colors z-10 ${
            isSelected
              ? "bg-violet-600 border-violet-600"
              : "bg-[#fbf6ef] dark:bg-[#1e1e2e] border-[#d4c4ae] dark:border-white/20"
          }`}
          aria-hidden
        >
          {isSelected && <Check className="w-3 h-3 text-white" />}
        </div>
      )}

      {/* Top row: priority + assignee */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase ${
            priorityBadge[card.priority]
          }`}
        >
          {card.priority}
        </span>
        {!selectMode &&
          (isUnassigned(card.assigneeInitials) ? (
            <div
              className="w-5 h-5 rounded-full bg-[#dce0d9] dark:bg-white/[0.06] flex items-center justify-center border border-dashed border-gray-400/60 dark:border-white/20 flex-shrink-0"
              title="Unassigned"
            >
              <UserX className="w-2.5 h-2.5 text-gray-400" />
            </div>
          ) : (
            <div
              className={`w-5 h-5 rounded-full ${card.assigneeColor} flex items-center justify-center flex-shrink-0`}
              title={card.assigneeInitials}
            >
              <span className="text-[8px] font-bold text-white">
                {card.assigneeInitials}
              </span>
            </div>
          ))}
      </div>

      <p className="text-[13px] font-medium text-gray-800 dark:text-gray-100 leading-snug mb-1.5 pr-1">
        {card.title}
      </p>

      {card.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {card.labels.slice(0, 3).map((label) => (
            <span
              key={label}
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                labelColors[label] || "bg-gray-500/20 text-gray-600 dark:text-gray-300"
              }`}
            >
              {label}
            </span>
          ))}
          {card.labels.length > 3 && (
            <span className="text-[10px] text-gray-400">+{card.labels.length - 3}</span>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {card.dueDate && (() => {
          const status = getDueDateStatus(card.dueDate);
          return (
            <span
              className={`flex items-center gap-1 text-[10px] ${
                status === "overdue"
                  ? "text-red-500 dark:text-red-400 font-medium"
                  : status === "today"
                    ? "text-amber-500 dark:text-amber-400 font-medium"
                    : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {status === "overdue" ? (
                <AlertCircle className="w-3 h-3" />
              ) : (
                <Calendar className="w-3 h-3" />
              )}
              {card.dueDate}
            </span>
          );
        })()}
        <span className="flex items-center gap-0.5 text-[10px] text-gray-500 dark:text-gray-400 bg-[#dce0d9] dark:bg-white/[0.05] px-1.5 py-0.5 rounded">
          <Flame className="w-2.5 h-2.5" />
          {card.storyPoints}
        </span>
      </div>
    </div>
  );
}
