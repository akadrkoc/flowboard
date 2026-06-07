"use client";

import { useState, useEffect } from "react";
import { UserPlus, X } from "lucide-react";
import { useBoardStore } from "@/store/boardStore";
import { useClickOutside } from "@/hooks/useClickOutside";

export default function MembersPanel() {
  const members = useBoardStore((s) => s.members);
  const loadMembers = useBoardStore((s) => s.loadMembers);
  const inviteMember = useBoardStore((s) => s.inviteMember);
  const removeMember = useBoardStore((s) => s.removeMember);

  const [open, setOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState("");
  const dialogRef = useClickOutside(open, () => setOpen(false));

  useEffect(() => {
    if (open) loadMembers();
  }, [open, loadMembers]);

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
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label="Manage board members"
        aria-expanded={open}
        className="flex items-center -space-x-2 p-1 rounded-lg hover:bg-muted transition-colors"
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

      {open && (
        <div
          ref={dialogRef}
          className="absolute right-0 top-full mt-2 w-[calc(100vw-1.5rem)] sm:w-72 max-w-[18rem] rounded-lg border border-border bg-popover shadow-xl z-[100] p-3"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-semibold text-gray-800 dark:text-gray-100">
              Members ({members.length})
            </h3>
            <button onClick={() => setOpen(false)} aria-label="Close members panel">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-2">
                {m.image ? (
                  <img
                    src={m.image}
                    alt={m.name}
                    className="w-6 h-6 rounded-full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-white">
                      {m.name?.[0]?.toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-gray-700 dark:text-gray-300 truncate">
                    {m.name}
                  </p>
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

          <div className="flex items-center gap-2">
            <input
              value={inviteEmail}
              onChange={(e) => {
                setInviteEmail(e.target.value);
                setInviteError("");
              }}
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
  );
}
