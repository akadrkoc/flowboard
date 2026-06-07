"use client";

import { useState } from "react";
import { Moon, Sun, LogOut, ChevronDown } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useBoardStore } from "@/store/boardStore";
import { useClickOutside } from "@/hooks/useClickOutside";

export default function UserControls() {
  const darkMode = useBoardStore((s) => s.darkMode);
  const toggleDarkMode = useBoardStore((s) => s.toggleDarkMode);
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(open, () => setOpen(false));

  const user = session?.user;
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  if (!user) {
    return (
      <button
        onClick={toggleDarkMode}
        aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
      >
        {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 p-1.5 pr-2.5 rounded-lg hover:bg-muted transition-colors"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {user.image ? (
          <img
            src={user.image}
            alt={user.name || "User"}
            className="w-7 h-7 rounded-full ring-2 ring-background"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-violet-500 flex items-center justify-center ring-2 ring-background">
            <span className="text-[10px] font-bold text-white">{initials}</span>
          </div>
        )}
        <span className="hidden md:block text-sm font-medium text-foreground max-w-[120px] truncate">
          {user.name}
        </span>
        <ChevronDown
          className={`hidden md:block w-3.5 h-3.5 text-muted-foreground transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 rounded-lg border border-border bg-popover shadow-xl z-[100] py-1">
          <div className="px-3 py-2 border-b border-border/60">
            <p className="text-sm font-medium text-foreground truncate">
              {user.name}
            </p>
            {user.email && (
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              toggleDarkMode();
              setOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Moon className="w-4 h-4 text-muted-foreground" />
            )}
            {darkMode ? "Light mode" : "Dark mode"}
          </button>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
