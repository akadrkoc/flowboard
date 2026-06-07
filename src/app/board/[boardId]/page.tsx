import BoardWorkspace from "@/components/BoardWorkspace";

interface BoardPageProps {
  params: { boardId: string };
}

export default function BoardPage({ params }: BoardPageProps) {
  return <BoardWorkspace boardId={params.boardId} />;
}
