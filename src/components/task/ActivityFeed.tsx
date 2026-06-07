"use client";

import { useState } from "react";
import {
  Send,
  MessageSquare,
  ArrowRightLeft,
  UserPlus,
  PlusCircle,
} from "lucide-react";
import { useBoardStore } from "@/store/boardStore";
import type { ActivityItem } from "@/store/boardTypes";

interface ActivityFeedProps {
  cardId: string;
  items: ActivityItem[];
  loading: boolean;
}

function activityIcon(type: string) {
  switch (type) {
    case "comment":
      return MessageSquare;
    case "status_changed":
      return ArrowRightLeft;
    case "assignee_changed":
      return UserPlus;
    case "subtask_added":
    case "subtask_completed":
      return PlusCircle;
    default:
      return MessageSquare;
  }
}

export default function ActivityFeed({
  cardId,
  items,
  loading,
}: ActivityFeedProps) {
  const addComment = useBoardStore((s) => s.addComment);
  const [commentText, setCommentText] = useState("");

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    addComment(cardId, commentText.trim());
    setCommentText("");
  };

  return (
    <div>
      <label className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <MessageSquare className="w-3 h-3" />
        Activity
      </label>

      <div className="space-y-2 max-h-52 overflow-y-auto mb-2">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <div
              className="w-5 h-5 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin"
              role="status"
              aria-label="Loading activity"
            />
          </div>
        ) : items.length === 0 ? (
          <p className="text-[11px] text-gray-400 dark:text-gray-500 py-2 text-center">
            No activity yet
          </p>
        ) : (
          items.map((item) => {
            const Icon = activityIcon(item.type);
            return (
              <div
                key={item.id}
                className="flex items-start gap-2 p-2 rounded-md bg-[#dce0d9] dark:bg-white/[0.03]"
              >
                {item.actorImage ? (
                  <img
                    src={item.actorImage}
                    alt={item.actorName}
                    className="w-5 h-5 rounded-full mt-0.5 flex-shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center mt-0.5 flex-shrink-0">
                    <span className="text-[8px] font-bold text-white">
                      {item.actorName?.[0]?.toUpperCase() || "?"}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300">
                      {item.actorName}
                    </span>
                    <Icon className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <span className="text-[10px] text-gray-400">
                      {new Date(item.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p
                    className={`text-[12px] mt-0.5 ${
                      item.type === "comment"
                        ? "text-gray-600 dark:text-gray-400"
                        : "text-gray-500 dark:text-gray-500 italic"
                    }`}
                  >
                    {item.text}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
          placeholder="Write a comment..."
          className="flex-1 rounded-md border border-[#ead7c3] dark:border-white/[0.08] bg-[#dce0d9] dark:bg-white/[0.03] px-3 py-1.5 text-[12px] text-gray-800 dark:text-gray-100 outline-none focus:border-violet-400 dark:focus:border-violet-500 transition-colors"
        />
        <button
          onClick={handleAddComment}
          disabled={!commentText.trim()}
          aria-label="Send comment"
          className="p-1.5 rounded-md bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
