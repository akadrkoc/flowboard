import type { Server } from "socket.io";

let io: Server | null = null;

export function setRealtimeServer(server: Server): void {
  io = server;
}

/** Broadcast to all clients in a board room (after a successful GraphQL mutation). */
export function broadcastToBoard(
  boardId: string,
  event: string,
  data: Record<string, unknown>
): void {
  if (!io) return;
  io.to(`board:${boardId}`).emit(event, data);
}
