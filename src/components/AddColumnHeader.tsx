"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useBoardStore } from "@/store/boardStore";
import { useIsBoardOwner } from "@/hooks/useIsBoardOwner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function AddColumnHeader() {
  const addColumn = useBoardStore((s) => s.addColumn);
  const isOwner = useIsBoardOwner();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    addColumn(trimmed);
    setName("");
    setOpen(false);
  };

  if (!isOwner) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full md:w-auto flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-dashed border-border text-muted-foreground hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-300 hover:bg-violet-500/5 transition-colors text-sm font-medium"
      >
        <Plus className="w-4 h-4" />
        <span>Add column</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New column</DialogTitle>
            <DialogDescription>Give your column a name.</DialogDescription>
          </DialogHeader>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Column name..."
            className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-violet-500/40 transition-colors"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleAdd}
              disabled={!name.trim()}
              className="flex-1 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium text-white transition-colors"
            >
              Add column
            </button>
            <button
              onClick={() => {
                setName("");
                setOpen(false);
              }}
              className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
