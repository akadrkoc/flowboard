"use client";

import { useState, useEffect, useRef } from "react";
import { useBoardStore } from "@/store/boardStore";
import { useSession, signOut } from "next-auth/react";
import { LayoutGrid, Moon, Sun, BarChart3, LogOut, UserPlus, X, Zap, Check } from "lucide-react";

export default function Navbar() {
  const darkMode = useBoardStore((s) => s.darkMode);
  const toggleDarkMode = useBoardStore((s) => s.toggleDarkMode);
  const activeView = useBoardStore((s) => s.activeView);
  const setActiveView = useBoardStore((s) => s.setActiveView);
  const members = useBoardStore((s) => s.members);
  const loadMembers = useBoardStore((s) => s.loadMembers);
  const inviteMember = useBoardStore((s) => s.inviteMember);
  const removeMember = useBoardStore((s) => s.removeMember);
  const activeSprint = useBoardStore((s) => s.activeSprint);
  const sprints = useBoardStore((s) => s.sprints);
  const createSprint = useBoardStore((s) => s.createSprint);
  const completeSprint = useBoardStore((s) => s.completeSprint);
  const { data: session } = useSession();

  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [sprintDialogOpen, setSprintDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [newSprintName, setNewSprintName] = useState("");
  const [newSprintStart, setNewSprintStart] = useState("");
  const [newSprintEnd, setNewSprintEnd] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const sprintDialogRef = useRef<HTMLDivElement>(null);

  const user = session?.user;
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  useEffect(() => {
    if (memberDialogOpen) loadMembers();
  }, [memberDialogOpen, loadMembers]);

  useEffect(() => {
    if (!memberDialogOpen && !sprintDialogOpen) return;
    const handler = (e: MouseEvent) => {
      if (memberDialogOpen && dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        setMemberDialogOpen(false);
      }
      if (sprintDialogOpen && sprintDialogRef.current && !sprintDialogRef.current.contains(e.target as Node)) {
        setSprintDialogOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [memberDialogOpen, sprintDialogOpen]);

  const handleCreateSprint = async () => {
    if (!newSprintName.trim() || !newSprintStart || !newSprintEnd) return;
    await createSprint(newSprintName.trim(), newSprintStart, newSprintEnd);
    setNewSprintName("");
    setNewSprintStart("");
    setNewSprintEnd("");
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviteError("");
    try {
      await inviteMember(inviteEmail.trim());
      setInviteEmail("");
    } catch {
      setInviteError("User not found");
    }
  };

  return (
    <nav className="relative z-50 flex items-center justify-between h-14 px-5 border-b border-[#ead7c3] dark:border-white/[0.06] bg-[#fbf6ef]/80 dark:bg-[#12121a]/80 backdrop-blur-md">
      {/* Left: Logo + Sprint */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setActiveView("kanban")}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <LayoutGrid className="w-5 h-5 text-violet-400" />
          <span className="text-[15px] font-bold text-gray-900 dark:text-white tracking-tight">
            FlowBoard
          </span>
        </button>
        <div className="relative">
          <button
            onClick={() => setSprintDialogOpen(!sprintDialogOpen)}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/15 text-violet-600 dark:text-violet-300 text-[11px] font-medium hover:bg-violet-500/25 transition-colors"
          >
            <Zap className="w-3 h-3" />
            {activeSprint?.name || "No Sprint"}
          </button>

          {sprintDialogOpen && (
            <div
              ref={sprintDialogRef}
              className="absolute left-0 top-full mt-2 w-80 rounded-lg border border-[#ead7c3] dark:border-white/[0.08] bg-[#fbf6ef] dark:bg-[#1e1e2e] shadow-xl z-50 p-3"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-semibold text-gray-800 dark:text-gray-100">
                  Sprint Management
                </h3>
                <button onClick={() => setSprintDialogOpen(false)}>
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* Active sprint */}
              {activeSprint && (
                <div className="p-2.5 rounded-md bg-violet-50 dark:bg-violet-500/10 mb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[12px] font-medium text-violet-700 dark:text-violet-300">{activeSprint.name}</p>
                      <p className="text-[10px] text-violet-500 dark:text-violet-400">
                        {new Date(activeSprint.startDate).toLocaleDateString()} - {new Date(activeSprint.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => completeSprint(activeSprint.id)}
                      className="flex items-center gap-1 px-2 py-1 rounded-md bg-violet-600 hover:bg-violet-500 text-[10px] font-medium text-white transition-colors"
                    >
                      <Check className="w-3 h-3" />
                      Complete
                    </button>
                  </div>
                </div>
              )}

              {/* New sprint form */}
              <div className="space-y-2 mb-3">
                <input
                  value={newSprintName}
                  onChange={(e) => setNewSprintName(e.target.value)}
                  placeholder="Sprint name..."
                  className="w-full rounded-md border border-[#ead7c3] dark:border-white/[0.08] bg-[#dce0d9] dark:bg-white/[0.03] px-2.5 py-1.5 text-[11px] text-gray-800 dark:text-gray-100 outline-none focus:border-violet-400 transition-colors"
                />
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={newSprintStart}
                    onChange={(e) => setNewSprintStart(e.target.value)}
                    className="flex-1 rounded-md border border-[#ead7c3] dark:border-white/[0.08] bg-[#dce0d9] dark:bg-white/[0.03] px-2.5 py-1.5 text-[11px] text-gray-800 dark:text-gray-100 outline-none focus:border-violet-400 transition-colors [color-scheme:dark]"
                  />
                  <input
                    type="date"
                    value={newSprintEnd}
                    onChange={(e) => setNewSprintEnd(e.target.value)}
                    className="flex-1 rounded-md border border-[#ead7c3] dark:border-white/[0.08] bg-[#dce0d9] dark:bg-white/[0.03] px-2.5 py-1.5 text-[11px] text-gray-800 dark:text-gray-100 outline-none focus:border-violet-400 transition-colors [color-scheme:dark]"
                  />
                </div>
                <button
                  onClick={handleCreateSprint}
                  disabled={!newSprintName.trim() || !newSprintStart || !newSprintEnd}
                  className="w-full py-1.5 rounded-md bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-medium text-white transition-colors"
                >
                  Start New Sprint
                </button>
              </div>

              {/* Past sprints */}
              {sprints.filter((s) => !s.isActive).length > 0 && (
                <div>
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">Past Sprints</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {sprints.filter((s) => !s.isActive).map((s) => (
                      <div key={s.id} className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-[#dce0d9] dark:hover:bg-white/[0.03]">
                        <span className="text-[11px] text-gray-600 dark:text-gray-400">{s.name}</span>
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
      </div>

      {/* Center: Analytics toggle */}
      <button
        onClick={() => setActiveView(activeView === "analytics" ? "kanban" : "analytics")}
        className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
          activeView === "analytics"
            ? "bg-violet-500/15 text-violet-600 dark:text-violet-300"
            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-[#dce0d9] dark:hover:bg-white/[0.05]"
        }`}
      >
        <BarChart3 className="w-3.5 h-3.5" />
        Analytics
      </button>

      {/* Right: Members + User + Theme toggle */}
      <div className="flex items-center gap-3">
        {/* Member avatars */}
        <div className="relative">
          <button
            onClick={() => setMemberDialogOpen(!memberDialogOpen)}
            className="flex items-center -space-x-1.5"
          >
            {members.slice(0, 3).map((m) => (
              <div key={m.id} className="relative">
                {m.image ? (
                  <img
                    src={m.image}
                    alt={m.name}
                    className="w-6 h-6 rounded-full ring-2 ring-[#fbf6ef] dark:ring-[#12121a]"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center ring-2 ring-[#fbf6ef] dark:ring-[#12121a]">
                    <span className="text-[9px] font-bold text-white">
                      {m.name?.[0]?.toUpperCase() || "?"}
                    </span>
                  </div>
                )}
              </div>
            ))}
            {members.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-[#dce0d9] dark:bg-white/10 flex items-center justify-center ring-2 ring-[#fbf6ef] dark:ring-[#12121a]">
                <span className="text-[9px] font-medium text-gray-600 dark:text-gray-300">
                  +{members.length - 3}
                </span>
              </div>
            )}
            {members.length === 0 && (
              <div className="w-6 h-6 rounded-full bg-[#dce0d9] dark:bg-white/10 flex items-center justify-center">
                <UserPlus className="w-3 h-3 text-gray-500" />
              </div>
            )}
          </button>

          {/* Member dialog */}
          {memberDialogOpen && (
            <div
              ref={dialogRef}
              className="absolute right-0 top-full mt-2 w-72 rounded-lg border border-[#ead7c3] dark:border-white/[0.08] bg-[#fbf6ef] dark:bg-[#1e1e2e] shadow-xl z-50 p-3"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-semibold text-gray-800 dark:text-gray-100">
                  Members ({members.length})
                </h3>
                <button onClick={() => setMemberDialogOpen(false)}>
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* Member list */}
              <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center gap-2">
                    {m.image ? (
                      <img src={m.image} alt={m.name} className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center">
                        <span className="text-[9px] font-bold text-white">{m.name?.[0]?.toUpperCase()}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-gray-700 dark:text-gray-300 truncate">{m.name}</p>
                      <p className="text-[10px] text-gray-400 truncate">{m.email}</p>
                    </div>
                    <button
                      onClick={() => removeMember(m.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Invite form */}
              <div className="flex items-center gap-2">
                <input
                  value={inviteEmail}
                  onChange={(e) => { setInviteEmail(e.target.value); setInviteError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                  placeholder="Invite by email..."
                  className="flex-1 rounded-md border border-[#ead7c3] dark:border-white/[0.08] bg-[#dce0d9] dark:bg-white/[0.03] px-2.5 py-1.5 text-[11px] text-gray-800 dark:text-gray-100 outline-none focus:border-violet-400 transition-colors"
                />
                <button
                  onClick={handleInvite}
                  className="px-2.5 py-1.5 rounded-md bg-violet-600 hover:bg-violet-500 text-[11px] font-medium text-white transition-colors"
                >
                  Invite
                </button>
              </div>
              {inviteError && (
                <p className="text-[10px] text-red-500 mt-1">{inviteError}</p>
              )}
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-[#ead7c3] dark:bg-white/[0.08]" />

        {/* User avatar & info */}
        {user && (
          <div className="flex items-center gap-2.5">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name || "User"}
                className="w-7 h-7 rounded-full ring-2 ring-[#fbf6ef] dark:ring-[#12121a]"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-violet-500 flex items-center justify-center ring-2 ring-[#fbf6ef] dark:ring-[#12121a]">
                <span className="text-[10px] font-bold text-white">
                  {initials}
                </span>
              </div>
            )}
            <span className="hidden sm:block text-[12px] font-medium text-gray-600 dark:text-gray-300 max-w-[120px] truncate">
              {user.name}
            </span>
          </div>
        )}

        <div className="w-px h-5 bg-[#ead7c3] dark:bg-white/[0.08]" />

        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-1.5 rounded-md hover:bg-[#dce0d9] dark:hover:bg-white/[0.05] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          title="Toggle theme"
        >
          {darkMode ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>

        {/* Logout */}
        {user && (
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-1.5 rounded-md hover:bg-[#dce0d9] dark:hover:bg-white/[0.05] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </nav>
  );
}
