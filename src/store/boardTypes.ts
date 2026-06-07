import type { Card, Column } from "@/types/board";
import type { BoardView } from "@/types/views";

export interface BoardComment {
  id: string;
  text: string;
  cardId: string;
  authorName: string;
  authorImage?: string;
  createdAt: string;
}

export interface BoardMember {
  id: string;
  name: string;
  email: string;
  image?: string;
}

export interface SprintInfo {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface BoardState {
  boardId: string | null;
  boards: { id: string; name: string }[];
  loadBoards: () => Promise<{ id: string; name: string }[]>;
  createBoard: (name: string) => Promise<{ id: string; name: string }>;
  switchBoard: (boardId: string) => Promise<void>;
  columns: Column[];
  loading: boolean;
  darkMode: boolean;
  activeView: BoardView;
  searchQuery: string;
  filterPriority: string | null;
  filterLabel: string | null;
  filterAssignee: string | null;
  lastDeletedCard: (Card & { columnId: string }) | null;
  loadBoard: (boardId: string) => Promise<void>;
  initSocket: () => void;
  moveCardLocal: (cardId: string, toColumnId: string, newIndex: number) => void;
  moveCard: (cardId: string, toColumnId: string, newIndex: number) => void;
  addCard: (
    columnId: string,
    card: Omit<Card, "id" | "order" | "columnId">
  ) => void;
  updateCard: (cardId: string, updates: Partial<Card>) => void;
  deleteCard: (cardId: string) => void;
  toggleDarkMode: () => void;
  setActiveView: (view: BoardView) => void;
  setSearchQuery: (query: string) => void;
  setFilterPriority: (priority: string | null) => void;
  setFilterLabel: (label: string | null) => void;
  setFilterAssignee: (assignee: string | null) => void;
  clearFilters: () => void;
  restoreCard: () => void;
  dismissUndo: () => void;
  addColumn: (name: string) => void;
  renameColumn: (columnId: string, name: string) => void;
  deleteColumn: (columnId: string) => void;
  commentsByCard: Record<string, BoardComment[]>;
  loadComments: (cardId: string) => Promise<void>;
  addComment: (cardId: string, text: string) => void;
  members: BoardMember[];
  loadMembers: () => Promise<void>;
  inviteMember: (email: string) => Promise<void>;
  removeMember: (userId: string) => void;
  activeSprint: SprintInfo | null;
  sprints: SprintInfo[];
  loadSprints: () => Promise<void>;
  createSprint: (name: string, startDate: string, endDate: string) => Promise<void>;
  completeSprint: (sprintId: string) => Promise<void>;
  errors: { id: string; message: string }[];
  pushError: (message: string) => void;
  dismissError: (id: string) => void;
  addCardRequest: { columnId: string; nonce: number } | null;
  requestAddCard: (columnId: string) => void;
  clearAddCardRequest: () => void;
  selectMode: boolean;
  selectedCardIds: Record<string, true>;
  toggleSelectMode: () => void;
  setSelectMode: (on: boolean) => void;
  toggleCardSelection: (cardId: string) => void;
  clearSelection: () => void;
  bulkDeleteSelected: () => void;
  bulkMoveSelected: (toColumnId: string) => void;
}
