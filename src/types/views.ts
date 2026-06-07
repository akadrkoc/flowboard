export type BoardView = "kanban" | "list" | "calendar" | "analytics";

export const BOARD_VIEWS: BoardView[] = [
  "kanban",
  "list",
  "calendar",
  "analytics",
];

export function isBoardView(value: string): value is BoardView {
  return BOARD_VIEWS.includes(value as BoardView);
}

export const VIEW_STORAGE_KEY = "flowboard-active-view";
