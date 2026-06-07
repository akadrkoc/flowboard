"use client";

import { Moon, Sun, LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useBoardStore } from "@/store/boardStore";

export default function UserControls() {
  const darkMode = useBoardStore((s) => s.darkMode);
  const toggleDarkMode = useBoardStore((s) => s.toggleDarkMode);
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
    <>
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
              <span className="text-[10px] font-bold text-white">{initials}</span>
            </div>
          )}
          <span className="hidden sm:block text-[12px] font-medium text-gray-600 dark:text-gray-300 max-w-[120px] truncate">
            {user.name}
          </span>
        </div>
      )}

      <div className="w-px h-5 bg-[#ead7c3] dark:bg-white/[0.08]" />

      <button
        onClick={toggleDarkMode}
        aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        className="p-1.5 rounded-md hover:bg-[#dce0d9] dark:hover:bg-white/[0.05] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
      >
        {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      {user && (
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          aria-label="Sign out"
          className="p-1.5 rounded-md hover:bg-[#dce0d9] dark:hover:bg-white/[0.05] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      )}
    </>
  );
}
