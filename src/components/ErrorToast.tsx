"use client";

import { useMemo } from "react";
import { AlertCircle, X } from "lucide-react";
import { useBoardStore } from "@/store/boardStore";

export default function ErrorToast() {
  // Ham degeri alip useMemo ile stabilize ediyoruz; dogrudan `?? []`
  // donmek useSyncExternalStore yolunda sonsuz render'a yol acar.
  const rawErrors = useBoardStore((s) => s.errors);
  const errors = useMemo(() => rawErrors ?? [], [rawErrors]);
  const dismissError = useBoardStore((s) => s.dismissError);

  if (errors.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {errors.map((err) => (
        <div
          key={err.id}
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 backdrop-blur-md px-3 py-2 shadow-lg"
        >
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-[12px] text-red-600 dark:text-red-300 flex-1 break-words">
            {err.message}
          </p>
          <button
            onClick={() => dismissError(err.id)}
            aria-label="Dismiss error"
            className="text-red-500/70 hover:text-red-500 transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
