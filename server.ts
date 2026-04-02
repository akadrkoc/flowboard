import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = parseInt(process.env.PORT || "3000", 10);

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer(httpServer, {
    path: "/socket.io",
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Board odasına katıl
    socket.on("join-board", (boardId: string) => {
      socket.join(`board:${boardId}`);
      console.log(`[Socket.io] ${socket.id} joined board:${boardId}`);
    });

    // Kart taşındı
    socket.on("card-moved", (data: { boardId: string; cardId: string; toColumnId: string; newIndex: number }) => {
      // Gönderen dışındaki herkese bildir
      socket.to(`board:${data.boardId}`).emit("card-moved", data);
    });

    // Kart eklendi
    socket.on("card-created", (data: { boardId: string; card: unknown }) => {
      socket.to(`board:${data.boardId}`).emit("card-created", data);
    });

    // Kart güncellendi
    socket.on("card-updated", (data: { boardId: string; cardId: string; updates: unknown }) => {
      socket.to(`board:${data.boardId}`).emit("card-updated", data);
    });

    // Kart silindi
    socket.on("card-deleted", (data: { boardId: string; cardId: string }) => {
      socket.to(`board:${data.boardId}`).emit("card-deleted", data);
    });

    socket.on("disconnect", () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  httpServer.listen(PORT, () => {
    console.log(`> Server ready on http://localhost:${PORT}`);
  });
});
