import BoardWorkspace from "@/components/BoardWorkspace";

interface TaskPageProps {
  params: { boardId: string; taskId: string };
}

export default function TaskPage({ params }: TaskPageProps) {
  return (
    <BoardWorkspace boardId={params.boardId} taskId={params.taskId} />
  );
}
