"use client";

import { useBoardStore } from "@/store/boardStore";
import { LayoutGrid, Moon, Sun, Kanban, BarChart3, ListChecks } from "lucide-react";

const onlineUsers = [
  { initials: "AK", color: "bg-violet-500" },
  { initials: "RJ", color: "bg-sky-500" },
  { initials: "ML", color: "bg-emerald-500" },
];

const views = [
  { id: "kanban" as const, label: "Kanban", icon: Kanban },
  { id: "scrum" as const, label: "Scrum", icon: ListChecks },
  { id: "analytics" as const, label: "Analytics", icon: BarChart3 },
];

export default function Navbar() {
  const darkMode = useBoardStore((s) => s.darkMode);
  const toggleDarkMode = useBoardStore((s) => s.toggleDarkMode);
  const activeView = useBoardStore((s) => s.activeView);
  const setActiveView = useBoardStore((s) => s.setActiveView);

  return (
    <nav className="flex items-center justify-between h-14 px-5 border-b border-white/[0.06] bg-[#12121a]/80 backdrop-blur-md">
      {/* Left: Logo + Sprint */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-5 h-5 text-violet-400" />
          <span className="text-[15px] font-bold text-white tracking-tight">
            FlowBoard
          </span>
        </div>
        <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full bg-violet-500/15 text-violet-300 text-[11px] font-medium">
          Sprint 4
        </span>
      </div>

      {/* Center: View switcher */}
      <div className="hidden md:flex items-center bg-white/[0.04] rounded-lg p-0.5">
        {views.map((v) => (
          <button
            key={v.id}
            onClick={() => setActiveView(v.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
              activeView === v.id
                ? "bg-white/[0.08] text-white"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <v.icon className="w-3.5 h-3.5" />
            {v.label}
          </button>
        ))}
      </div>

      {/* Right: Presence + Theme toggle */}
      <div className="flex items-center gap-3">
        {/* Online presence avatars */}
        <div className="flex items-center -space-x-2">
          {onlineUsers.map((user) => (
            <div
              key={user.initials}
              className={`w-7 h-7 rounded-full ${user.color} flex items-center justify-center ring-2 ring-[#12121a]`}
              title={user.initials}
            >
              <span className="text-[10px] font-bold text-white">
                {user.initials}
              </span>
            </div>
          ))}
        </div>

        <div className="w-px h-5 bg-white/[0.08]" />

        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-1.5 rounded-md hover:bg-white/[0.05] text-gray-400 hover:text-gray-200 transition-colors"
          title="Toggle theme"
        >
          {darkMode ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>
      </div>
    </nav>
  );
}
