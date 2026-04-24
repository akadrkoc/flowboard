"use client";

import { useEffect, useState } from "react";
import { useBoardStore } from "@/store/boardStore";
import { X } from "lucide-react";

// Hangi elemanlarda event'i yok sayacagimizi kontrol eder. Kullanici bir
// input/textarea icinde yazarken tipik sayiyi kisayol olarak yorumlamak
// sinir bozucu olur.
function isTextTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (target.isContentEditable) return true;
  return false;
}

const SHORTCUTS: { keys: string; description: string }[] = [
  { keys: "/", description: "Focus search" },
  { keys: "c", description: "Add card to first column" },
  { keys: "g then a", description: "Open Analytics view" },
  { keys: "g then k", description: "Open Kanban view" },
  { keys: "Esc", description: "Close modal / cancel" },
  { keys: "?", description: "Show this help" },
];

export default function KeyboardShortcuts() {
  const columns = useBoardStore((s) => s.columns);
  const requestAddCard = useBoardStore((s) => s.requestAddCard);
  const setActiveView = useBoardStore((s) => s.setActiveView);
  const activeView = useBoardStore((s) => s.activeView);

  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    let gPending = false;
    let gTimer: ReturnType<typeof setTimeout> | null = null;

    const resetGPending = () => {
      gPending = false;
      if (gTimer) {
        clearTimeout(gTimer);
        gTimer = null;
      }
    };

    const handler = (e: KeyboardEvent) => {
      // Modifier ile kombine kisayollari istemiyoruz (tarayici kisayollari
      // ile carpismasin).
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // Yardim overlay'i acikken yalnizca Esc ve ? kapatmasi calissin.
      if (helpOpen) {
        if (e.key === "Escape") {
          e.preventDefault();
          setHelpOpen(false);
        }
        return;
      }

      // Input icindeyken sadece Esc calissin (blur amaciyla).
      if (isTextTarget(e.target)) {
        if (e.key === "Escape" && e.target instanceof HTMLElement) {
          e.target.blur();
        }
        return;
      }

      switch (e.key) {
        case "/": {
          e.preventDefault();
          const input =
            document.getElementById("filter-search-input") ||
            document.getElementById("filter-search-input-mobile");
          if (input instanceof HTMLInputElement) {
            input.focus();
            input.select();
          }
          resetGPending();
          return;
        }
        case "c": {
          const first = columns[0];
          if (first) {
            e.preventDefault();
            // Kanban gorunumunde degilsek oraya gec, sonra formu ac.
            if (activeView !== "kanban") setActiveView("kanban");
            requestAddCard(first.id);
          }
          resetGPending();
          return;
        }
        case "?": {
          e.preventDefault();
          setHelpOpen(true);
          resetGPending();
          return;
        }
        case "g": {
          // "g a" veya "g k" icin bir sonraki tusu bekle.
          gPending = true;
          gTimer = setTimeout(resetGPending, 1200);
          return;
        }
        case "a": {
          if (gPending) {
            e.preventDefault();
            setActiveView("analytics");
            resetGPending();
          }
          return;
        }
        case "k": {
          if (gPending) {
            e.preventDefault();
            setActiveView("kanban");
            resetGPending();
          }
          return;
        }
        case "Escape": {
          resetGPending();
          return;
        }
        default:
          resetGPending();
      }
    };

    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      if (gTimer) clearTimeout(gTimer);
    };
  }, [columns, requestAddCard, setActiveView, activeView, helpOpen]);

  if (!helpOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={() => setHelpOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-lg border border-[#ead7c3] dark:border-white/[0.08] bg-[#fbf6ef] dark:bg-[#1e1e2e] shadow-2xl p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-semibold text-gray-800 dark:text-gray-100">
            Keyboard Shortcuts
          </h3>
          <button
            onClick={() => setHelpOpen(false)}
            className="p-1 rounded-md hover:bg-[#dce0d9] dark:hover:bg-white/[0.05] transition-colors"
            aria-label="Close shortcuts"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <ul className="space-y-1.5">
          {SHORTCUTS.map((s) => (
            <li
              key={s.keys}
              className="flex items-center justify-between gap-3 py-1 px-1 rounded-md"
            >
              <span className="text-[12px] text-gray-700 dark:text-gray-300">
                {s.description}
              </span>
              <kbd className="px-2 py-0.5 text-[10px] font-mono font-medium rounded bg-[#dce0d9] dark:bg-white/[0.08] text-gray-700 dark:text-gray-200 border border-[#ead7c3] dark:border-white/[0.06]">
                {s.keys}
              </kbd>
            </li>
          ))}
        </ul>

        <p className="mt-3 text-[10px] text-gray-500 dark:text-gray-400 text-center">
          Press <kbd className="px-1.5 py-0.5 font-mono rounded bg-[#dce0d9] dark:bg-white/[0.08]">Esc</kbd> to close
        </p>
      </div>
    </div>
  );
}
