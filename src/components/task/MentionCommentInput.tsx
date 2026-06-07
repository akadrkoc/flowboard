"use client";

import { useState, useRef, useMemo, useCallback } from "react";
import { Send } from "lucide-react";
import { useBoardStore } from "@/store/boardStore";
import type { BoardMember } from "@/store/boardTypes";

interface MentionCommentInputProps {
  onSubmit: (text: string) => void;
}

function mentionHandle(member: BoardMember): string {
  return member.name.replace(/\s+/g, "");
}

export function renderCommentText(text: string, members: BoardMember[]) {
  const handles = members.map((m) => ({
    handle: mentionHandle(m),
    name: m.name,
  }));

  const parts: { type: "text" | "mention"; value: string }[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    const atIndex = remaining.indexOf("@");
    if (atIndex === -1) {
      parts.push({ type: "text", value: remaining });
      break;
    }

    if (atIndex > 0) {
      parts.push({ type: "text", value: remaining.slice(0, atIndex) });
    }

    const afterAt = remaining.slice(atIndex + 1);
    const match = handles.find(
      (h) =>
        afterAt.toLowerCase().startsWith(h.handle.toLowerCase()) &&
        (afterAt.length === h.handle.length ||
          /[\s,.!?]/.test(afterAt[h.handle.length] ?? ""))
    );

    if (match) {
      parts.push({ type: "mention", value: `@${match.handle}` });
      remaining = afterAt.slice(match.handle.length);
    } else {
      const spaceIdx = afterAt.search(/[\s,.!?]/);
      const token = spaceIdx === -1 ? afterAt : afterAt.slice(0, spaceIdx);
      parts.push({ type: "text", value: `@${token}` });
      remaining = spaceIdx === -1 ? "" : afterAt.slice(spaceIdx);
    }
  }

  return parts.map((part, i) =>
    part.type === "mention" ? (
      <span
        key={i}
        className="font-medium text-violet-600 dark:text-violet-300"
      >
        {part.value}
      </span>
    ) : (
      <span key={i}>{part.value}</span>
    )
  );
}

export default function MentionCommentInput({ onSubmit }: MentionCommentInputProps) {
  const members = useBoardStore((s) => s.members);
  const [text, setText] = useState("");
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const suggestions = useMemo(() => {
    if (!mentionOpen) return [];
    const q = mentionQuery.toLowerCase();
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        mentionHandle(m).toLowerCase().startsWith(q)
    );
  }, [members, mentionOpen, mentionQuery]);

  const updateMentionState = useCallback(
    (value: string, cursorPos: number) => {
      const before = value.slice(0, cursorPos);
      const atMatch = before.match(/@([\w.]*)$/);
      if (atMatch) {
        setMentionOpen(true);
        setMentionQuery(atMatch[1]);
        setActiveIndex(0);
      } else {
        setMentionOpen(false);
        setMentionQuery("");
      }
    },
    []
  );

  const insertMention = (member: BoardMember) => {
    const el = textareaRef.current;
    if (!el) return;

    const cursor = el.selectionStart;
    const before = text.slice(0, cursor);
    const after = text.slice(cursor);
    const atIndex = before.lastIndexOf("@");
    if (atIndex === -1) return;

    const handle = mentionHandle(member);
    const next = `${before.slice(0, atIndex)}@${handle} ${after}`;
    setText(next);
    setMentionOpen(false);
    setMentionQuery("");

    requestAnimationFrame(() => {
      const pos = atIndex + handle.length + 2;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  };

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSubmit(text.trim());
    setText("");
    setMentionOpen(false);
  };

  return (
    <div className="relative">
      {mentionOpen && suggestions.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-1 rounded-lg border border-border bg-popover shadow-lg z-[100] max-h-40 overflow-y-auto py-1">
          {suggestions.map((member, i) => (
            <button
              key={member.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                insertMention(member);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                i === activeIndex
                  ? "bg-violet-500/10 text-violet-600 dark:text-violet-300"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              {member.image ? (
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-6 h-6 rounded-full"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white">
                    {member.name?.[0]?.toUpperCase() || "?"}
                  </span>
                </div>
              )}
              <span className="font-medium truncate">{member.name}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={text}
          rows={2}
          onChange={(e) => {
            setText(e.target.value);
            updateMentionState(
              e.target.value,
              e.target.selectionStart
            );
          }}
          onKeyDown={(e) => {
            if (mentionOpen && suggestions.length > 0) {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((i) => (i + 1) % suggestions.length);
                return;
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex(
                  (i) => (i - 1 + suggestions.length) % suggestions.length
                );
                return;
              }
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                insertMention(suggestions[activeIndex]);
                return;
              }
              if (e.key === "Escape") {
                setMentionOpen(false);
                return;
              }
            }
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Write a comment..."
          className="flex-1 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-violet-500/40 transition-colors resize-none"
        />
        <button
          onClick={handleSubmit}
          disabled={!text.trim()}
          aria-label="Send comment"
          className="p-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
