import { create } from "zustand";
import type { Card, Column } from "@/types/board";
import { graphqlFetch } from "@/lib/graphqlFetch";
import { getSocket } from "@/lib/socket";

interface BoardState {
  boardId: string | null;
  boards: { id: string; name: string }[];
  loadBoards: () => Promise<{ id: string; name: string }[]>;
  createBoard: (name: string) => Promise<{ id: string; name: string }>;
  switchBoard: (boardId: string) => Promise<void>;
  columns: Column[];
  loading: boolean;
  darkMode: boolean;
  activeView: "kanban" | "analytics";
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
  setActiveView: (view: "kanban" | "analytics") => void;
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
  commentsByCard: Record<string, { id: string; text: string; cardId: string; authorName: string; authorImage?: string; createdAt: string }[]>;
  loadComments: (cardId: string) => Promise<void>;
  addComment: (cardId: string, text: string) => void;
  members: { id: string; name: string; email: string; image?: string }[];
  loadMembers: () => Promise<void>;
  inviteMember: (email: string) => Promise<void>;
  removeMember: (userId: string) => void;
  activeSprint: { id: string; name: string; startDate: string; endDate: string; isActive: boolean } | null;
  sprints: { id: string; name: string; startDate: string; endDate: string; isActive: boolean }[];
  loadSprints: () => Promise<void>;
  createSprint: (name: string, startDate: string, endDate: string) => Promise<void>;
  completeSprint: (sprintId: string) => Promise<void>;
  errors: { id: string; message: string }[];
  pushError: (message: string) => void;
  dismissError: (id: string) => void;
  // Klavye kisayollari ile "Add card" formunu acmak icin kolon hedefi.
  // Artan bir counter ile ayni kolon tekrar tekrar tetiklenebilir.
  addCardRequest: { columnId: string; nonce: number } | null;
  requestAddCard: (columnId: string) => void;
  clearAddCardRequest: () => void;

  // Toplu secim: kullanici cok sayida karti ayni anda tasimak veya silmek
  // istedigi zaman aktif olan mod. selectedCardIds'deki degerler `true`
  // (Record<string, true>) olarak tutuluyor; O(1) contains ve Immer-benzeri
  // immutable spread kullanimi icin.
  selectMode: boolean;
  selectedCardIds: Record<string, true>;
  toggleSelectMode: () => void;
  setSelectMode: (on: boolean) => void;
  toggleCardSelection: (cardId: string) => void;
  clearSelection: () => void;
  bulkDeleteSelected: () => void;
  bulkMoveSelected: (toColumnId: string) => void;
}

// GraphQL query strings
const GET_BOARDS_LIST_QUERY = `
  query GetBoards {
    boards { id name }
  }
`;

const CREATE_BOARD_MUTATION = `
  mutation CreateBoard($name: String!) {
    createBoard(name: $name) { id name }
  }
`;

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
          completedAt
          createdAt
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

const RESTORE_CARD_MUTATION = `
  mutation RestoreCard($cardId: ID!) {
    restoreCard(cardId: $cardId) {
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
`;

const ADD_COLUMN_MUTATION = `
  mutation AddColumn($boardId: ID!, $name: String!) {
    addColumn(boardId: $boardId, name: $name) {
      id
      name
      order
    }
  }
`;

const RENAME_COLUMN_MUTATION = `
  mutation RenameColumn($columnId: ID!, $name: String!) {
    renameColumn(columnId: $columnId, name: $name) {
      id
      name
    }
  }
`;

const DELETE_COLUMN_MUTATION = `
  mutation DeleteColumn($columnId: ID!) {
    deleteColumn(columnId: $columnId)
  }
`;

const GET_COMMENTS_QUERY = `
  query GetComments($cardId: ID!) {
    comments(cardId: $cardId) {
      id
      text
      cardId
      authorName
      authorImage
      createdAt
    }
  }
`;

const ADD_COMMENT_MUTATION = `
  mutation AddComment($cardId: ID!, $text: String!) {
    addComment(cardId: $cardId, text: $text) {
      id
      text
      cardId
      authorName
      authorImage
      createdAt
    }
  }
`;

const GET_BOARD_MEMBERS_QUERY = `
  query GetBoardMembers($boardId: ID!) {
    boardMembers(boardId: $boardId) {
      id
      name
      email
      image
    }
  }
`;

const INVITE_MEMBER_MUTATION = `
  mutation InviteMember($boardId: ID!, $email: String!) {
    inviteMember(boardId: $boardId, email: $email) {
      id
    }
  }
`;

const REMOVE_MEMBER_MUTATION = `
  mutation RemoveMember($boardId: ID!, $userId: ID!) {
    removeMember(boardId: $boardId, userId: $userId) {
      id
    }
  }
`;

const GET_SPRINTS_QUERY = `
  query GetSprints($boardId: ID!) {
    sprints(boardId: $boardId) {
      id
      name
      startDate
      endDate
      isActive
    }
    activeSprint(boardId: $boardId) {
      id
      name
      startDate
      endDate
      isActive
    }
  }
`;

const CREATE_SPRINT_MUTATION = `
  mutation CreateSprint($boardId: ID!, $name: String!, $startDate: String!, $endDate: String!) {
    createSprint(boardId: $boardId, name: $name, startDate: $startDate, endDate: $endDate) {
      id
      name
      startDate
      endDate
      isActive
    }
  }
`;

const COMPLETE_SPRINT_MUTATION = `
  mutation CompleteSprint($sprintId: ID!) {
    completeSprint(sprintId: $sprintId) {
      id
      name
      isActive
    }
  }
`;

function errMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string") return err;
  return fallback;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  boardId: null,
  boards: [],
  columns: [],
  loading: false,
  darkMode: true,
  activeView: "kanban",
  searchQuery: "",
  filterPriority: null,
  filterLabel: null,
  filterAssignee: null,
  lastDeletedCard: null,
  commentsByCard: {},
  members: [],
  activeSprint: null,
  sprints: [],
  errors: [],
  addCardRequest: null,
  selectMode: false,
  selectedCardIds: {},

  toggleSelectMode: () =>
    set((state) => ({
      selectMode: !state.selectMode,
      // Mode kapatilinca secimleri de sifirla.
      selectedCardIds: state.selectMode ? {} : state.selectedCardIds,
    })),
  setSelectMode: (on: boolean) =>
    set((state) => ({
      selectMode: on,
      selectedCardIds: on ? state.selectedCardIds : {},
    })),
  toggleCardSelection: (cardId: string) =>
    set((state) => {
      const next = { ...state.selectedCardIds };
      if (next[cardId]) {
        delete next[cardId];
      } else {
        next[cardId] = true;
      }
      return { selectedCardIds: next };
    }),
  clearSelection: () => set({ selectedCardIds: {} }),

  bulkDeleteSelected: () => {
    const ids = Object.keys(get().selectedCardIds);
    if (ids.length === 0) return;
    // Mevcut deleteCard aksiyonu optimistic + soft delete yapiyor; her biri
    // icin ayri mutation cagrimi yeterli (kucuk N icin kabul edilebilir).
    for (const id of ids) {
      get().deleteCard(id);
    }
    set({ selectedCardIds: {}, selectMode: false });
  },

  bulkMoveSelected: (toColumnId: string) => {
    const { selectedCardIds, columns } = get();
    const ids = Object.keys(selectedCardIds);
    if (ids.length === 0) return;
    const targetCol = columns.find((c) => c.id === toColumnId);
    if (!targetCol) return;
    let baseIndex = targetCol.cards.length;
    for (const id of ids) {
      // Ayni kolona tasima istegi idempotent (moveCard zaten handle ediyor
      // ama server tarafina gereksiz yuk binmesin diye atliyoruz).
      const current = columns
        .flatMap((c) => c.cards.map((card) => ({ ...card, colId: c.id })))
        .find((c) => c.id === id);
      if (!current) continue;
      get().moveCard(id, toColumnId, baseIndex);
      if (current.colId !== toColumnId) baseIndex += 1;
    }
    set({ selectedCardIds: {}, selectMode: false });
  },

  requestAddCard: (columnId: string) =>
    set((state) => ({
      addCardRequest: {
        columnId,
        nonce: (state.addCardRequest?.nonce ?? 0) + 1,
      },
    })),
  clearAddCardRequest: () => set({ addCardRequest: null }),

  pushError: (message: string) => {
    const id = `err-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    set((state) => ({ errors: [...state.errors, { id, message }] }));
    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        set((state) => ({ errors: state.errors.filter((e) => e.id !== id) }));
      }, 5000);
    }
  },

  dismissError: (id: string) =>
    set((state) => ({ errors: state.errors.filter((e) => e.id !== id) })),

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
              description: card.description || "",
              labels: card.labels || [],
              priority: card.priority,
              dueDate: card.dueDate || "",
              storyPoints: card.storyPoints,
              assigneeInitials: card.assigneeInitials || "",
              assigneeColor: card.assigneeColor || "bg-gray-500",
              columnId: card.columnId,
              order: card.order,
              completedAt: card.completedAt || undefined,
              createdAt: card.createdAt || undefined,
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

  initSocket: () => {
    const { boardId } = get();
    if (!boardId) return;

    const socket = getSocket();

    // Her baglantida (ilk bagalnti + reconnect'ler) board room'una katil.
    // Socket.io reconnect'te listener'lar korunur ama server tarafi room
    // uyelikleri kaybolur; bu nedenle yeni bir `connect` her tetiklendiginde
    // `join-board` emit etmemiz sart. Aksi halde kart/update/yorum event'leri
    // gelmez ve kullanici "guncellemeler gelmiyor" zanneder.
    const joinBoard = () => {
      const currentBoardId = get().boardId;
      if (currentBoardId) socket.emit("join-board", currentBoardId);
    };
    socket.on("connect", joinBoard);
    if (socket.connected) joinBoard();

    // Diğer client'lardan gelen event'leri dinle
    socket.on("card-moved", (data: { cardId: string; toColumnId: string; newIndex: number }) => {
      set((state) => {
        const columns = state.columns.map((col) => ({
          ...col,
          cards: [...col.cards],
        }));

        let movedCard: Card | undefined;
        let fromColumnId: string | undefined;
        for (const col of columns) {
          const idx = col.cards.findIndex((c) => c.id === data.cardId);
          if (idx !== -1) {
            movedCard = { ...col.cards[idx] };
            fromColumnId = col.id;
            col.cards.splice(idx, 1);
            break;
          }
        }

        if (!movedCard) return state;

        const targetCol = columns.find((c) => c.id === data.toColumnId);
        if (!targetCol) return state;

        movedCard.columnId = data.toColumnId;

        // completedAt yalniz gercekten kolon degisiyorsa guncellenmeli;
        // aksi halde Done icinde reorder eden bir kart her hareketinde
        // "yeni tamamlandi" gibi gozukur ve analytics bozulur.
        if (fromColumnId !== data.toColumnId) {
          const lastCol = columns[columns.length - 1];
          if (lastCol && lastCol.id === data.toColumnId) {
            movedCard.completedAt = new Date().toISOString();
          } else {
            movedCard.completedAt = undefined;
          }
        }

        const clampedIndex = Math.min(data.newIndex, targetCol.cards.length);
        targetCol.cards.splice(clampedIndex, 0, movedCard);

        for (const col of columns) {
          col.cards.forEach((card, i) => {
            card.order = i;
          });
        }

        return { columns };
      });
    });

    socket.on("card-created", (data: { card: Card }) => {
      set((state) => ({
        columns: state.columns.map((col) => {
          if (col.id !== data.card.columnId) return col;
          // Kart zaten varsa ekleme
          if (col.cards.some((c) => c.id === data.card.id)) return col;
          return { ...col, cards: [...col.cards, data.card] };
        }),
      }));
    });

    socket.on("card-updated", (data: { cardId: string; updates: Partial<Card> }) => {
      set((state) => ({
        columns: state.columns.map((col) => ({
          ...col,
          cards: col.cards.map((card) =>
            card.id === data.cardId ? { ...card, ...data.updates } : card
          ),
        })),
      }));
    });

    socket.on("card-deleted", (data: { cardId: string }) => {
      set((state) => ({
        columns: state.columns.map((col) => ({
          ...col,
          cards: col.cards.filter((c) => c.id !== data.cardId),
        })),
      }));
    });

    socket.on("column-added", (data: { column: Column }) => {
      set((state) => {
        if (state.columns.some((c) => c.id === data.column.id)) return state;
        return { columns: [...state.columns, data.column] };
      });
    });

    socket.on("column-renamed", (data: { columnId: string; name: string }) => {
      set((state) => ({
        columns: state.columns.map((c) =>
          c.id === data.columnId ? { ...c, title: data.name } : c
        ),
      }));
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    socket.on("comment-added", (data: { cardId: string; comment: any }) => {
      set((state) => {
        const existing = state.commentsByCard[data.cardId];
        if (!existing) {
          // O karta ait hic yorum yuklenmemis; kart acildiginda loadComments
          // hepsini zaten cekecek, simdilik dokunmayalim.
          return state;
        }
        if (existing.some((c) => c.id === data.comment.id)) return state;
        return {
          commentsByCard: {
            ...state.commentsByCard,
            [data.cardId]: [...existing, data.comment],
          },
        };
      });
    });

    socket.on("column-deleted", (data: { columnId: string }) => {
      set((state) => {
        const deletedCol = state.columns.find((c) => c.id === data.columnId);
        const firstOtherCol = state.columns.find((c) => c.id !== data.columnId);
        return {
          columns: state.columns
            .filter((c) => c.id !== data.columnId)
            .map((c) => {
              if (c.id === firstOtherCol?.id && deletedCol) {
                // Tasinan kartlar yeni kolonun ID'sini ve ardisik order'lari
                // almali; aksi halde sonraki moveCard/reorder'da bozuk
                // bir state ile calisiyoruz.
                const baseOrder = c.cards.length;
                const merged = [
                  ...c.cards,
                  ...deletedCol.cards.map((card, i) => ({
                    ...card,
                    columnId: c.id,
                    order: baseOrder + i,
                  })),
                ];
                return { ...c, cards: merged };
              }
              return c;
            }),
        };
      });
    });
  },

  moveCardLocal: (cardId, toColumnId, newIndex) => {
    set((state) => {
      const columns = state.columns.map((col) => ({
        ...col,
        cards: [...col.cards],
      }));

      let movedCard: Card | undefined;
      let fromColumnId: string | undefined;
      for (const col of columns) {
        const idx = col.cards.findIndex((c) => c.id === cardId);
        if (idx !== -1) {
          movedCard = { ...col.cards[idx] };
          fromColumnId = col.id;
          col.cards.splice(idx, 1);
          break;
        }
      }

      if (!movedCard) return state;

      const targetCol = columns.find((c) => c.id === toColumnId);
      if (!targetCol) return state;

      movedCard.columnId = toColumnId;

      // completedAt'i yalniz gercekten kolon degistiginde guncelle.
      // Done icinde reorder'larda dokunmazsak orijinal tamamlanma tarihi korunur.
      if (fromColumnId !== toColumnId) {
        const lastCol = columns[columns.length - 1];
        if (lastCol && lastCol.id === toColumnId) {
          movedCard.completedAt = new Date().toISOString();
        } else {
          movedCard.completedAt = undefined;
        }
      }

      const clampedIndex = Math.min(newIndex, targetCol.cards.length);
      targetCol.cards.splice(clampedIndex, 0, movedCard);

      for (const col of columns) {
        col.cards.forEach((card, i) => {
          card.order = i;
        });
      }

      return { columns };
    });
  },

  moveCard: (cardId, toColumnId, newIndex) => {
    // Optimistic update
    get().moveCardLocal(cardId, toColumnId, newIndex);

    // Arka planda API'ye sync et + diğer client'lara bildir
    const { boardId } = get();
    if (boardId) {
      graphqlFetch(MOVE_CARD_MUTATION, { cardId, toColumnId, newIndex }).catch(
        (err: unknown) => {
          console.error("Failed to sync moveCard:", err);
          get().pushError(errMessage(err, "Failed to move card"));
        }
      );
      getSocket().emit("card-moved", { boardId, cardId, toColumnId, newIndex });
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
        description: cardData.description || null,
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
        const createdCard = data.createCard;
        set((state) => ({
          columns: state.columns.map((col) => ({
            ...col,
            cards: col.cards.map((c) =>
              c.id === tempId
                ? {
                    ...c,
                    id: createdCard.id,
                    order: createdCard.order,
                  }
                : c
            ),
          })),
        }));
        // Diğer client'lara bildir
        const { boardId } = get();
        if (boardId) {
          getSocket().emit("card-created", {
            boardId,
            card: { ...cardData, id: createdCard.id, columnId, order: createdCard.order },
          });
        }
      })
      .catch((err: unknown) => {
        console.error("Failed to create card:", err);
        get().pushError(errMessage(err, "Failed to create card"));
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

    if (cardId.startsWith("temp-")) return;

    // Yalnizca gonderilen alanlari iletelim; aksi halde undefined degerler
    // sanitize asamasinda atilip DB'de field silinmese bile network'te
    // gereksiz null'lar tasimak yerine minimal payload tercih ediliyor.
    const allowedKeys = [
      "title",
      "description",
      "labels",
      "priority",
      "dueDate",
      "storyPoints",
      "assigneeInitials",
      "assigneeColor",
    ] as const;
    const input: Record<string, unknown> = {};
    for (const key of allowedKeys) {
      const value = (updates as Record<string, unknown>)[key];
      if (value !== undefined) input[key] = value;
    }

    if (Object.keys(input).length === 0) return;

    graphqlFetch(UPDATE_CARD_MUTATION, { cardId, input }).catch(
      (err: unknown) => {
        console.error("Failed to update card:", err);
        get().pushError(errMessage(err, "Failed to update card"));
      }
    );

    const { boardId } = get();
    if (boardId) {
      getSocket().emit("card-updated", { boardId, cardId, updates: input });
    }
  },

  deleteCard: (cardId) => {
    // Save deleted card for undo
    let deletedCard: Card | undefined;
    const { columns } = get();
    for (const col of columns) {
      const card = col.cards.find((c) => c.id === cardId);
      if (card) {
        deletedCard = { ...card };
        break;
      }
    }

    // Optimistic: hemen kaldır
    set((state) => ({
      columns: state.columns.map((col) => ({
        ...col,
        cards: col.cards.filter((c) => c.id !== cardId),
      })),
      lastDeletedCard: deletedCard || null,
    }));

    // API'ye sync + diğer client'lara bildir
    if (!cardId.startsWith("temp-")) {
      graphqlFetch(DELETE_CARD_MUTATION, { cardId }).catch((err: unknown) => {
        console.error("Failed to delete card:", err);
        get().pushError(errMessage(err, "Failed to delete card"));
      });
      const { boardId } = get();
      if (boardId) {
        getSocket().emit("card-deleted", { boardId, cardId });
      }
    }
  },

  restoreCard: () => {
    const { lastDeletedCard, boardId } = get();
    if (!lastDeletedCard) return;

    // Kartin hedef kolondaki siradaki order'i hesapla ve optimistic ekle.
    set((state) => ({
      columns: state.columns.map((col) => {
        if (col.id !== lastDeletedCard.columnId) return col;
        const restored = { ...lastDeletedCard, order: col.cards.length };
        return { ...col, cards: [...col.cards, restored] };
      }),
      lastDeletedCard: null,
    }));

    // temp- prefix'li kartlar hic DB'ye yazilmamis olabilir (kullanici
    // create mutation'i donmeden sildiyse). Bu durumda server cagirmaya
    // gerek yok — lokal restore yeterli.
    if (lastDeletedCard.id.startsWith("temp-")) return;

    graphqlFetch(RESTORE_CARD_MUTATION, { cardId: lastDeletedCard.id })
      .then(() => {
        if (boardId) {
          getSocket().emit("card-created", {
            boardId,
            card: lastDeletedCard,
          });
        }
      })
      .catch((err: unknown) => {
        console.error("Failed to restore card:", err);
        get().pushError(errMessage(err, "Failed to restore card"));
      });
  },

  dismissUndo: () => set({ lastDeletedCard: null }),

  loadComments: async (cardId) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await graphqlFetch(GET_COMMENTS_QUERY, { cardId });
      set((state) => ({
        commentsByCard: {
          ...state.commentsByCard,
          [cardId]: data.comments || [],
        },
      }));
    } catch (err) {
      console.error("Failed to load comments:", err);
    }
  },

  addComment: (cardId, text) => {
    graphqlFetch(ADD_COMMENT_MUTATION, { cardId, text })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((data: any) => {
        const comment = data.addComment;
        set((state) => {
          const existing = state.commentsByCard[cardId] ?? [];
          return {
            commentsByCard: {
              ...state.commentsByCard,
              [cardId]: [...existing, comment],
            },
          };
        });
        const { boardId } = get();
        if (boardId) {
          getSocket().emit("comment-added", { boardId, cardId, comment });
        }
      })
      .catch((err: unknown) => {
        console.error("Failed to add comment:", err);
        get().pushError(errMessage(err, "Failed to add comment"));
      });
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilterPriority: (priority) => set({ filterPriority: priority }),
  setFilterLabel: (label) => set({ filterLabel: label }),
  setFilterAssignee: (assignee) => set({ filterAssignee: assignee }),
  clearFilters: () =>
    set({
      searchQuery: "",
      filterPriority: null,
      filterLabel: null,
      filterAssignee: null,
    }),

  loadMembers: async () => {
    const { boardId } = get();
    if (!boardId) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await graphqlFetch(GET_BOARD_MEMBERS_QUERY, { boardId });
      set({ members: data.boardMembers || [] });
    } catch (err) {
      console.error("Failed to load members:", err);
    }
  },

  inviteMember: async (email) => {
    const { boardId } = get();
    if (!boardId) return;
    try {
      await graphqlFetch(INVITE_MEMBER_MUTATION, { boardId, email });
      // Reload members after invite
      get().loadMembers();
    } catch (err) {
      console.error("Failed to invite member:", err);
      throw err;
    }
  },

  removeMember: (userId) => {
    const { boardId } = get();
    if (!boardId) return;
    set((state) => ({
      members: state.members.filter((m) => m.id !== userId),
    }));
    graphqlFetch(REMOVE_MEMBER_MUTATION, { boardId, userId }).catch(
      (err: unknown) => {
        console.error("Failed to remove member:", err);
        get().pushError(errMessage(err, "Failed to remove member"));
      }
    );
  },

  addColumn: (name) => {
    const { boardId } = get();
    if (!boardId) return;

    const tempId = `temp-col-${Date.now()}`;
    set((state) => ({
      columns: [...state.columns, { id: tempId, title: name, cards: [] }],
    }));

    graphqlFetch(ADD_COLUMN_MUTATION, { boardId, name })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((data: any) => {
        const col = data.addColumn;
        set((state) => ({
          columns: state.columns.map((c) =>
            c.id === tempId ? { ...c, id: col.id } : c
          ),
        }));
        getSocket().emit("column-added", { boardId, column: { id: col.id, title: name, cards: [] } });
      })
      .catch((err: unknown) => {
        console.error("Failed to add column:", err);
        get().pushError(errMessage(err, "Failed to add column"));
        set((state) => ({ columns: state.columns.filter((c) => c.id !== tempId) }));
      });
  },

  renameColumn: (columnId, name) => {
    set((state) => ({
      columns: state.columns.map((c) =>
        c.id === columnId ? { ...c, title: name } : c
      ),
    }));

    graphqlFetch(RENAME_COLUMN_MUTATION, { columnId, name }).catch(
      (err: unknown) => {
        console.error("Failed to rename column:", err);
        get().pushError(errMessage(err, "Failed to rename column"));
      }
    );
    const { boardId } = get();
    if (boardId) {
      getSocket().emit("column-renamed", { boardId, columnId, name });
    }
  },

  loadSprints: async () => {
    const { boardId } = get();
    if (!boardId) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await graphqlFetch(GET_SPRINTS_QUERY, { boardId });
      set({
        sprints: data.sprints || [],
        activeSprint: data.activeSprint || null,
      });
    } catch (err) {
      console.error("Failed to load sprints:", err);
    }
  },

  createSprint: async (name, startDate, endDate) => {
    const { boardId } = get();
    if (!boardId) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await graphqlFetch(CREATE_SPRINT_MUTATION, {
        boardId,
        name,
        startDate,
        endDate,
      });
      const sprint = data.createSprint;
      set((state) => ({
        activeSprint: sprint,
        sprints: [sprint, ...state.sprints.map((s) => ({ ...s, isActive: false }))],
      }));
    } catch (err) {
      console.error("Failed to create sprint:", err);
      get().pushError(errMessage(err, "Failed to create sprint"));
      // Navbar'daki caller try/catch ile tutup dialog'u acik birakabilsin.
      throw err;
    }
  },

  completeSprint: async (sprintId) => {
    try {
      await graphqlFetch(COMPLETE_SPRINT_MUTATION, { sprintId });
      set((state) => ({
        activeSprint: null,
        sprints: state.sprints.map((s) =>
          s.id === sprintId ? { ...s, isActive: false } : s
        ),
      }));
    } catch (err) {
      console.error("Failed to complete sprint:", err);
      get().pushError(errMessage(err, "Failed to complete sprint"));
    }
  },

  deleteColumn: (columnId) => {
    const { boardId, columns } = get();
    if (columns.length <= 1) return; // Don't allow deleting last column

    const deletedCol = columns.find((c) => c.id === columnId);
    const firstOtherCol = columns.find((c) => c.id !== columnId);

    // Move cards to first other column — tasinirken columnId ve order'larini
    // dogru sekilde guncellemek sart; aksi halde sonraki drag-drop sirasinda
    // eski columnId ile moveCard mutation gonderilir.
    set((state) => ({
      columns: state.columns
        .filter((c) => c.id !== columnId)
        .map((c) => {
          if (c.id === firstOtherCol?.id && deletedCol) {
            const baseOrder = c.cards.length;
            const merged = [
              ...c.cards,
              ...deletedCol.cards.map((card, i) => ({
                ...card,
                columnId: c.id,
                order: baseOrder + i,
              })),
            ];
            return { ...c, cards: merged };
          }
          return c;
        }),
    }));

    graphqlFetch(DELETE_COLUMN_MUTATION, { columnId }).catch(
      (err: unknown) => {
        console.error("Failed to delete column:", err);
        get().pushError(errMessage(err, "Failed to delete column"));
      }
    );
    if (boardId) {
      getSocket().emit("column-deleted", { boardId, columnId });
    }
  },

  toggleDarkMode: () =>
    set((state) => {
      const newDarkMode = !state.darkMode;
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("dark", newDarkMode);
        localStorage.setItem("flowboard-dark", String(newDarkMode));
      }
      return { darkMode: newDarkMode };
    }),
  setActiveView: (view) => set({ activeView: view }),

  loadBoards: async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await graphqlFetch(GET_BOARDS_LIST_QUERY);
      const boards = (data.boards ?? []) as { id: string; name: string }[];
      set({ boards });
      return boards;
    } catch (err) {
      console.error("Failed to load boards:", err);
      get().pushError(errMessage(err, "Failed to load boards"));
      return [];
    }
  },

  createBoard: async (name: string) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await graphqlFetch(CREATE_BOARD_MUTATION, { name });
      const board = data.createBoard as { id: string; name: string };
      set((state) => ({ boards: [...state.boards, board] }));
      return board;
    } catch (err) {
      console.error("Failed to create board:", err);
      get().pushError(errMessage(err, "Failed to create board"));
      throw err;
    }
  },

  switchBoard: async (newBoardId: string) => {
    const { boardId: oldBoardId } = get();
    if (oldBoardId === newBoardId) return;

    // Eski board odasindan cik; yeni board icin join-board yeniden emit edilir.
    try {
      const socket = getSocket();
      if (oldBoardId && socket.connected) {
        socket.emit("leave-board", oldBoardId);
      }
    } catch {
      // Socket initialize olmamis olabilir; sessizce gec.
    }

    // Eski board'a ozgu transient state'i temizle.
    set({
      columns: [],
      members: [],
      sprints: [],
      activeSprint: null,
      commentsByCard: {},
      lastDeletedCard: null,
      searchQuery: "",
      filterPriority: null,
      filterLabel: null,
      filterAssignee: null,
    });

    await get().loadBoard(newBoardId);

    // Yeni board'a socket join'i: initSocket daha once cagrilmissa
    // ayni socket uzerinde join-board emit edelim.
    try {
      const socket = getSocket();
      if (socket.connected) socket.emit("join-board", newBoardId);
    } catch {
      // Ignore; initSocket sonraki cagrilarda halleder.
    }

    // Yeni board'un metadatalari.
    get().loadMembers();
    get().loadSprints();

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("flowboard-last-board", newBoardId);
      } catch {
        // Storage quota etc; onemli degil.
      }
    }
  },
}));
