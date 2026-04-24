"use client";

import { useState, useEffect, useRef } from "react";
import { useBoardStore } from "@/store/boardStore";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutGrid,
  Moon,
  Sun,
  BarChart3,
  LogOut,
  UserPlus,
  X,
  Zap,
  Check,
  ChevronDown,
  Plus,
} from "lucide-react";

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
  const boardId = useBoardStore((s) => s.boardId);
  const boards = useBoardStore((s) => s.boards);
  const loadBoards = useBoardStore((s) => s.loadBoards);
  const switchBoard = useBoardStore((s) => s.switchBoard);
  const createBoard = useBoardStore((s) => s.createBoard);
  const { data: session } = useSession();

  const [boardDialogOpen, setBoardDialogOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [creatingBoard, setCreatingBoard] = useState(false);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [sprintDialogOpen, setSprintDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [newSprintName, setNewSprintName] = useState("");
  const [newSprintStart, setNewSprintStart] = useState("");
  const [newSprintEnd, setNewSprintEnd] = useState("");
  const [sprintError, setSprintError] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const sprintDialogRef = useRef<HTMLDivElement>(null);
  const boardDialogRef = useRef<HTMLDivElement>(null);

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
    if (!memberDialogOpen && !sprintDialogOpen && !boardDialogOpen) return;
    const handler = (e: MouseEvent) => {
      if (memberDialogOpen && dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        setMemberDialogOpen(false);
      }
      if (sprintDialogOpen && sprintDialogRef.current && !sprintDialogRef.current.contains(e.target as Node)) {
        setSprintDialogOpen(false);
      }
      if (boardDialogOpen && boardDialogRef.current && !boardDialogRef.current.contains(e.target as Node)) {
        setBoardDialogOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [memberDialogOpen, sprintDialogOpen, boardDialogOpen]);

  // Board dialog ilk acildiginda listeyi tazele; yeni baska bir
  // sekmeden eklenmis olabilir.
  useEffect(() => {
    if (boardDialogOpen) loadBoards();
  }, [boardDialogOpen, loadBoards]);

  const currentBoardName =
    boards.find((b) => b.id === boardId)?.name || "Board";

  const handleCreateBoard = async () => {
    const name = newBoardName.trim();
    if (!name) return;
    setCreatingBoard(true);
    try {
      const created = await createBoard(name);
      setNewBoardName("");
      // Yeni olusturulan board'a gec
      await switchBoard(created.id);
      setBoardDialogOpen(false);
    } catch {
      // Store pushError'a yaziyor zaten
    } finally {
      setCreatingBoard(false);
    }
  };

  const handleSwitchBoard = async (id: string) => {
    if (id === boardId) {
      setBoardDialogOpen(false);
      return;
    }
    await switchBoard(id);
    setBoardDialogOpen(false);
  };

  const handleCreateSprint = async () => {
    setSprintError("");
    const name = newSprintName.trim();
    if (!name || !newSprintStart || !newSprintEnd) {
      setSprintError("Fill in all fields");
      return;
    }
    // Client-side pre-validation: server de ayni kontrolu yapiyor ama
    // kullaniciya istek atmadan feedback vermek daha iyi.
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
      // Store'daki pushError zaten ErrorToast'a yaziyor; burada ek
      // bir sey yapmayalim, yalnizca form'u acik birakalim.
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
    <nav className="relative z-50 flex items-center justify-between h-12 sm:h-14 px-3 sm:px-5 border-b border-[#ead7c3] dark:border-white/[0.06] bg-[#fbf6ef]/80 dark:bg-[#12121a]/80 backdrop-blur-md">
      {/* Left: Logo + Board switcher + Sprint */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <button
          onClick={() => setActiveView("kanban")}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0"
          title="FlowBoard"
        >
          <LayoutGrid className="w-5 h-5 text-violet-400" />
        </button>

        {/* Board switcher dropdown */}
        <div className="relative min-w-0">
          <button
            onClick={() => setBoardDialogOpen((v) => !v)}
            className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-1 rounded-md hover:bg-[#dce0d9] dark:hover:bg-white/[0.05] transition-colors min-w-0"
            title="Switch board"
          >
            <span className="text-[13px] sm:text-[14px] font-bold text-gray-900 dark:text-white tracking-tight truncate max-w-[140px] sm:max-w-[200px]">
              {currentBoardName}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
          </button>

          {boardDialogOpen && (
            <div
              ref={boardDialogRef}
              className="absolute left-0 top-full mt-2 w-[calc(100vw-1.5rem)] sm:w-72 max-w-[18rem] rounded-lg border border-[#ead7c3] dark:border-white/[0.08] bg-[#fbf6ef] dark:bg-[#1e1e2e] shadow-xl z-50 p-3"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-semibold text-gray-800 dark:text-gray-100">
                  Boards ({boards.length})
                </h3>
                <button onClick={() => setBoardDialogOpen(false)}>
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* Board list */}
              <div className="space-y-0.5 max-h-56 overflow-y-auto mb-3">
                {boards.map((b) => {
                  const isCurrent = b.id === boardId;
                  return (
                    <button
                      key={b.id}
                      onClick={() => handleSwitchBoard(b.id)}
                      className={`w-full flex items-center justify-between gap-2 py-1.5 px-2 rounded-md text-left transition-colors ${
                        isCurrent
                          ? "bg-violet-500/15 text-violet-600 dark:text-violet-300"
                          : "text-gray-700 dark:text-gray-300 hover:bg-[#dce0d9] dark:hover:bg-white/[0.03]"
                      }`}
                    >
                      <span className="text-[12px] font-medium truncate">
                        {b.name}
                      </span>
                      {isCurrent && (
                        <Check className="w-3.5 h-3.5 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
                {boards.length === 0 && (
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 py-2 text-center">
                    No boards yet
                  </p>
                )}
              </div>

              {/* Create board */}
              <div className="border-t border-[#ead7c3] dark:border-white/[0.06] pt-2.5">
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">
                  Create new board
                </p>
                <div className="flex items-center gap-2">
                  <input
                    value={newBoardName}
                    onChange={(e) => setNewBoardName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateBoard();
                    }}
                    placeholder="Board name..."
                    className="flex-1 rounded-md border border-[#ead7c3] dark:border-white/[0.08] bg-[#dce0d9] dark:bg-white/[0.03] px-2.5 py-1.5 text-[11px] text-gray-800 dark:text-gray-100 outline-none focus:border-violet-400 transition-colors"
                  />
                  <button
                    onClick={handleCreateBoard}
                    disabled={!newBoardName.trim() || creatingBoard}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-md bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-medium text-white transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Create
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
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
              className="absolute left-0 top-full mt-2 w-[calc(100vw-1.5rem)] sm:w-80 max-w-[20rem] rounded-lg border border-[#ead7c3] dark:border-white/[0.08] bg-[#fbf6ef] dark:bg-[#1e1e2e] shadow-xl z-50 p-3"
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
                      onClick={handleCompleteSprint}
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
      <div className="flex items-center gap-2 sm:gap-3">
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
              className="absolute right-0 top-full mt-2 w-[calc(100vw-1.5rem)] sm:w-72 max-w-[18rem] rounded-lg border border-[#ead7c3] dark:border-white/[0.08] bg-[#fbf6ef] dark:bg-[#1e1e2e] shadow-xl z-50 p-3"
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
