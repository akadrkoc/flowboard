import { create } from "zustand";
import type { Card, Column } from "@/types/board";
import { graphqlFetch } from "@/lib/graphqlFetch";

interface BoardState {
  boardId: string | null;
  columns: Column[];
  loading: boolean;
  darkMode: boolean;
  activeView: "kanban" | "scrum" | "analytics";
  loadBoard: (boardId: string) => Promise<void>;
  moveCard: (cardId: string, toColumnId: string, newIndex: number) => void;
  addCard: (
    columnId: string,
    card: Omit<Card, "id" | "order" | "columnId">
  ) => void;
  updateCard: (cardId: string, updates: Partial<Card>) => void;
  deleteCard: (cardId: string) => void;
  toggleDarkMode: () => void;
  setActiveView: (view: "kanban" | "scrum" | "analytics") => void;
}

// GraphQL query strings
const GET_BOARD_QUERY = `
  query GetBoard($id: ID!) {
    board(id: $id) {
      id
      name
      columns {
        id
        name
        order
        cards {
          id
          title
          description
          labels
          priority
          dueDate
          storyPoints
          assigneeInitials
          assigneeColor
          columnId
          order
        }
      }
    }
  }
`;

const CREATE_CARD_MUTATION = `
  mutation CreateCard($columnId: ID!, $input: CardInput!) {
    createCard(columnId: $columnId, input: $input) {
      id
      title
      labels
      priority
      dueDate
      storyPoints
      assigneeInitials
      assigneeColor
      columnId
      order
    }
  }
`;

const MOVE_CARD_MUTATION = `
  mutation MoveCard($cardId: ID!, $toColumnId: ID!, $newIndex: Int!) {
    moveCard(cardId: $cardId, toColumnId: $toColumnId, newIndex: $newIndex) {
      id
      columnId
      order
    }
  }
`;

const UPDATE_CARD_MUTATION = `
  mutation UpdateCard($cardId: ID!, $input: CardInput!) {
    updateCard(cardId: $cardId, input: $input) {
      id
      title
      labels
      priority
      dueDate
      storyPoints
      assigneeInitials
      assigneeColor
      columnId
      order
    }
  }
`;

const DELETE_CARD_MUTATION = `
  mutation DeleteCard($cardId: ID!) {
    deleteCard(cardId: $cardId)
  }
`;

export const useBoardStore = create<BoardState>((set, get) => ({
  boardId: null,
  columns: [],
  loading: false,
  darkMode: true,
  activeView: "kanban",

  loadBoard: async (boardId: string) => {
    set({ loading: true });
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await graphqlFetch(GET_BOARD_QUERY, { id: boardId });

      if (data.board) {
        set({
          boardId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          columns: data.board.columns.map((col: any) => ({
            id: col.id,
            title: col.name,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            cards: (col.cards || []).map((card: any) => ({
              id: card.id,
              title: card.title,
              labels: card.labels || [],
              priority: card.priority,
              dueDate: card.dueDate || "",
              storyPoints: card.storyPoints,
              assigneeInitials: card.assigneeInitials || "",
              assigneeColor: card.assigneeColor || "bg-gray-500",
              columnId: card.columnId,
              order: card.order,
            })),
          })),
        });
      }
    } catch (error) {
      console.error("Failed to load board:", error);
    } finally {
      set({ loading: false });
    }
  },

  moveCard: (cardId, toColumnId, newIndex) => {
    // Optimistic update: UI anında güncellenir
    set((state) => {
      const columns = state.columns.map((col) => ({
        ...col,
        cards: [...col.cards],
      }));

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

      const targetCol = columns.find((c) => c.id === toColumnId);
      if (!targetCol) return state;

      movedCard.columnId = toColumnId;
      const clampedIndex = Math.min(newIndex, targetCol.cards.length);
      targetCol.cards.splice(clampedIndex, 0, movedCard);

      for (const col of columns) {
        col.cards.forEach((card, i) => {
          card.order = i;
        });
      }

      return { columns };
    });

    // Arka planda API'ye sync et
    const { boardId } = get();
    if (boardId) {
      graphqlFetch(MOVE_CARD_MUTATION, { cardId, toColumnId, newIndex }).catch(
        (err: unknown) => console.error("Failed to sync moveCard:", err)
      );
    }
  },

  addCard: (columnId, cardData) => {
    // Optimistic: geçici ID ile ekle
    const tempId = `temp-${Date.now()}`;

    set((state) => {
      const columns = state.columns.map((col) => {
        if (col.id !== columnId) return col;
        const newCard: Card = {
          ...cardData,
          id: tempId,
          columnId,
          order: col.cards.length,
        };
        return { ...col, cards: [...col.cards, newCard] };
      });
      return { columns };
    });

    // API'ye gönder ve gerçek ID ile güncelle
    graphqlFetch(CREATE_CARD_MUTATION, {
      columnId,
      input: {
        title: cardData.title,
        labels: cardData.labels,
        priority: cardData.priority,
        dueDate: cardData.dueDate || null,
        storyPoints: cardData.storyPoints,
        assigneeInitials: cardData.assigneeInitials,
        assigneeColor: cardData.assigneeColor,
      },
    })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((data: any) => {
        set((state) => ({
          columns: state.columns.map((col) => ({
            ...col,
            cards: col.cards.map((c) =>
              c.id === tempId
                ? {
                    ...c,
                    id: data.createCard.id,
                    order: data.createCard.order,
                  }
                : c
            ),
          })),
        }));
      })
      .catch((err: unknown) => {
        console.error("Failed to create card:", err);
        // Hata durumunda temp kartı kaldır
        set((state) => ({
          columns: state.columns.map((col) => ({
            ...col,
            cards: col.cards.filter((c) => c.id !== tempId),
          })),
        }));
      });
  },

  updateCard: (cardId, updates) => {
    // Optimistic update
    set((state) => ({
      columns: state.columns.map((col) => ({
        ...col,
        cards: col.cards.map((card) =>
          card.id === cardId ? { ...card, ...updates } : card
        ),
      })),
    }));

    // API'ye sync
    if (!cardId.startsWith("temp-")) {
      graphqlFetch(UPDATE_CARD_MUTATION, {
        cardId,
        input: {
          title: updates.title,
          labels: updates.labels,
          priority: updates.priority,
          dueDate: updates.dueDate,
          storyPoints: updates.storyPoints,
          assigneeInitials: updates.assigneeInitials,
          assigneeColor: updates.assigneeColor,
        },
      }).catch((err: unknown) =>
        console.error("Failed to update card:", err)
      );
    }
  },

  deleteCard: (cardId) => {
    // Optimistic: hemen kaldır
    set((state) => ({
      columns: state.columns.map((col) => ({
        ...col,
        cards: col.cards.filter((c) => c.id !== cardId),
      })),
    }));

    // API'ye sync
    if (!cardId.startsWith("temp-")) {
      graphqlFetch(DELETE_CARD_MUTATION, { cardId }).catch((err: unknown) =>
        console.error("Failed to delete card:", err)
      );
    }
  },

  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  setActiveView: (view) => set({ activeView: view }),
}));
