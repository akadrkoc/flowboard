"use client";

import { useBoardStore } from "@/store/boardStore";
import { useSession, signOut } from "next-auth/react";
import { LayoutGrid, Moon, Sun, Kanban, BarChart3, ListChecks, LogOut } from "lucide-react";

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
  const { data: session } = useSession();

  const user = session?.user;
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <nav className="flex items-center justify-between h-14 px-5 border-b border-gray-200 dark:border-white/[0.06] bg-white/80 dark:bg-[#12121a]/80 backdrop-blur-md">
      {/* Left: Logo + Sprint */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-5 h-5 text-violet-400" />
          <span className="text-[15px] font-bold text-gray-900 dark:text-white tracking-tight">
            FlowBoard
          </span>
        </div>
        <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full bg-violet-500/15 text-violet-600 dark:text-violet-300 text-[11px] font-medium">
          Sprint 4
        </span>
      </div>

      {/* Center: View switcher */}
      <div className="hidden md:flex items-center bg-gray-100 dark:bg-white/[0.04] rounded-lg p-0.5">
        {views.map((v) => (
          <button
            key={v.id}
            onClick={() => setActiveView(v.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
              activeView === v.id
                ? "bg-white dark:bg-white/[0.08] text-gray-900 dark:text-white shadow-sm dark:shadow-none"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            <v.icon className="w-3.5 h-3.5" />
            {v.label}
          </button>
        ))}
      </div>

      {/* Right: User + Theme toggle */}
      <div className="flex items-center gap-3">
        {/* User avatar & info */}
        {user && (
          <div className="flex items-center gap-2.5">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name || "User"}
                className="w-7 h-7 rounded-full ring-2 ring-white dark:ring-[#12121a]"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-violet-500 flex items-center justify-center ring-2 ring-white dark:ring-[#12121a]">
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

        <div className="w-px h-5 bg-gray-200 dark:bg-white/[0.08]" />

        {/* Dark mode toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/[0.05] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
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
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/[0.05] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </nav>
  );
}
