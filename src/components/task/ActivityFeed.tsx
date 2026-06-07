"use client";

import {
  MessageSquare,
  ArrowRightLeft,
  UserPlus,
  PlusCircle,
} from "lucide-react";
import { useBoardStore } from "@/store/boardStore";
import type { ActivityItem } from "@/store/boardTypes";
import MentionCommentInput, {
  renderCommentText,
} from "./MentionCommentInput";

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
  const members = useBoardStore((s) => s.members);

  return (
    <div className="space-y-3">
      <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
        <MessageSquare className="w-4 h-4" />
        Activity & comments
      </label>

      <div className="space-y-2.5 max-h-60 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <div
              className="w-5 h-5 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin"
              role="status"
              aria-label="Loading activity"
            />
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No activity yet
          </p>
        ) : (
          items.map((item) => {
            const Icon = activityIcon(item.type);
            return (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border/50"
              >
                {item.actorImage ? (
                  <img
                    src={item.actorImage}
                    alt={item.actorName}
                    className="w-7 h-7 rounded-full mt-0.5 flex-shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-violet-500 flex items-center justify-center mt-0.5 flex-shrink-0">
                    <span className="text-[10px] font-bold text-white">
                      {item.actorName?.[0]?.toUpperCase() || "?"}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">
                      {item.actorName}
                    </span>
                    <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p
                    className={`text-sm mt-1 leading-relaxed ${
                      item.type === "comment"
                        ? "text-foreground/80"
                        : "text-muted-foreground italic"
                    }`}
                  >
                    {item.type === "comment"
                      ? renderCommentText(item.text, members)
                      : item.text}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <MentionCommentInput
        onSubmit={(text) => addComment(cardId, text)}
      />
    </div>
  );
}
