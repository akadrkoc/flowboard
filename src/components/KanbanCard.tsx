"use client";

import { useState, useRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Card as CardType } from "@/types/board";
import { Calendar, Flame, AlertCircle, Check, UserX } from "lucide-react";
import CardDetailModal from "@/components/CardDetailModal";
import { useBoardStore } from "@/store/boardStore";
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

const priorityColors: Record<string, string> = {
  high: "bg-red-500",
  med: "bg-amber-500",
  low: "bg-emerald-500",
};

interface KanbanCardProps {
  card: CardType;
  isDraggingOverlay?: boolean;
}

export default function KanbanCard({ card, isDraggingOverlay }: KanbanCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const didDrag = useRef(false);

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
    // Secim modunda drag-drop'u devre disi birakalim; boylece tikla =>
    // secim net calisir ve yanlislikla kart tasinmaz.
    disabled: selectMode,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 150ms ease",
    opacity: isDragging ? 0.4 : 1,
    scale: isDraggingOverlay ? "1.03" : "1",
  };

  const handlePointerDown = () => {
    didDrag.current = false;
  };

  const handlePointerMove = () => {
    didDrag.current = true;
  };

  const handleClick = () => {
    if (isDragging || didDrag.current || isDraggingOverlay) return;
    if (selectMode) {
      toggleCardSelection(card.id);
      return;
    }
    setModalOpen(true);
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onPointerDown={(e) => {
          handlePointerDown();
          listeners?.onPointerDown?.(e);
        }}
        onPointerMove={handlePointerMove}
        onClick={handleClick}
        className={`
          group relative rounded-lg border border-[#ead7c3] dark:border-white/[0.06] bg-[#fbf6ef] dark:bg-[#1e1e2e] p-3 sm:p-3.5
          shadow-sm hover:shadow-md hover:border-[#d4c4ae] dark:hover:border-white/[0.12]
          transition-all duration-150 cursor-grab active:cursor-grabbing
          ${isDraggingOverlay ? "shadow-xl shadow-black/20 dark:shadow-black/30 ring-1 ring-[#ead7c3] dark:ring-white/10" : ""}
          ${isDragging ? "opacity-40" : ""}
          ${isSelected ? "ring-2 ring-violet-500 dark:ring-violet-400" : ""}
        `}
      >
        {/* Selection checkbox (only in select mode) */}
        {selectMode && (
          <div
            className={`absolute top-2 right-2 w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
              isSelected
                ? "bg-violet-600 border-violet-600"
                : "bg-[#fbf6ef] dark:bg-[#1e1e2e] border-[#d4c4ae] dark:border-white/20"
            }`}
            aria-hidden
          >
            {isSelected && <Check className="w-3 h-3 text-white" />}
          </div>
        )}

        {/* Labels */}
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {card.labels.map((label) => (
            <span
              key={label}
              className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                labelColors[label] || "bg-gray-500/20 text-gray-600 dark:text-gray-300"
              }`}
            >
              {label}
            </span>
          ))}
        </div>

        {/* Title */}
        <p className="text-[13px] font-medium text-gray-800 dark:text-gray-100 leading-snug mb-1">
          {card.title}
        </p>

        {/* Description (truncated) */}
        {card.description && (
          <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug mb-2 truncate">
            {card.description}
          </p>
        )}

        {/* Bottom row */}
        <div className="flex items-center justify-between flex-wrap gap-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Priority dot */}
            <span
              className={`w-2 h-2 rounded-full ${priorityColors[card.priority]}`}
              title={`Priority: ${card.priority}`}
            />

            {/* Due date */}
            {card.dueDate && (() => {
              const status = getDueDateStatus(card.dueDate);
              return (
                <span className={`flex items-center gap-1 text-[11px] ${
                  status === "overdue"
                    ? "text-red-500 dark:text-red-400 font-medium"
                    : status === "today"
                    ? "text-amber-500 dark:text-amber-400 font-medium"
                    : "text-gray-500 dark:text-gray-400"
                }`}>
                  {status === "overdue" ? (
                    <AlertCircle className="w-3 h-3" />
                  ) : (
                    <Calendar className="w-3 h-3" />
                  )}
                  {card.dueDate}
                </span>
              );
            })()}

            {/* Story points */}
            <span className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 bg-[#dce0d9] dark:bg-white/[0.05] px-1.5 py-0.5 rounded">
              <Flame className="w-3 h-3" />
              {card.storyPoints}
            </span>
          </div>

          {/* Assignee avatar */}
          {isUnassigned(card.assigneeInitials) ? (
            <div
              className="w-6 h-6 rounded-full bg-[#dce0d9] dark:bg-white/[0.06] flex items-center justify-center border border-dashed border-gray-400/60 dark:border-white/20"
              title="Unassigned"
            >
              <UserX className="w-3 h-3 text-gray-400" />
            </div>
          ) : (
            <div
              className={`w-6 h-6 rounded-full ${card.assigneeColor} flex items-center justify-center`}
              title={card.assigneeInitials}
            >
              <span className="text-[10px] font-bold text-white">
                {card.assigneeInitials}
              </span>
            </div>
          )}
        </div>
      </div>

      <CardDetailModal
        card={card}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
}
