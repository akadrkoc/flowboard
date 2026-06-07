import { create } from "zustand";
import type { Card } from "@/types/board";
import { graphqlFetch } from "@/lib/graphqlFetch";
import { getSocket } from "@/lib/socket";
import type { BoardState } from "./boardTypes";
import {
  ADD_COLUMN_MUTATION,
  ADD_COMMENT_MUTATION,
  ADD_SUBTASK_MUTATION,
  COMPLETE_SPRINT_MUTATION,
  CREATE_BOARD_MUTATION,
  CREATE_CARD_MUTATION,
  CREATE_SPRINT_MUTATION,
  DELETE_CARD_MUTATION,
  DELETE_COLUMN_MUTATION,
  DELETE_SUBTASK_MUTATION,
  GET_ACTIVITY_FEED_QUERY,
  GET_BOARD_MEMBERS_QUERY,
  GET_BOARD_QUERY,
  GET_BOARDS_LIST_QUERY,
  GET_COMMENTS_QUERY,
  GET_SUBTASKS_QUERY,
  GET_SPRINTS_QUERY,
  INVITE_MEMBER_MUTATION,
  MOVE_CARD_MUTATION,
  REMOVE_MEMBER_MUTATION,
  RENAME_COLUMN_MUTATION,
  RESTORE_CARD_MUTATION,
  TOGGLE_SUBTASK_MUTATION,
  UPDATE_CARD_MUTATION,
} from "./queries";
import {
  applyCardMove,
  errMessage,
  mapApiColumns,
  mergeColumnOnDelete,
} from "./helpers";
import { attachBoardSocketListeners } from "./socketListeners";
import { VIEW_STORAGE_KEY } from "@/types/views";
import type { BoardView } from "@/types/views";

export type { BoardState } from "./boardTypes";

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
  activityFeedByCard: {},
  subtasksByCard: {},
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
          columns: mapApiColumns(data.board.columns),
        });
      }
    } catch (error) {
      console.error("Failed to load board:", error);
      get().pushError(errMessage(error, "Failed to load board"));
    } finally {
      set({ loading: false });
    }
  },

  initSocket: () => {
    const { boardId } = get();
    if (!boardId) return;
    attachBoardSocketListeners(getSocket(), get, set);
  },

  moveCardLocal: (cardId, toColumnId, newIndex) => {
    set((state) => {
      const columns = applyCardMove(
        state.columns,
        cardId,
        toColumnId,
        newIndex
      );
      return columns ? { columns } : state;
    });
  },

  moveCard: (cardId, toColumnId, newIndex) => {
    get().moveCardLocal(cardId, toColumnId, newIndex);

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

    graphqlFetch(CREATE_CARD_MUTATION, {
      columnId,
      input: {
        title: cardData.title,
        description: cardData.description || null,
        labels: cardData.labels,
        priority: cardData.priority,
        dueDate: cardData.dueDate || null,
        storyPoints: cardData.storyPoints,
        assigneeId: cardData.assigneeId ?? null,
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
                ? { ...c, id: createdCard.id, order: createdCard.order }
                : c
            ),
          })),
        }));
        const { boardId } = get();
        if (boardId) {
          getSocket().emit("card-created", {
            boardId,
            card: {
              ...cardData,
              id: createdCard.id,
              columnId,
              order: createdCard.order,
            },
          });
        }
      })
      .catch((err: unknown) => {
        console.error("Failed to create card:", err);
        get().pushError(errMessage(err, "Failed to create card"));
        set((state) => ({
          columns: state.columns.map((col) => ({
            ...col,
            cards: col.cards.filter((c) => c.id !== tempId),
          })),
        }));
      });
  },

  updateCard: (cardId, updates) => {
    set((state) => ({
      columns: state.columns.map((col) => ({
        ...col,
        cards: col.cards.map((card) =>
          card.id === cardId ? { ...card, ...updates } : card
        ),
      })),
    }));

    if (cardId.startsWith("temp-")) return Promise.resolve();

    const allowedKeys = [
      "title",
      "description",
      "labels",
      "priority",
      "dueDate",
      "storyPoints",
      "assigneeId",
      "assigneeInitials",
      "assigneeColor",
    ] as const;
    const input: Record<string, unknown> = {};
    for (const key of allowedKeys) {
      const value = (updates as Record<string, unknown>)[key];
      if (value !== undefined) input[key] = value;
    }

    if (Object.keys(input).length === 0) return Promise.resolve();

    const mutation = graphqlFetch(UPDATE_CARD_MUTATION, { cardId, input }).catch(
      (err: unknown) => {
        console.error("Failed to update card:", err);
        get().pushError(errMessage(err, "Failed to update card"));
        throw err;
      }
    );

    const { boardId } = get();
    if (boardId) {
      getSocket().emit("card-updated", { boardId, cardId, updates: input });
    }

    return mutation.then(() => undefined);
  },

  deleteCard: (cardId) => {
    let deletedCard: Card | undefined;
    const { columns } = get();
    for (const col of columns) {
      const card = col.cards.find((c) => c.id === cardId);
      if (card) {
        deletedCard = { ...card };
        break;
      }
    }

    set((state) => ({
      columns: state.columns.map((col) => ({
        ...col,
        cards: col.cards.filter((c) => c.id !== cardId),
      })),
      lastDeletedCard: deletedCard || null,
    }));

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

    set((state) => ({
      columns: state.columns.map((col) => {
        if (col.id !== lastDeletedCard.columnId) return col;
        const restored = { ...lastDeletedCard, order: col.cards.length };
        return { ...col, cards: [...col.cards, restored] };
      }),
      lastDeletedCard: null,
    }));

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
      get().pushError(errMessage(err, "Failed to load comments"));
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
        get().loadActivityFeed(cardId);
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

  loadActivityFeed: async (cardId) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await graphqlFetch(GET_ACTIVITY_FEED_QUERY, { cardId });
      set((state) => ({
        activityFeedByCard: {
          ...state.activityFeedByCard,
          [cardId]: data.activityFeed || [],
        },
      }));
    } catch (err) {
      console.error("Failed to load activity feed:", err);
      get().pushError(errMessage(err, "Failed to load activity"));
    }
  },

  loadSubtasks: async (cardId) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await graphqlFetch(GET_SUBTASKS_QUERY, { cardId });
      set((state) => ({
        subtasksByCard: {
          ...state.subtasksByCard,
          [cardId]: data.subtasks || [],
        },
      }));
    } catch (err) {
      console.error("Failed to load subtasks:", err);
      get().pushError(errMessage(err, "Failed to load subtasks"));
    }
  },

  addSubtask: async (cardId, title) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await graphqlFetch(ADD_SUBTASK_MUTATION, {
        cardId,
        title,
      });
      const subtask = data.addSubtask;
      set((state) => ({
        subtasksByCard: {
          ...state.subtasksByCard,
          [cardId]: [...(state.subtasksByCard[cardId] ?? []), subtask],
        },
      }));
      get().loadActivityFeed(cardId);
    } catch (err) {
      console.error("Failed to add subtask:", err);
      get().pushError(errMessage(err, "Failed to add subtask"));
      throw err;
    }
  },

  toggleSubtask: async (subtaskId, cardId) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await graphqlFetch(TOGGLE_SUBTASK_MUTATION, { subtaskId });
      const updated = data.toggleSubtask;
      set((state) => ({
        subtasksByCard: {
          ...state.subtasksByCard,
          [cardId]: (state.subtasksByCard[cardId] ?? []).map((s) =>
            s.id === subtaskId ? { ...s, completed: updated.completed } : s
          ),
        },
      }));
      get().loadActivityFeed(cardId);
    } catch (err) {
      console.error("Failed to toggle subtask:", err);
      get().pushError(errMessage(err, "Failed to update subtask"));
    }
  },

  deleteSubtask: async (subtaskId, cardId) => {
    try {
      await graphqlFetch(DELETE_SUBTASK_MUTATION, { subtaskId });
      set((state) => ({
        subtasksByCard: {
          ...state.subtasksByCard,
          [cardId]: (state.subtasksByCard[cardId] ?? []).filter(
            (s) => s.id !== subtaskId
          ),
        },
      }));
    } catch (err) {
      console.error("Failed to delete subtask:", err);
      get().pushError(errMessage(err, "Failed to delete subtask"));
    }
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
      get().pushError(errMessage(err, "Failed to load members"));
    }
  },

  inviteMember: async (email) => {
    const { boardId } = get();
    if (!boardId) return;
    try {
      await graphqlFetch(INVITE_MEMBER_MUTATION, { boardId, email });
      get().loadMembers();
    } catch (err) {
      console.error("Failed to invite member:", err);
      get().pushError(errMessage(err, "Failed to invite member"));
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
        getSocket().emit("column-added", {
          boardId,
          column: { id: col.id, title: name, cards: [] },
        });
      })
      .catch((err: unknown) => {
        console.error("Failed to add column:", err);
        get().pushError(errMessage(err, "Failed to add column"));
        set((state) => ({
          columns: state.columns.filter((c) => c.id !== tempId),
        }));
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
      get().pushError(errMessage(err, "Failed to load sprints"));
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
        sprints: [
          sprint,
          ...state.sprints.map((s) => ({ ...s, isActive: false })),
        ],
      }));
    } catch (err) {
      console.error("Failed to create sprint:", err);
      get().pushError(errMessage(err, "Failed to create sprint"));
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
    if (columns.length <= 1) return;

    set((state) => ({
      columns: mergeColumnOnDelete(state.columns, columnId),
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
  setActiveView: (view: BoardView) => {
    set({ activeView: view });
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(VIEW_STORAGE_KEY, view);
      } catch {
        // Ignore storage errors.
      }
    }
  },

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

    try {
      const socket = getSocket();
      if (oldBoardId && socket.connected) {
        socket.emit("leave-board", oldBoardId);
      }
    } catch {
      // Socket not initialized yet.
    }

    set({
      loading: true,
      columns: [],
      members: [],
      sprints: [],
      activeSprint: null,
      commentsByCard: {},
      activityFeedByCard: {},
      subtasksByCard: {},
      lastDeletedCard: null,
      searchQuery: "",
      filterPriority: null,
      filterLabel: null,
      filterAssignee: null,
    });

    await get().loadBoard(newBoardId);

    try {
      const socket = getSocket();
      if (socket.connected) socket.emit("join-board", newBoardId);
    } catch {
      // initSocket handles subsequent joins.
    }

    get().loadMembers();
    get().loadSprints();

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("flowboard-last-board", newBoardId);
      } catch {
        // Storage quota etc.
      }
    }
  },
}));
