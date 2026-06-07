"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Trash2,
  Send,
  MessageSquare,
  X,
  Calendar,
  Flag,
  CircleDot,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useBoardStore } from "@/store/boardStore";
import type { Card as CardType, Priority } from "@/types/board";
import { UNASSIGNED_COLOR, isUnassigned } from "@/lib/assignee";
import { useBoardNavigation } from "@/hooks/useBoardNavigation";
import { useAvailableLabels } from "@/components/pickers/useAvailableLabels";
import { useAssigneeOptions } from "@/components/pickers/useAssigneeOptions";
import { LabelPicker } from "@/components/pickers/LabelPicker";
import { PriorityPicker } from "@/components/pickers/PriorityPicker";
import { StoryPointsPicker } from "@/components/pickers/StoryPointsPicker";
import { AssigneePickerInline } from "@/components/pickers/AssigneePickerInline";
import type { AssigneeOption } from "@/components/pickers/types";
import { getColumnStatusStyle } from "@/lib/columnColors";

interface TaskDetailPanelProps {
  taskId: string;
  boardId: string;
}

export default function TaskDetailPanel({
  taskId,
  boardId,
}: TaskDetailPanelProps) {
  const router = useRouter();
  const { closeTask } = useBoardNavigation();
  const columns = useBoardStore((s) => s.columns);
  const updateCard = useBoardStore((s) => s.updateCard);
  const deleteCard = useBoardStore((s) => s.deleteCard);
  const moveCard = useBoardStore((s) => s.moveCard);
  const rawComments = useBoardStore((s) => s.commentsByCard[taskId]);
  const comments = useMemo(() => rawComments ?? [], [rawComments]);
  const loadComments = useBoardStore((s) => s.loadComments);
  const addComment = useBoardStore((s) => s.addComment);
  const members = useBoardStore((s) => s.members);
  const loadMembers = useBoardStore((s) => s.loadMembers);
  const { data: session } = useSession();

  const card = useMemo(() => {
    for (const col of columns) {
      const found = col.cards.find((c) => c.id === taskId);
      if (found) return found;
    }
    return null;
  }, [columns, taskId]);

  const currentColumn = useMemo(
    () => columns.find((col) => col.cards.some((c) => c.id === taskId)),
    [columns, taskId]
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [labels, setLabels] = useState<string[]>([]);
  const [newLabelDraft, setNewLabelDraft] = useState("");
  const [priority, setPriority] = useState<Priority>("med");
  const [storyPoints, setStoryPoints] = useState(1);
  const [dueDate, setDueDate] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);

  useEffect(() => {
    if (!card) {
      router.replace(`/board/${boardId}`);
      return;
    }
    setTitle(card.title);
    setDescription(card.description || "");
    setLabels(card.labels);
    setPriority(card.priority);
    setStoryPoints(card.storyPoints);
    setDueDate(card.dueDate || "");
    setConfirmDelete(false);
    setNewLabelDraft("");
    setAssigneeId(isUnassigned(card.assigneeInitials) ? "unassigned" : "");
  }, [card, boardId, router]);

  useEffect(() => {
    if (members.length === 0) loadMembers();
  }, [members.length, loadMembers]);

  useEffect(() => {
    if (taskId && !taskId.startsWith("temp-")) {
      setCommentsLoading(true);
      loadComments(taskId).finally(() => setCommentsLoading(false));
    }
  }, [taskId, loadComments]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeTask();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [closeTask]);

  const availableLabels = useAvailableLabels(columns, labels);
  const assigneeOptions = useAssigneeOptions(members, session);

  const selectedOption = useMemo<AssigneeOption | null>(() => {
    if (!card) return null;
    if (assigneeId === "unassigned") {
      return assigneeOptions.find((o) => o.id === "unassigned") ?? null;
    }
    if (assigneeId) {
      return assigneeOptions.find((o) => o.id === assigneeId) ?? null;
    }
    if (isUnassigned(card.assigneeInitials)) {
      return assigneeOptions.find((o) => o.id === "unassigned") ?? null;
    }
    const match = assigneeOptions.find(
      (o) => !o.unassigned && o.initials === card.assigneeInitials
    );
    if (match) return match;
    return {
      id: "__current",
      name: card.assigneeInitials,
      initials: card.assigneeInitials,
      color: card.assigneeColor,
    };
  }, [assigneeId, assigneeOptions, card]);

  if (!card) return null;

  const buildAssigneePatch = (): Partial<CardType> => {
    const patch: Partial<CardType> = {};
    if (assigneeId === "unassigned") {
      patch.assigneeInitials = "";
      patch.assigneeColor = UNASSIGNED_COLOR;
    } else if (assigneeId && selectedOption && !selectedOption.unassigned) {
      patch.assigneeInitials = selectedOption.initials;
      patch.assigneeColor = selectedOption.color;
    }
    return patch;
  };

  const handleSave = () => {
    if (!title.trim()) return;
    updateCard(card.id, {
      title: title.trim(),
      description: description.trim(),
      labels: labels.length ? labels : ["Frontend"],
      priority,
      storyPoints,
      dueDate,
      ...buildAssigneePatch(),
    });
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteCard(card.id);
    closeTask();
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    addComment(card.id, commentText.trim());
    setCommentText("");
  };

  const handleStatusChange = (columnId: string) => {
    if (columnId === currentColumn?.id) return;
    const targetCol = columns.find((c) => c.id === columnId);
    if (!targetCol) return;
    moveCard(card.id, columnId, targetCol.cards.length);
  };

  const statusStyle = getColumnStatusStyle(
    columns.findIndex((c) => c.id === currentColumn?.id)
  );

  return (
    <aside className="w-full sm:w-[400px] lg:w-[420px] flex-shrink-0 border-l border-[#ead7c3] dark:border-white/[0.06] bg-[#fbf6ef] dark:bg-[#1a1a24] flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#ead7c3] dark:border-white/[0.06] flex-shrink-0">
        <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
          Task
        </span>
        <button
          onClick={closeTask}
          aria-label="Close task panel"
          className="p-1.5 rounded-md hover:bg-[#dce0d9] dark:hover:bg-white/[0.05] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            className="w-full text-[15px] font-semibold text-gray-900 dark:text-white bg-transparent outline-none placeholder:text-gray-400"
            placeholder="Task title"
          />

          {/* Property bar */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <CircleDot className="w-3 h-3 text-gray-400" />
              <select
                value={currentColumn?.id ?? ""}
                onChange={(e) => handleStatusChange(e.target.value)}
                className={`rounded-md border px-2 py-1 text-[11px] font-medium outline-none focus:ring-1 focus:ring-violet-500/40 ${statusStyle.chip}`}
                aria-label="Status"
              >
                {columns.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <Flag className="w-3 h-3 text-gray-400" />
              <PriorityPicker
                value={priority}
                onChange={(p) => {
                  setPriority(p);
                  updateCard(card.id, { priority: p });
                }}
                size="sm"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-gray-400" />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  updateCard(card.id, { dueDate: e.target.value });
                }}
                className="rounded-md border border-[#ead7c3] dark:border-white/[0.08] bg-[#dce0d9] dark:bg-white/[0.03] px-2 py-1 text-[11px] text-gray-800 dark:text-gray-100 outline-none [color-scheme:dark]"
                aria-label="Due date"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5 block">
              Assignee
            </label>
            <AssigneePickerInline
              options={assigneeOptions}
              selectedOption={selectedOption}
              onSelect={(id) => {
                setAssigneeId(id);
                const patch: Partial<CardType> = {};
                if (id === "unassigned") {
                  patch.assigneeInitials = "";
                  patch.assigneeColor = UNASSIGNED_COLOR;
                } else {
                  const opt = assigneeOptions.find((o) => o.id === id);
                  if (opt && !opt.unassigned) {
                    patch.assigneeInitials = opt.initials;
                    patch.assigneeColor = opt.color;
                  }
                }
                if (Object.keys(patch).length) updateCard(card.id, patch);
              }}
            />
          </div>

          <div>
            <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5 block">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleSave}
              rows={3}
              placeholder="Add a description..."
              className="w-full rounded-md border border-[#ead7c3] dark:border-white/[0.08] bg-[#dce0d9] dark:bg-white/[0.03] px-3 py-2 text-[13px] text-gray-800 dark:text-gray-100 outline-none focus:border-violet-400 dark:focus:border-violet-500 transition-colors resize-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5 block">
              Labels
            </label>
            <LabelPicker
              labels={availableLabels}
              selectedLabels={labels}
              onToggle={(label) => {
                const next = labels.includes(label)
                  ? labels.filter((l) => l !== label)
                  : [...labels, label];
                setLabels(next);
                updateCard(card.id, {
                  labels: next.length ? next : ["Frontend"],
                });
              }}
              newLabelDraft={newLabelDraft}
              onNewLabelDraftChange={setNewLabelDraft}
              onAddCustomLabel={(name) => {
                if (!labels.includes(name)) {
                  const next = [...labels, name];
                  setLabels(next);
                  updateCard(card.id, { labels: next });
                }
                setNewLabelDraft("");
              }}
            />
          </div>

          <div>
            <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5 block">
              Story Points
            </label>
            <StoryPointsPicker
              value={storyPoints}
              onChange={(pts) => {
                setStoryPoints(pts);
                updateCard(card.id, { storyPoints: pts });
              }}
              size="sm"
            />
          </div>

          <div>
            <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <MessageSquare className="w-3 h-3" />
              Activity ({comments.length})
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto mb-2">
              {commentsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div
                    className="w-5 h-5 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin"
                    role="status"
                    aria-label="Loading comments"
                  />
                </div>
              ) : comments.length === 0 ? (
                <p className="text-[11px] text-gray-400 dark:text-gray-500 py-2 text-center">
                  No comments yet
                </p>
              ) : (
                comments.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-start gap-2 p-2 rounded-md bg-[#dce0d9] dark:bg-white/[0.03]"
                  >
                    {c.authorImage ? (
                      <img
                        src={c.authorImage}
                        alt={c.authorName}
                        className="w-5 h-5 rounded-full mt-0.5"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center mt-0.5">
                        <span className="text-[8px] font-bold text-white">
                          {c.authorName?.[0]?.toUpperCase() || "?"}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300">
                          {c.authorName}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-[12px] text-gray-600 dark:text-gray-400 mt-0.5">
                        {c.text}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                placeholder="Write a comment..."
                className="flex-1 rounded-md border border-[#ead7c3] dark:border-white/[0.08] bg-[#dce0d9] dark:bg-white/[0.03] px-3 py-1.5 text-[12px] text-gray-800 dark:text-gray-100 outline-none focus:border-violet-400 dark:focus:border-violet-500 transition-colors"
              />
              <button
                onClick={handleAddComment}
                disabled={!commentText.trim()}
                aria-label="Send comment"
                className="p-1.5 rounded-md bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 p-4 border-t border-[#ead7c3] dark:border-white/[0.06] flex-shrink-0">
        <button
          onClick={handleSave}
          className="flex-1 py-2 rounded-md bg-violet-600 hover:bg-violet-500 text-[13px] font-medium text-white transition-colors"
        >
          Save
        </button>
        <button
          onClick={handleDelete}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${
            confirmDelete
              ? "bg-red-600 hover:bg-red-500 text-white"
              : "text-red-500 hover:bg-red-100/50 dark:hover:bg-red-500/10"
          }`}
        >
          <Trash2 className="w-3.5 h-3.5" />
          {confirmDelete ? "Confirm" : "Delete"}
        </button>
      </div>
    </aside>
  );
}
