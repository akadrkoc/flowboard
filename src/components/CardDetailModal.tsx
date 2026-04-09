"use client";

import { useState, useEffect } from "react";
import { Trash2, Send, MessageSquare } from "lucide-react";
import { useBoardStore } from "@/store/boardStore";
import type { Card as CardType, Priority } from "@/types/board";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const LABEL_OPTIONS = ["Frontend", "Backend", "Design", "Auth", "DevOps", "Docs"];

interface CardDetailModalProps {
  card: CardType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CardDetailModal({ card, open, onOpenChange }: CardDetailModalProps) {
  const updateCard = useBoardStore((s) => s.updateCard);
  const deleteCard = useBoardStore((s) => s.deleteCard);
  const comments = useBoardStore((s) => s.comments);
  const loadComments = useBoardStore((s) => s.loadComments);
  const addComment = useBoardStore((s) => s.addComment);

  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || "");
  const [labels, setLabels] = useState<string[]>(card.labels);
  const [priority, setPriority] = useState<Priority>(card.priority);
  const [storyPoints, setStoryPoints] = useState(card.storyPoints);
  const [dueDate, setDueDate] = useState(card.dueDate || "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [commentText, setCommentText] = useState("");

  // Sync state when card prop changes
  useEffect(() => {
    setTitle(card.title);
    setDescription(card.description || "");
    setLabels(card.labels);
    setPriority(card.priority);
    setStoryPoints(card.storyPoints);
    setDueDate(card.dueDate || "");
    setConfirmDelete(false);
  }, [card]);

  // Load comments when modal opens
  useEffect(() => {
    if (open && card.id && !card.id.startsWith("temp-")) {
      loadComments(card.id);
    }
  }, [open, card.id, loadComments]);

  const toggleLabel = (label: string) => {
    setLabels((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
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
    });
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteCard(card.id);
    onOpenChange(false);
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    addComment(card.id, commentText.trim());
    setCommentText("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] sm:max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Card</DialogTitle>
          <DialogDescription>Update card details or delete it.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              className="w-full rounded-md border border-[#ead7c3] dark:border-white/[0.08] bg-[#dce0d9] dark:bg-white/[0.03] px-3 py-2 text-[13px] text-gray-800 dark:text-gray-100 outline-none focus:border-violet-400 dark:focus:border-violet-500 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Add a description..."
              className="w-full rounded-md border border-[#ead7c3] dark:border-white/[0.08] bg-[#dce0d9] dark:bg-white/[0.03] px-3 py-2 text-[13px] text-gray-800 dark:text-gray-100 outline-none focus:border-violet-400 dark:focus:border-violet-500 transition-colors resize-none"
            />
          </div>

          {/* Labels */}
          <div>
            <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">
              Labels
            </label>
            <div className="flex flex-wrap gap-1.5">
              {LABEL_OPTIONS.map((label) => (
                <button
                  key={label}
                  onClick={() => toggleLabel(label)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                    labels.includes(label)
                      ? "bg-violet-500/30 text-violet-600 dark:text-violet-300 ring-1 ring-violet-500/30"
                      : "bg-[#dce0d9] dark:bg-white/[0.05] text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority + Story Points */}
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            <div>
              <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">
                Priority
              </label>
              <div className="flex items-center gap-1.5">
                {(["low", "med", "high"] as Priority[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`w-7 h-7 rounded-full border-2 transition-colors flex items-center justify-center ${
                      priority === p
                        ? p === "high"
                          ? "border-red-500 bg-red-500/20"
                          : p === "med"
                          ? "border-amber-500 bg-amber-500/20"
                          : "border-emerald-500 bg-emerald-500/20"
                        : "border-[#ead7c3] dark:border-gray-600 hover:border-gray-400"
                    }`}
                    title={p}
                  >
                    {priority === p && (
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${
                          p === "high"
                            ? "bg-red-500"
                            : p === "med"
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">
                Points
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 5, 8].map((pt) => (
                  <button
                    key={pt}
                    onClick={() => setStoryPoints(pt)}
                    className={`w-7 h-7 rounded text-[11px] font-medium transition-colors ${
                      storyPoints === pt
                        ? "bg-[#ead7c3] dark:bg-white/10 text-gray-900 dark:text-white"
                        : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-[#dce0d9] dark:hover:bg-white/[0.05]"
                    }`}
                  >
                    {pt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-md border border-[#ead7c3] dark:border-white/[0.08] bg-[#dce0d9] dark:bg-white/[0.03] px-3 py-2 text-[13px] text-gray-800 dark:text-gray-100 outline-none focus:border-violet-400 dark:focus:border-violet-500 transition-colors [color-scheme:dark]"
            />
          </div>

          {/* Comments */}
          <div>
            <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <MessageSquare className="w-3 h-3" />
              Comments ({comments.length})
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto mb-2">
              {comments.map((c) => (
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
              ))}
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
                className="p-1.5 rounded-md bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
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
      </DialogContent>
    </Dialog>
  );
}
