"use client";

import { useState, useEffect, useMemo } from "react";
import { Trash2, Send, MessageSquare, UserX } from "lucide-react";
import { useSession } from "next-auth/react";
import { useBoardStore } from "@/store/boardStore";
import type { Card as CardType, Priority } from "@/types/board";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  initialsOf,
  colorForId,
  UNASSIGNED_COLOR,
  isUnassigned,
} from "@/lib/assignee";

// Board'da varsayilan olarak onerilen label'lar. Custom label'lar AddCardForm
// veya bu modalda kullanicinin tipinden da gelir; her iki yerde ayni kurallar.
const CANONICAL_LABELS = ["Frontend", "Backend", "Design", "Auth", "DevOps", "Docs"];

interface CardDetailModalProps {
  card: CardType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CardDetailModal({ card, open, onOpenChange }: CardDetailModalProps) {
  const updateCard = useBoardStore((s) => s.updateCard);
  const deleteCard = useBoardStore((s) => s.deleteCard);
  // Zustand v5 useSyncExternalStore kullandigi icin selector'dan her cagride
  // farkli referansli yeni bir array dondurmek (ornek: `?? []`) sonsuz
  // re-render tetikler. Ham degeri alip tuketim noktasinda useMemo ile
  // stabil bir fallback uretiyoruz.
  const rawComments = useBoardStore((s) => s.commentsByCard[card.id]);
  const comments = useMemo(() => rawComments ?? [], [rawComments]);
  const loadComments = useBoardStore((s) => s.loadComments);
  const addComment = useBoardStore((s) => s.addComment);
  const columns = useBoardStore((s) => s.columns);
  const members = useBoardStore((s) => s.members);
  const loadMembers = useBoardStore((s) => s.loadMembers);
  const { data: session } = useSession();

  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || "");
  const [labels, setLabels] = useState<string[]>(card.labels);
  const [newLabelDraft, setNewLabelDraft] = useState("");
  const [priority, setPriority] = useState<Priority>(card.priority);
  const [storyPoints, setStoryPoints] = useState(card.storyPoints);
  const [dueDate, setDueDate] = useState(card.dueDate || "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [commentText, setCommentText] = useState("");

  // Assignee yeniden atama: secilen uyeyi id ile tutuyoruz; "unassigned"
  // ozel degerdir ve kartin assignee'sinin kaldirilmasi anlamina gelir.
  // "" ilk acilisa karsilik gelir: su anki karttaki initials ne ise onu koru.
  const [assigneeId, setAssigneeId] = useState<string>("");

  // Sync state when card prop changes
  useEffect(() => {
    setTitle(card.title);
    setDescription(card.description || "");
    setLabels(card.labels);
    setPriority(card.priority);
    setStoryPoints(card.storyPoints);
    setDueDate(card.dueDate || "");
    setConfirmDelete(false);
    setNewLabelDraft("");
    // Kartin mevcut assignee durumunu picker'a yansit.
    if (isUnassigned(card.assigneeInitials)) {
      setAssigneeId("unassigned");
    } else {
      setAssigneeId(""); // "mevcut" — henuz kullanici degistirmedi
    }
  }, [card]);

  // Modal ilk acildiginda member listesi bos olabilir.
  useEffect(() => {
    if (open && members.length === 0) loadMembers();
  }, [open, members.length, loadMembers]);

  // Board genelinde kullanimda olan tum label'lari topla.
  const availableLabels = useMemo(() => {
    const set = new Set<string>(CANONICAL_LABELS);
    for (const col of columns) {
      for (const c of col.cards) {
        for (const l of c.labels || []) {
          if (l) set.add(l);
        }
      }
    }
    for (const l of labels) set.add(l);
    return Array.from(set);
  }, [columns, labels]);

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

  const currentUser = session?.user;
  const currentUserEmail = currentUser?.email ?? null;
  const currentUserName = currentUser?.name ?? null;

  // Girise giren kullaniciyi (eger board uyesiyse) tespit et.
  const currentMember = useMemo(() => {
    if (!currentUserEmail) return null;
    return (
      members.find(
        (m) => m.email?.toLowerCase() === currentUserEmail.toLowerCase()
      ) ?? null
    );
  }, [members, currentUserEmail]);

  // Assignee secenek listesi: Unassigned + current user + diger uyeler.
  type AssigneeOption = {
    id: string;
    name: string;
    initials: string;
    color: string;
    image?: string;
    unassigned?: boolean;
  };

  const assigneeOptions = useMemo<AssigneeOption[]>(() => {
    const list: AssigneeOption[] = [
      {
        id: "unassigned",
        name: "Unassigned",
        initials: "",
        color: UNASSIGNED_COLOR,
        unassigned: true,
      },
    ];

    if (currentMember) {
      list.push({
        id: currentMember.id,
        name: `${currentMember.name} (you)`,
        initials: initialsOf(currentMember.name),
        color: colorForId(currentMember.id),
        image: currentMember.image,
      });
    } else if (currentUserName || currentUserEmail) {
      list.push({
        id: "self",
        name: currentUserName ? `${currentUserName} (you)` : "You",
        initials: initialsOf(currentUserName),
        color: "bg-violet-500",
        image: currentUser?.image ?? undefined,
      });
    }

    for (const m of members) {
      if (currentMember && m.id === currentMember.id) continue;
      list.push({
        id: m.id,
        name: m.name,
        initials: initialsOf(m.name),
        color: colorForId(m.id),
        image: m.image,
      });
    }
    return list;
  }, [
    members,
    currentMember,
    currentUser?.image,
    currentUserName,
    currentUserEmail,
  ]);

  // Secili option: kullanici picker'da degistirdiyse o id, aksi halde kartin
  // mevcut assignee'sini gosteren "sanki" option (initials + color ile).
  const selectedOption = useMemo<AssigneeOption | null>(() => {
    if (assigneeId === "unassigned") {
      return assigneeOptions.find((o) => o.id === "unassigned") ?? null;
    }
    if (assigneeId) {
      return assigneeOptions.find((o) => o.id === assigneeId) ?? null;
    }
    // assigneeId === "" ilk durum: kartta hangi initials varsa onu match et,
    // member listesinde yoksa kartin initial+color'ini tasiyan virtual entry.
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
  }, [assigneeId, assigneeOptions, card.assigneeInitials, card.assigneeColor]);

  const handleSave = () => {
    if (!title.trim()) return;

    // Assignee alanlari sadece picker'da degisiklik yapildiginda gonderilsin.
    // (assigneeId === "" durumunda kartin mevcut degerine dokunmak istemiyoruz.)
    const assigneePatch: Partial<CardType> = {};
    if (assigneeId === "unassigned") {
      assigneePatch.assigneeInitials = "";
      assigneePatch.assigneeColor = UNASSIGNED_COLOR;
    } else if (assigneeId && selectedOption && !selectedOption.unassigned) {
      assigneePatch.assigneeInitials = selectedOption.initials;
      assigneePatch.assigneeColor = selectedOption.color;
    }

    updateCard(card.id, {
      title: title.trim(),
      description: description.trim(),
      labels: labels.length ? labels : ["Frontend"],
      priority,
      storyPoints,
      dueDate,
      ...assigneePatch,
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
              {availableLabels.map((label) => (
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
            <div className="mt-2">
              <input
                value={newLabelDraft}
                onChange={(e) => setNewLabelDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const name = newLabelDraft.trim();
                    if (!name) return;
                    if (!labels.includes(name)) {
                      setLabels((prev) => [...prev, name]);
                    }
                    setNewLabelDraft("");
                  }
                }}
                placeholder="+ Add custom label (Enter)"
                className="w-full bg-transparent border-b border-dashed border-[#ead7c3] dark:border-white/[0.08] px-1 py-1 text-[11px] text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-violet-400"
              />
            </div>
          </div>

          {/* Assignee */}
          <div>
            <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">
              Assignee
            </label>
            <div className="flex items-center flex-wrap gap-1.5">
              {assigneeOptions.map((opt) => {
                const isSelected = selectedOption?.id === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAssigneeId(opt.id)}
                    title={opt.name}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-full transition-colors ${
                      isSelected
                        ? "bg-violet-500/15 ring-1 ring-violet-500/60"
                        : "hover:bg-[#dce0d9] dark:hover:bg-white/[0.05]"
                    }`}
                  >
                    {opt.unassigned ? (
                      <span className="w-5 h-5 rounded-full bg-[#dce0d9] dark:bg-white/[0.08] flex items-center justify-center">
                        <UserX className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                      </span>
                    ) : opt.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={opt.image}
                        alt={opt.name}
                        referrerPolicy="no-referrer"
                        className="w-5 h-5 rounded-full"
                      />
                    ) : (
                      <span
                        className={`w-5 h-5 rounded-full ${opt.color} flex items-center justify-center`}
                      >
                        <span className="text-[9px] font-bold text-white">
                          {opt.initials || "?"}
                        </span>
                      </span>
                    )}
                    <span
                      className={`text-[11px] font-medium truncate max-w-[140px] ${
                        isSelected
                          ? "text-violet-600 dark:text-violet-300"
                          : "text-gray-600 dark:text-gray-300"
                      }`}
                    >
                      {opt.name}
                    </span>
                  </button>
                );
              })}
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
