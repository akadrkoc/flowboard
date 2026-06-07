import { Suspense } from "react";
import BoardWorkspace from "@/components/BoardWorkspace";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface BoardPageProps {
  params: { boardId: string };
}

export default function BoardPage({ params }: BoardPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen bg-[#fbf6ef] dark:bg-[#16161e]">
          <LoadingSpinner label="Loading board..." />
        </div>
      }
    >
      <BoardWorkspace boardId={params.boardId} />
    </Suspense>
  );
}
