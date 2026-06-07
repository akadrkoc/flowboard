import { redirect } from "next/navigation";

interface TaskPageProps {
  params: { boardId: string; taskId: string };
}

export default function TaskPage({ params }: TaskPageProps) {
  redirect(`/board/${params.boardId}?task=${params.taskId}`);
}
