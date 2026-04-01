import { create } from "zustand";
import type { Card, Column } from "@/types/board";
import { mockColumns } from "@/data/mockData";

interface BoardState {
  columns: Column[];
  darkMode: boolean;
  activeView: "kanban" | "scrum" | "analytics";
  moveCard: (cardId: string, toColumnId: string, newIndex: number) => void;
  addCard: (columnId: string, card: Omit<Card, "id" | "order" | "columnId">) => void;
  updateCard: (cardId: string, updates: Partial<Card>) => void;
  deleteCard: (cardId: string) => void;
  toggleDarkMode: () => void;
  setActiveView: (view: "kanban" | "scrum" | "analytics") => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  columns: mockColumns,
  darkMode: true,
  activeView: "kanban",

  moveCard: (cardId, toColumnId, newIndex) =>
    set((state) => {
      const columns = state.columns.map((col) => ({
        ...col,
        cards: [...col.cards],
      }));

      // Find and remove card from source column
      let movedCard: Card | undefined;
      for (const col of columns) {
        const idx = col.cards.findIndex((c) => c.id === cardId);
        if (idx !== -1) {
          movedCard = { ...col.cards[idx] };
          col.cards.splice(idx, 1);
          break;
        }
      }

      if (!movedCard) return state;

      // Insert into target column
      const targetCol = columns.find((c) => c.id === toColumnId);
      if (!targetCol) return state;

      movedCard.columnId = toColumnId;
      const clampedIndex = Math.min(newIndex, targetCol.cards.length);
      targetCol.cards.splice(clampedIndex, 0, movedCard);

      // Recompute order for affected columns
      for (const col of columns) {
        col.cards.forEach((card, i) => {
          card.order = i;
        });
      }

      return { columns };
    }),

  addCard: (columnId, cardData) =>
    set((state) => {
      const columns = state.columns.map((col) => {
        if (col.id !== columnId) return col;
        const newCard: Card = {
          ...cardData,
          id: `card-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          columnId,
          order: col.cards.length,
        };
        return { ...col, cards: [...col.cards, newCard] };
      });
      return { columns };
    }),

  updateCard: (cardId, updates) =>
    set((state) => ({
      columns: state.columns.map((col) => ({
        ...col,
        cards: col.cards.map((card) =>
          card.id === cardId ? { ...card, ...updates } : card
        ),
      })),
    })),

  deleteCard: (cardId) =>
    set((state) => ({
      columns: state.columns.map((col) => ({
        ...col,
        cards: col.cards.filter((c) => c.id !== cardId),
      })),
    })),

  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  setActiveView: (view) => set({ activeView: view }),
}));
