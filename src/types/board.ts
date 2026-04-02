export type Priority = "high" | "med" | "low";

export type Card = {
  id: string;
  title: string;
  labels: string[];
  priority: Priority;
  dueDate: string;
  storyPoints: number;
  assigneeInitials: string;
  assigneeColor: string;
  columnId: string;
  order: number;
  completedAt?: string;
  createdAt?: string;
};

export type Column = {
  id: string;
  title: string;
  cards: Card[];
};
