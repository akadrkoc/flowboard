import type { Socket } from "socket.io-client";
import type { StoreApi } from "zustand";
import type { Card, Column } from "@/types/board";
import type { BoardState } from "./boardTypes";
import { applyCardMove, mergeColumnOnDelete } from "./helpers";

type SetState = StoreApi<BoardState>["setState"];
type GetState = StoreApi<BoardState>["getState"];

export function attachBoardSocketListeners(
  socket: Socket,
  get: GetState,
  set: SetState
): void {
  socket.on("error", (data: { message?: string }) => {
    if (data?.message) get().pushError(data.message);
  });

  const joinBoard = () => {
    const currentBoardId = get().boardId;
    if (currentBoardId) socket.emit("join-board", currentBoardId);
  };
  socket.on("connect", joinBoard);
  if (socket.connected) joinBoard();

  socket.on(
    "card-moved",
    (data: { cardId: string; toColumnId: string; newIndex: number }) => {
      set((state) => {
        const columns = applyCardMove(
          state.columns,
          data.cardId,
          data.toColumnId,
          data.newIndex
        );
        return columns ? { columns } : state;
      });
    }
  );

  socket.on("card-created", (data: { card: Card }) => {
    set((state) => ({
      columns: state.columns.map((col) => {
        if (col.id !== data.card.columnId) return col;
        if (col.cards.some((c) => c.id === data.card.id)) return col;
        return { ...col, cards: [...col.cards, data.card] };
      }),
    }));
  });

  socket.on(
    "card-updated",
    (data: { cardId: string; updates: Partial<Card> }) => {
      set((state) => ({
        columns: state.columns.map((col) => ({
          ...col,
          cards: col.cards.map((card) =>
            card.id === data.cardId ? { ...card, ...data.updates } : card
          ),
        })),
      }));
    }
  );

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
      if (!existing) return state;
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
    set((state) => ({
      columns: mergeColumnOnDelete(state.columns, data.columnId),
    }));
  });
}
