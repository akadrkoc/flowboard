"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Calendar, Flag, Hash } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import SubtaskList from "@/components/task/SubtaskList";
import ActivityFeed from "@/components/task/ActivityFeed";
import { useSession } from "next-auth/react";
import { useBoardStore } from "@/store/boardStore";
import type { Card as CardType, Priority } from "@/types/board";
import { UNASSIGNED_COLOR, isUnassigned } from "@/lib/assignee";
import { useBoardNavigation } from "@/hooks/useBoardNavigation";
import { useAvailableLabels } from "@/components/pickers/useAvailableLabels";
import { useAssigneeOptions } from "@/components/pickers/useAssigneeOptions";
import { LabelPickerDropdown } from "@/components/pickers/LabelPickerDropdown";
import { PriorityPicker } from "@/components/pickers/PriorityPicker";
import { StoryPointsPicker } from "@/components/pickers/StoryPointsPicker";
import { AssigneePickerDropdown } from "@/components/pickers/AssigneePickerDropdown";
import { StatusPickerDropdown } from "@/components/pickers/StatusPickerDropdown";

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

  const availableLabels = useAvailableLabels(columns, labels);
  const assigneeOptions = useAssigneeOptions(members, session);

  if (!card) return null;

  const buildAssigneePatch = (): Partial<CardType> => {
    if (assigneeId === "unassigned") {
      return {
        assigneeId: null,
        assigneeInitials: "",
        assigneeColor: UNASSIGNED_COLOR,
      };
    }
    if (assigneeId) {
      const opt = assigneeOptions.find((o) => o.id === assigneeId);
      if (opt && !opt.unassigned) {
        return {
          assigneeId,
          assigneeInitials: opt.initials,
          assigneeColor: opt.color,
        };
      }
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

  const fieldClass =
    "w-full rounded-lg border border-[#ead7c3] dark:border-white/[0.08] bg-white dark:bg-[#252530] px-3 py-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-violet-500/40 transition-colors";

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) closeTask();
      }}
    >
      <DialogContent
        animated={false}
        showCloseButton
        className="sm:max-w-2xl lg:max-w-3xl max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col bg-[#fbf6ef] dark:bg-[#1a1a24] border-[#ead7c3] dark:border-white/[0.08] ring-[#ead7c3]/50 antialiased"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#ead7c3] dark:border-white/[0.08] flex-shrink-0">
          <div className="flex items-center gap-2 pr-8">
            <span className="text-sm font-medium text-muted-foreground">
              Task details
            </span>
            {saveState === "saving" && (
              <span className="text-xs text-muted-foreground">Saving...</span>
            )}
            {saveState === "saved" && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400">
                Saved
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="px-6 py-6 space-y-7">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            className="w-full text-xl font-semibold text-foreground bg-transparent outline-none placeholder:text-muted-foreground"
            placeholder="Task title"
          />

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Status
              </label>
              <StatusPickerDropdown
                columns={columns}
                value={currentColumn?.id ?? ""}
                onChange={handleStatusChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Flag className="w-3.5 h-3.5" />
                  Priority
                </label>
                <div className="flex items-center h-[42px] px-1">
                  <PriorityPicker
                    value={priority}
                    onChange={(p) => {
                      setPriority(p);
                      updateCard(card.id, { priority: p });
                    }}
                    size="sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Hash className="w-3.5 h-3.5" />
                  Story points
                </label>
                <div className="flex items-center h-[42px] px-1">
                  <StoryPointsPicker
                    value={storyPoints}
                    onChange={(pts) => {
                      setStoryPoints(pts);
                      updateCard(card.id, { storyPoints: pts });
                    }}
                    size="sm"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                Due date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  updateCard(card.id, { dueDate: e.target.value });
                }}
                className={`${fieldClass} [color-scheme:dark]`}
                aria-label="Due date"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Assignee
              </label>
              <AssigneePickerDropdown
                options={assigneeOptions}
                assigneeId={assigneeId}
                onAssigneeIdChange={(id) => {
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
                label=""
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleSave}
              rows={4}
              placeholder="Add a description..."
              className={`${fieldClass} resize-none`}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Labels
            </label>
            <LabelPickerDropdown
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

          <SubtaskList cardId={card.id} subtasks={subtasks} />

          <ActivityFeed
            cardId={card.id}
            items={activityItems}
            loading={feedLoading}
          />
          </div>
        </div>

        <div className="flex items-center justify-end px-6 py-4 border-t border-[#ead7c3] dark:border-white/[0.08] flex-shrink-0">
          <button
            onClick={handleDelete}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              confirmDelete
                ? "bg-red-600 hover:bg-red-500 text-white"
                : "text-red-500 hover:bg-red-500/10"
            }`}
          >
            <Trash2 className="w-4 h-4" />
            {confirmDelete ? "Confirm delete" : "Delete task"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
