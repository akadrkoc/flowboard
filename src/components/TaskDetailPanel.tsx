"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Trash2,
  X,
  Calendar,
  Flag,
  CircleDot,
} from "lucide-react";
import SubtaskList from "@/components/task/SubtaskList";
import ActivityFeed from "@/components/task/ActivityFeed";
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
  const rawActivity = useBoardStore((s) => s.activityFeedByCard[taskId]);
  const activityItems = useMemo(() => rawActivity ?? [], [rawActivity]);
  const rawSubtasks = useBoardStore((s) => s.subtasksByCard[taskId]);
  const subtasks = useMemo(() => rawSubtasks ?? [], [rawSubtasks]);
  const loadActivityFeed = useBoardStore((s) => s.loadActivityFeed);
  const loadSubtasks = useBoardStore((s) => s.loadSubtasks);
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
  const [assigneeId, setAssigneeId] = useState("");
  const [feedLoading, setFeedLoading] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
    "idle"
  );

  useEffect(() => {
    if (columns.length === 0) return;
    if (!card) {
      router.replace(`/board/${boardId}`);
    }
  }, [columns.length, card, boardId, router]);

  useEffect(() => {
    if (!card) return;
    setTitle(card.title);
    setDescription(card.description || "");
    setLabels(card.labels);
    setPriority(card.priority);
    setStoryPoints(card.storyPoints);
    setDueDate(card.dueDate || "");
    setConfirmDelete(false);
    setNewLabelDraft("");
    setAssigneeId(
      card.assigneeId
        ? card.assigneeId
        : isUnassigned(card.assigneeInitials)
          ? "unassigned"
          : ""
    );
    setSaveState("idle");
    // Sync form only when switching tasks, not on every card field update.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- card?.id is the task identity
  }, [taskId, card?.id]);

  useEffect(() => {
    if (members.length === 0) loadMembers();
  }, [members.length, loadMembers]);

  useEffect(() => {
    if (taskId && !taskId.startsWith("temp-")) {
      setFeedLoading(true);
      Promise.all([loadActivityFeed(taskId), loadSubtasks(taskId)]).finally(
        () => setFeedLoading(false)
      );
    }
  }, [taskId, loadActivityFeed, loadSubtasks]);

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
    if (assigneeId === "unassigned") {
      return {
        assigneeId: null,
        assigneeInitials: "",
        assigneeColor: UNASSIGNED_COLOR,
      };
    }
    if (assigneeId && selectedOption && !selectedOption.unassigned) {
      return {
        assigneeId,
        assigneeInitials: selectedOption.initials,
        assigneeColor: selectedOption.color,
      };
    }
    return {};
  };

  const handleSave = async () => {
    if (!title.trim() || saveState === "saving") return;
    setSaveState("saving");
    try {
      await updateCard(card.id, {
        title: title.trim(),
        description: description.trim(),
        labels: labels.length ? labels : ["Frontend"],
        priority,
        storyPoints,
        dueDate,
        ...buildAssigneePatch(),
      });
      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 2000);
    } catch {
      setSaveState("idle");
    }
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteCard(card.id);
    closeTask();
  };

  const handleStatusChange = (columnId: string) => {
    if (columnId === currentColumn?.id) return;
    const targetCol = columns.find((c) => c.id === columnId);
    if (!targetCol) return;
    moveCard(card.id, columnId, targetCol.cards.length);
    setTimeout(() => loadActivityFeed(card.id), 400);
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
                if (id === "unassigned") {
                  updateCard(card.id, {
                    assigneeId: null,
                    assigneeInitials: "",
                    assigneeColor: UNASSIGNED_COLOR,
                  });
                } else {
                  const opt = assigneeOptions.find((o) => o.id === id);
                  updateCard(card.id, {
                    assigneeId: id,
                    ...(opt && !opt.unassigned
                      ? {
                          assigneeInitials: opt.initials,
                          assigneeColor: opt.color,
                        }
                      : {}),
                  });
                }
                setTimeout(() => loadActivityFeed(card.id), 400);
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

          <SubtaskList cardId={card.id} subtasks={subtasks} />

          <ActivityFeed
            cardId={card.id}
            items={activityItems}
            loading={feedLoading}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 p-4 border-t border-[#ead7c3] dark:border-white/[0.06] flex-shrink-0">
        <button
          onClick={handleSave}
          disabled={!title.trim() || saveState === "saving"}
          className="flex-1 py-2 rounded-md bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-[13px] font-medium text-white transition-colors"
        >
          {saveState === "saving"
            ? "Saving..."
            : saveState === "saved"
              ? "Saved!"
              : "Save"}
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
