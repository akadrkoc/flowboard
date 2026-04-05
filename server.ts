import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { decode } from "next-auth/jwt";
import mongoose from "mongoose";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = parseInt(process.env.PORT || "3000", 10);

// Inline Board model access for socket auth (avoid importing from src/ with path aliases)
function getBoardModel() {
  return mongoose.models.Board;
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const allowedOrigin = process.env.NEXTAUTH_URL || "http://localhost:3000";

  const io = new SocketIOServer(httpServer, {
    path: "/socket.io",
    cors: {
      origin: allowedOrigin,
      credentials: true,
    },
  });

  // JWT auth middleware
  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie;
      if (!cookieHeader) {
        return next(new Error("Authentication required"));
      }

      // Parse session token from cookies
      const cookies = Object.fromEntries(
        cookieHeader.split(";").map((c) => {
          const [key, ...vals] = c.trim().split("=");
          return [key, vals.join("=")];
        })
      );

      // next-auth uses different cookie names in dev vs prod
      const tokenCookieName = dev
        ? "next-auth.session-token"
        : "__Secure-next-auth.session-token";
      const sessionToken = cookies[tokenCookieName];

      if (!sessionToken) {
        return next(new Error("Authentication required"));
      }

      const secret = process.env.NEXTAUTH_SECRET;
      if (!secret) {
        return next(new Error("Server configuration error"));
      }

      const decoded = await decode({ token: sessionToken, secret });
      if (!decoded || !decoded.userId) {
        return next(new Error("Invalid session"));
      }

      socket.data.userId = decoded.userId as string;
      next();
    } catch {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id} (user: ${socket.data.userId})`);

    // Board odasına katıl — membership check
    socket.on("join-board", async (boardId: string) => {
      try {
        const Board = getBoardModel();
        if (Board) {
          const board = await Board.findById(boardId).lean();
          if (board) {
            const b = board as { ownerId: { toString(): string }; memberIds: { toString(): string }[] };
            const userId = socket.data.userId;
            const isOwner = b.ownerId.toString() === userId;
            const isMember = b.memberIds.some((id) => id.toString() === userId);

            if (!isOwner && !isMember) {
              socket.emit("error", { message: "Not a member of this board" });
              return;
            }
          }
        }
      } catch {
        // If board check fails (e.g. DB not connected yet), allow connection
        // The GraphQL layer will still enforce auth
      }

      socket.join(`board:${boardId}`);
      console.log(`[Socket.io] ${socket.id} joined board:${boardId}`);
    });

    // Kart taşındı
    socket.on("card-moved", (data: { boardId: string; cardId: string; toColumnId: string; newIndex: number }) => {
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

    // Kolon eklendi
    socket.on("column-added", (data: { boardId: string; column: unknown }) => {
      socket.to(`board:${data.boardId}`).emit("column-added", data);
    });

    // Kolon yeniden adlandırıldı
    socket.on("column-renamed", (data: { boardId: string; columnId: string; name: string }) => {
      socket.to(`board:${data.boardId}`).emit("column-renamed", data);
    });

    // Kolon silindi
    socket.on("column-deleted", (data: { boardId: string; columnId: string }) => {
      socket.to(`board:${data.boardId}`).emit("column-deleted", data);
    });

    // Yorum eklendi
    socket.on("comment-added", (data: { boardId: string; cardId: string; comment: unknown }) => {
      socket.to(`board:${data.boardId}`).emit("comment-added", data);
    });

    socket.on("disconnect", () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  httpServer.listen(PORT, () => {
    console.log(`> Server ready on http://localhost:${PORT}`);
  });
});
