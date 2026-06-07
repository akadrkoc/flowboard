"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#fbf6ef] dark:bg-[#16161e] text-gray-900 dark:text-white px-4">
      <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center max-w-md">
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-md bg-violet-600 hover:bg-violet-500 text-sm font-medium text-white transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
