"use client";

import { useState } from "react";
import { Zap, Check, X } from "lucide-react";
import { useBoardStore } from "@/store/boardStore";
import { useClickOutside } from "@/hooks/useClickOutside";

export default function SprintPanel() {
  const activeSprint = useBoardStore((s) => s.activeSprint);
  const sprints = useBoardStore((s) => s.sprints);
  const createSprint = useBoardStore((s) => s.createSprint);
  const completeSprint = useBoardStore((s) => s.completeSprint);

  const [open, setOpen] = useState(false);
  const [newSprintName, setNewSprintName] = useState("");
  const [newSprintStart, setNewSprintStart] = useState("");
  const [newSprintEnd, setNewSprintEnd] = useState("");
  const [sprintError, setSprintError] = useState("");
  const dialogRef = useClickOutside(open, () => setOpen(false));

  const handleCreateSprint = async () => {
    setSprintError("");
    const name = newSprintName.trim();
    if (!name || !newSprintStart || !newSprintEnd) {
      setSprintError("Fill in all fields");
      return;
    }
    if (new Date(newSprintEnd) <= new Date(newSprintStart)) {
      setSprintError("End date must be after start date");
      return;
    }
    if (activeSprint) {
      setSprintError("Complete the active sprint before starting a new one");
      return;
    }
    try {
      await createSprint(name, newSprintStart, newSprintEnd);
      setNewSprintName("");
      setNewSprintStart("");
      setNewSprintEnd("");
    } catch {
      // Store pushError handles feedback; keep form open.
    }
  };

  const handleCompleteSprint = async () => {
    if (!activeSprint) return;
    const ok = window.confirm(
      `Complete sprint "${activeSprint.name}"? This cannot be undone.`
    );
    if (!ok) return;
    await completeSprint(activeSprint.id);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label="Manage sprint"
        aria-expanded={open}
        title={activeSprint?.name || "Sprint"}
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          activeSprint
            ? "bg-violet-500/10 text-violet-600 dark:text-violet-300"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        }`}
      >
        <Zap className="w-4 h-4" />
        <span className="hidden lg:inline max-w-[120px] truncate">
          {activeSprint?.name || "Sprint"}
        </span>
      </button>

      {open && (
        <div
          ref={dialogRef}
          className="absolute right-0 top-full mt-2 w-[calc(100vw-1.5rem)] sm:w-80 max-w-[20rem] rounded-lg border border-border bg-popover shadow-xl z-[100] p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">
              Sprint
            </h3>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close sprint panel"
              className="p-1 rounded-md hover:bg-muted text-muted-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {activeSprint && (
            <div className="p-3 rounded-lg bg-violet-500/10 mb-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-violet-700 dark:text-violet-300 truncate">
                    {activeSprint.name}
                  </p>
                  <p className="text-xs text-violet-500 dark:text-violet-400">
                    {new Date(activeSprint.startDate).toLocaleDateString()} –{" "}
                    {new Date(activeSprint.endDate).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={handleCompleteSprint}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-violet-600 hover:bg-violet-500 text-xs font-medium text-white transition-colors flex-shrink-0"
                >
                  <Check className="w-3.5 h-3.5" />
                  Complete
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2.5 mb-4">
            <input
              value={newSprintName}
              onChange={(e) => {
                setNewSprintName(e.target.value);
                setSprintError("");
              }}
              placeholder="Sprint name..."
              disabled={!!activeSprint}
              className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-violet-500/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            />
            <div className="flex gap-2">
              <input
                type="date"
                value={newSprintStart}
                onChange={(e) => {
                  setNewSprintStart(e.target.value);
                  setSprintError("");
                }}
                disabled={!!activeSprint}
                className="flex-1 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-violet-500/40 transition-colors [color-scheme:dark] disabled:opacity-40 disabled:cursor-not-allowed"
              />
              <input
                type="date"
                value={newSprintEnd}
                onChange={(e) => {
                  setNewSprintEnd(e.target.value);
                  setSprintError("");
                }}
                disabled={!!activeSprint}
                className="flex-1 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-violet-500/40 transition-colors [color-scheme:dark] disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>
            <button
              onClick={handleCreateSprint}
              disabled={
                !!activeSprint ||
                !newSprintName.trim() ||
                !newSprintStart ||
                !newSprintEnd
              }
              title={
                activeSprint
                  ? "Complete the active sprint before starting a new one"
                  : undefined
              }
              className="w-full py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium text-white transition-colors"
            >
              Start new sprint
            </button>
            {sprintError && (
              <p className="text-xs text-red-500">{sprintError}</p>
            )}
          </div>

          {sprints.filter((s) => !s.isActive).length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Past sprints
              </p>
              <div className="space-y-0.5 max-h-32 overflow-y-auto">
                {sprints
                  .filter((s) => !s.isActive)
                  .map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between py-2 px-2 rounded-md hover:bg-muted"
                    >
                      <span className="text-sm text-muted-foreground truncate">
                        {s.name}
                      </span>
                      <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                        {new Date(s.startDate).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
