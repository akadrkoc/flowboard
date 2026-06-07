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
        className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/15 text-violet-600 dark:text-violet-300 text-[11px] font-medium hover:bg-violet-500/25 transition-colors"
      >
        <Zap className="w-3 h-3" />
        {activeSprint?.name || "No Sprint"}
      </button>

      {open && (
        <div
          ref={dialogRef}
          className="absolute left-0 top-full mt-2 w-[calc(100vw-1.5rem)] sm:w-80 max-w-[20rem] rounded-lg border border-[#ead7c3] dark:border-white/[0.08] bg-[#fbf6ef] dark:bg-[#1e1e2e] shadow-xl z-50 p-3"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-semibold text-gray-800 dark:text-gray-100">
              Sprint Management
            </h3>
            <button onClick={() => setOpen(false)} aria-label="Close sprint panel">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {activeSprint && (
            <div className="p-2.5 rounded-md bg-violet-50 dark:bg-violet-500/10 mb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[12px] font-medium text-violet-700 dark:text-violet-300">
                    {activeSprint.name}
                  </p>
                  <p className="text-[10px] text-violet-500 dark:text-violet-400">
                    {new Date(activeSprint.startDate).toLocaleDateString()} -{" "}
                    {new Date(activeSprint.endDate).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={handleCompleteSprint}
                  className="flex items-center gap-1 px-2 py-1 rounded-md bg-violet-600 hover:bg-violet-500 text-[10px] font-medium text-white transition-colors"
                >
                  <Check className="w-3 h-3" />
                  Complete
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2 mb-3">
            <input
              value={newSprintName}
              onChange={(e) => {
                setNewSprintName(e.target.value);
                setSprintError("");
              }}
              placeholder="Sprint name..."
              disabled={!!activeSprint}
              className="w-full rounded-md border border-[#ead7c3] dark:border-white/[0.08] bg-[#dce0d9] dark:bg-white/[0.03] px-2.5 py-1.5 text-[11px] text-gray-800 dark:text-gray-100 outline-none focus:border-violet-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
                className="flex-1 rounded-md border border-[#ead7c3] dark:border-white/[0.08] bg-[#dce0d9] dark:bg-white/[0.03] px-2.5 py-1.5 text-[11px] text-gray-800 dark:text-gray-100 outline-none focus:border-violet-400 transition-colors [color-scheme:dark] disabled:opacity-40 disabled:cursor-not-allowed"
              />
              <input
                type="date"
                value={newSprintEnd}
                onChange={(e) => {
                  setNewSprintEnd(e.target.value);
                  setSprintError("");
                }}
                disabled={!!activeSprint}
                className="flex-1 rounded-md border border-[#ead7c3] dark:border-white/[0.08] bg-[#dce0d9] dark:bg-white/[0.03] px-2.5 py-1.5 text-[11px] text-gray-800 dark:text-gray-100 outline-none focus:border-violet-400 transition-colors [color-scheme:dark] disabled:opacity-40 disabled:cursor-not-allowed"
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
              className="w-full py-1.5 rounded-md bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-medium text-white transition-colors"
            >
              Start New Sprint
            </button>
            {sprintError && (
              <p className="text-[10px] text-red-500">{sprintError}</p>
            )}
          </div>

          {sprints.filter((s) => !s.isActive).length > 0 && (
            <div>
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">
                Past Sprints
              </p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {sprints
                  .filter((s) => !s.isActive)
                  .map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-[#dce0d9] dark:hover:bg-white/[0.03]"
                    >
                      <span className="text-[11px] text-gray-600 dark:text-gray-400">
                        {s.name}
                      </span>
                      <span className="text-[10px] text-gray-400">
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
