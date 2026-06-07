"use client";

import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function Loading() {
  return (
    <div className="flex items-center justify-center h-screen bg-[#fbf6ef] dark:bg-[#16161e]">
      <LoadingSpinner label="Loading FlowBoard..." />
    </div>
  );
}
