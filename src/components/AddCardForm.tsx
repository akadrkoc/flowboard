"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, X, Calendar, UserX, ChevronDown, Check } from "lucide-react";
import { useSession } from "next-auth/react";
import { useBoardStore } from "@/store/boardStore";
import type { Priority } from "@/types/board";
import { initialsOf, colorForId, UNASSIGNED_COLOR } from "@/lib/assignee";

// Board ilk acildiginda onerilecek varsayilan label'lar. Kartlar bu listenin
// disinda custom label'lar da icerebilir; AddCardForm bunlarin hepsini tek
// bir birleşik listede gosterir.
const CANONICAL_LABELS = ["Frontend", "Backend", "Design", "Auth", "DevOps", "Docs"];

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
  const [assigneeId, setAssigneeId] = useState<string>(""); // "" = current user
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const assigneePickerRef = useRef<HTMLDivElement>(null);

  const addCard = useBoardStore((s) => s.addCard);
  const members = useBoardStore((s) => s.members);
  const loadMembers = useBoardStore((s) => s.loadMembers);
  const columns = useBoardStore((s) => s.columns);
  const addCardRequest = useBoardStore((s) => s.addCardRequest);
  const clearAddCardRequest = useBoardStore((s) => s.clearAddCardRequest);
  const { data: session } = useSession();

  // Mevcut tum label'lar: kanonik + kartlarda kullanilan custom'lar +
  // secilmis olanlar (yeni olusturulup henuz kartta olmayanlari da goster).
  const availableLabels = useMemo(() => {
    const set = new Set<string>(CANONICAL_LABELS);
    for (const col of columns) {
      for (const card of col.cards) {
        for (const l of card.labels || []) {
          if (l) set.add(l);
        }
      }
    }
    for (const l of selectedLabels) set.add(l);
    return Array.from(set);
  }, [columns, selectedLabels]);

  // Form ilk acildiginda member listesi bos olabilir; avatar seciciyi
  // doldurabilmek icin cagiralim. Zaten yuklenmisse hizli bicimde set eder.
  useEffect(() => {
    if (isOpen && members.length === 0) loadMembers();
  }, [isOpen, members.length, loadMembers]);

  // Form kapandiginda assignee dropdown'u da kapansin.
  useEffect(() => {
    if (!isOpen) setAssigneeOpen(false);
  }, [isOpen]);

  // Assignee dropdown'u disarisina tiklandiginda kapansin.
  useEffect(() => {
    if (!assigneeOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (
        assigneePickerRef.current &&
        !assigneePickerRef.current.contains(e.target as Node)
      ) {
        setAssigneeOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [assigneeOpen]);

  // Klavye kisayollarindan gelen "add card" istegi bu kolona ait ise ac.
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

  const currentUser = session?.user;
  const currentUserName = currentUser?.name ?? null;
  const currentUserEmail = currentUser?.email ?? null;

  // Uye listesinde current user'i tespit etmek icin email/id eslestirmesi
  // yap. Yoksa ayri bir "(you)" placeholder'i goster.
  const currentMember = useMemo(() => {
    if (!currentUserEmail) return null;
    return (
      members.find((m) => m.email?.toLowerCase() === currentUserEmail.toLowerCase()) ??
      null
    );
  }, [members, currentUserEmail]);

  // Assignee secenek listesi: Unassigned + current user + diger uyeler.
  type AssigneeOption = {
    id: string; // "" = current user fallback, "unassigned" = atama yok
    name: string;
    email?: string;
    image?: string;
    initials: string;
    color: string;
    unassigned?: boolean;
  };

  const assigneeOptions: AssigneeOption[] = useMemo(() => {
    const list: AssigneeOption[] = [
      {
        id: "unassigned",
        name: "Unassigned",
        initials: "",
        color: UNASSIGNED_COLOR,
        unassigned: true,
      },
    ];
    // Current user avatari. currentMember varsa onu kullaniriz, yoksa
    // session'daki bilgilerden virtual bir entry ekleriz.
    if (currentMember) {
      list.push({
        id: currentMember.id,
        name: `${currentMember.name} (you)`,
        email: currentMember.email,
        image: currentMember.image,
        initials: initialsOf(currentMember.name),
        color: colorForId(currentMember.id),
      });
    } else {
      list.push({
        id: "",
        name: currentUserName ? `${currentUserName} (you)` : "You",
        email: currentUserEmail ?? undefined,
        image: currentUser?.image ?? undefined,
        initials: initialsOf(currentUserName),
        color: "bg-violet-500",
      });
    }
    for (const m of members) {
      if (currentMember && m.id === currentMember.id) continue;
      list.push({
        id: m.id,
        name: m.name,
        email: m.email,
        image: m.image,
        initials: initialsOf(m.name),
        color: colorForId(m.id),
      });
    }
    return list;
  }, [members, currentMember, currentUser?.image, currentUserEmail, currentUserName]);

  // Varsayilan olarak girise giren kullaniciyi sec. Kullanici picker'dan
  // farkli birini veya Unassigned'i secerse assigneeId set edilir ve onu
  // kullanilir.
  const defaultSelfOption = useMemo(
    () => assigneeOptions.find((o) => !o.unassigned) ?? null,
    [assigneeOptions]
  );
  const selectedOption = assigneeId
    ? assigneeOptions.find((o) => o.id === assigneeId) ?? defaultSelfOption
    : defaultSelfOption;

  // addCard'a gonderilecek nihai degerler. Unassigned secildiyse bos initial
  // ve gri renk kullan.
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
      {/* Title */}
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          // Daha onceden sadece Enter submit ediyordu ama bu, kullanicinin
          // assignee/label gibi diger alanlari secmesini engelliyordu
          // (yanlislikla erken submit). Artik sadece Cmd/Ctrl+Enter ile
          // submit, Escape ile iptal.
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleSubmit();
          }
          if (e.key === "Escape") handleCancel();
        }}
        placeholder="Card title..."
        className="w-full bg-transparent text-[13px] font-medium text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none"
      />

      {/* Description */}
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)..."
        rows={2}
        className="w-full rounded-md border border-[#ead7c3] dark:border-white/[0.08] bg-[#dce0d9]/50 dark:bg-white/[0.02] px-2.5 py-1.5 text-[12px] text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-violet-400 resize-none"
      />

      {/* Labels */}
      <div className="space-y-1.5">
        <div className="flex flex-wrap gap-1">
          {availableLabels.map((label) => (
            <button
              key={label}
              onClick={() => toggleLabel(label)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                selectedLabels.includes(label)
                  ? "bg-violet-500/30 text-violet-600 dark:text-violet-300"
                  : "bg-[#dce0d9] dark:bg-white/[0.05] text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Custom label creator */}
        <div className="flex items-center gap-1">
          <input
            value={newLabelDraft}
            onChange={(e) => setNewLabelDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const name = newLabelDraft.trim();
                if (!name) return;
                // Yeni label'i sec; availableLabels useMemo siradaki render'da
                // bu secili degerle genisler.
                if (!selectedLabels.includes(name)) {
                  setSelectedLabels((prev) => [...prev, name]);
                }
                setNewLabelDraft("");
              }
            }}
            placeholder="+ Add custom label (Enter)"
            className="flex-1 bg-transparent border-b border-dashed border-[#ead7c3] dark:border-white/[0.08] px-1 py-0.5 text-[10px] text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-violet-400"
          />
        </div>
      </div>

      {/* Priority + Points */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          {(["low", "med", "high"] as Priority[]).map((p) => (
            <button
              key={p}
              onClick={() => setPriority(p)}
              title={`Priority: ${p}`}
              className={`w-5 h-5 rounded-full border-2 transition-colors flex items-center justify-center ${
                priority === p
                  ? p === "high"
                    ? "border-red-500 bg-red-500/20"
                    : p === "med"
                    ? "border-amber-500 bg-amber-500/20"
                    : "border-emerald-500 bg-emerald-500/20"
                  : "border-[#ead7c3] dark:border-gray-600 hover:border-gray-400"
              }`}
            >
              {priority === p && (
                <div
                  className={`w-2 h-2 rounded-full ${
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

        <div className="flex items-center gap-1">
          {[1, 2, 3, 5, 8].map((pt) => (
            <button
              key={pt}
              onClick={() => setStoryPoints(pt)}
              title={`${pt} story point(s)`}
              className={`w-6 h-6 rounded text-[10px] font-medium transition-colors ${
                storyPoints === pt
                  ? "bg-[#ead7c3] dark:bg-white/10 text-gray-900 dark:text-white"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {pt}
            </button>
          ))}
        </div>

      </div>

      {/* Due date */}
      <div className="flex items-center gap-1.5">
        <Calendar className="w-3 h-3 text-gray-400" />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="flex-1 rounded-md border border-[#ead7c3] dark:border-white/[0.08] bg-[#dce0d9]/50 dark:bg-white/[0.02] px-2 py-1 text-[11px] text-gray-800 dark:text-gray-100 outline-none focus:border-violet-400 [color-scheme:dark]"
        />
      </div>

      {/* Assignee picker: dropdown */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
          Assign to
        </p>
        <div className="relative" ref={assigneePickerRef}>
          {/* Trigger: secili avatar + isim + chevron */}
          <button
            type="button"
            onClick={() => setAssigneeOpen((v) => !v)}
            className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md border border-[#ead7c3] dark:border-white/[0.08] bg-[#dce0d9]/50 dark:bg-white/[0.02] hover:bg-[#dce0d9] dark:hover:bg-white/[0.05] transition-colors"
            aria-haspopup="listbox"
            aria-expanded={assigneeOpen}
          >
            <span className="flex items-center gap-1.5 min-w-0">
              {selectedOption?.unassigned ? (
                <span className="w-5 h-5 rounded-full bg-[#dce0d9] dark:bg-white/[0.08] flex items-center justify-center border border-dashed border-gray-400/60 dark:border-white/20">
                  <UserX className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                </span>
              ) : selectedOption?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedOption.image}
                  alt={selectedOption.name}
                  referrerPolicy="no-referrer"
                  className="w-5 h-5 rounded-full"
                />
              ) : (
                <span
                  className={`w-5 h-5 rounded-full ${selectedOption?.color ?? "bg-violet-500"} flex items-center justify-center`}
                >
                  <span className="text-[8px] font-bold text-white">
                    {selectedOption?.initials || "?"}
                  </span>
                </span>
              )}
              <span className="text-[11px] font-medium text-gray-700 dark:text-gray-200 truncate">
                {selectedOption?.name ?? "Unassigned"}
              </span>
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-gray-500 dark:text-gray-400 flex-shrink-0 transition-transform ${
                assigneeOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Acik ise options listesi */}
          {assigneeOpen && (
            <div
              role="listbox"
              className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-md border border-[#ead7c3] dark:border-white/[0.08] bg-[#fbf6ef] dark:bg-[#1e1e2e] shadow-lg p-1"
            >
              {assigneeOptions.map((opt) => {
                const isSelected = opt.id === (selectedOption?.id ?? "");
                return (
                  <button
                    key={opt.id || "me"}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      setAssigneeId(opt.id);
                      setAssigneeOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-sm text-left transition-colors ${
                      isSelected
                        ? "bg-violet-500/15 text-violet-600 dark:text-violet-300"
                        : "hover:bg-[#dce0d9] dark:hover:bg-white/[0.05] text-gray-700 dark:text-gray-200"
                    }`}
                  >
                    {opt.unassigned ? (
                      <span className="w-5 h-5 rounded-full bg-[#dce0d9] dark:bg-white/[0.08] flex items-center justify-center border border-dashed border-gray-400/60 dark:border-white/20">
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
                        <span className="text-[8px] font-bold text-white">
                          {opt.initials || "?"}
                        </span>
                      </span>
                    )}
                    <span className="text-[11px] font-medium truncate flex-1">
                      {opt.name}
                    </span>
                    {isSelected && (
                      <Check className="w-3 h-3 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
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
