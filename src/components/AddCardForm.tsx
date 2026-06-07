"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, X, Calendar } from "lucide-react";
import { useSession } from "next-auth/react";
import { useBoardStore } from "@/store/boardStore";
import type { Priority } from "@/types/board";
import { UNASSIGNED_COLOR } from "@/lib/assignee";
import { useAvailableLabels } from "@/components/pickers/useAvailableLabels";
import { useAssigneeOptions } from "@/components/pickers/useAssigneeOptions";
import { LabelPicker } from "@/components/pickers/LabelPicker";
import { PriorityPicker } from "@/components/pickers/PriorityPicker";
import { StoryPointsPicker } from "@/components/pickers/StoryPointsPicker";
import { AssigneePickerDropdown } from "@/components/pickers/AssigneePickerDropdown";

interface AddCardFormProps {
  columnId: string;
}

export default function AddCardForm({ columnId }: AddCardFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("med");
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [newLabelDraft, setNewLabelDraft] = useState("");
  const [storyPoints, setStoryPoints] = useState(3);
  const [dueDate, setDueDate] = useState("");
  const [assigneeId, setAssigneeId] = useState<string>("");

  const addCard = useBoardStore((s) => s.addCard);
  const members = useBoardStore((s) => s.members);
  const loadMembers = useBoardStore((s) => s.loadMembers);
  const columns = useBoardStore((s) => s.columns);
  const addCardRequest = useBoardStore((s) => s.addCardRequest);
  const clearAddCardRequest = useBoardStore((s) => s.clearAddCardRequest);
  const { data: session } = useSession();

  const availableLabels = useAvailableLabels(columns, selectedLabels);
  const assigneeOptions = useAssigneeOptions(members, session);

  useEffect(() => {
    if (isOpen && members.length === 0) loadMembers();
  }, [isOpen, members.length, loadMembers]);

  useEffect(() => {
    if (
      addCardRequest &&
      addCardRequest.columnId === columnId &&
      !isOpen
    ) {
      setIsOpen(true);
      clearAddCardRequest();
    }
  }, [addCardRequest, columnId, isOpen, clearAddCardRequest]);

  const defaultSelfOption = useMemo(
    () => assigneeOptions.find((o) => !o.unassigned) ?? null,
    [assigneeOptions]
  );
  const selectedOption = assigneeId
    ? assigneeOptions.find((o) => o.id === assigneeId) ?? defaultSelfOption
    : defaultSelfOption;

  const assigneeInitials = selectedOption?.unassigned
    ? ""
    : selectedOption?.initials ?? "?";
  const assigneeColor = selectedOption?.unassigned
    ? UNASSIGNED_COLOR
    : selectedOption?.color ?? "bg-violet-500";

  const toggleLabel = (label: string) => {
    setSelectedLabels((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSelectedLabels([]);
    setNewLabelDraft("");
    setPriority("med");
    setStoryPoints(3);
    setDueDate("");
    setAssigneeId("");
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    addCard(columnId, {
      title: title.trim(),
      description: description.trim(),
      labels: selectedLabels.length ? selectedLabels : ["Frontend"],
      priority,
      dueDate: dueDate || "",
      storyPoints,
      assigneeInitials,
      assigneeColor,
    });
    resetForm();
    setIsOpen(false);
  };

  const handleCancel = () => {
    resetForm();
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-1.5 py-2 text-[12px] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-[#dce0d9] dark:hover:bg-white/[0.03] rounded-lg transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Add card
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-[#ead7c3] dark:border-white/[0.08] bg-[#fbf6ef] dark:bg-[#1e1e2e] p-3 space-y-3">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleSubmit();
          }
          if (e.key === "Escape") handleCancel();
        }}
        placeholder="Card title..."
        className="w-full bg-transparent text-[13px] font-medium text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none"
      />

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)..."
        rows={2}
        className="w-full rounded-md border border-[#ead7c3] dark:border-white/[0.08] bg-[#dce0d9]/50 dark:bg-white/[0.02] px-2.5 py-1.5 text-[12px] text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-violet-400 resize-none"
      />

      <div className="space-y-1.5">
        <LabelPicker
          labels={availableLabels}
          selectedLabels={selectedLabels}
          onToggle={toggleLabel}
          newLabelDraft={newLabelDraft}
          onNewLabelDraftChange={setNewLabelDraft}
          onAddCustomLabel={(name) => {
            if (!selectedLabels.includes(name)) {
              setSelectedLabels((prev) => [...prev, name]);
            }
            setNewLabelDraft("");
          }}
          badgeClassName="px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors"
          inputClassName="flex-1 bg-transparent border-b border-dashed border-[#ead7c3] dark:border-white/[0.08] px-1 py-0.5 text-[10px] text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-violet-400"
        />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <PriorityPicker value={priority} onChange={setPriority} size="sm" />
        <StoryPointsPicker value={storyPoints} onChange={setStoryPoints} size="sm" />
      </div>

      <div className="flex items-center gap-1.5">
        <Calendar className="w-3 h-3 text-gray-400" />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="flex-1 rounded-md border border-[#ead7c3] dark:border-white/[0.08] bg-[#dce0d9]/50 dark:bg-white/[0.02] px-2 py-1 text-[11px] text-gray-800 dark:text-gray-100 outline-none focus:border-violet-400 [color-scheme:dark]"
        />
      </div>

      <AssigneePickerDropdown
        options={assigneeOptions}
        assigneeId={assigneeId}
        onAssigneeIdChange={setAssigneeId}
      />

      <div className="flex items-center gap-2">
        <button
          onClick={handleSubmit}
          disabled={!title.trim()}
          className="flex-1 py-1.5 rounded-md bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-[12px] font-medium text-white transition-colors"
        >
          Add card
        </button>
        <button
          onClick={handleCancel}
          className="p-1.5 rounded-md hover:bg-[#dce0d9] dark:hover:bg-white/[0.05] text-gray-400 transition-colors"
          title="Cancel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
