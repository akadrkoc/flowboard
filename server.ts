import { loadEnvConfig } from "@next/env";
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer, Socket } from "socket.io";
import { decode } from "next-auth/jwt";
import mongoose from "mongoose";
import { validateEnv } from "./src/lib/env";
import { connectDB } from "./src/lib/mongodb";
import { Board } from "./src/models/Board";
import { rateLimit, sweepExpired } from "./src/lib/rateLimit";

// ts-node does not load .env.local automatically; Next.js does this on app.prepare().
loadEnvConfig(process.cwd());
validateEnv();

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = parseInt(process.env.PORT || "3000", 10);

async function isBoardMember(
  userId: string,
  boardId: string
): Promise<boolean> {
  if (!mongoose.isValidObjectId(boardId)) return false;

  const board = await Board.findById(boardId).lean();
  if (!board) return false;

  const isOwner = board.ownerId.toString() === userId;
  const isMember = board.memberIds.some((id: { toString(): string }) =>
    id.toString() === userId
  );
  return isOwner || isMember;
}

function isInBoardRoom(socket: Socket, boardId: string): boolean {
  return socket.rooms.has(`board:${boardId}`);
}

app.prepare().then(async () => {
  try {
    await connectDB();
    console.log("> MongoDB connected");
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  }

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

  // Connection-level rate limit: bir IP dakikada en fazla N connect denemesi yapabilir.
  io.use((socket, next) => {
    sweepExpired();
    const fwd = socket.handshake.headers["x-forwarded-for"];
    const ip =
      (Array.isArray(fwd) ? fwd[0] : fwd?.split(",")[0])?.trim() ||
      socket.handshake.address ||
      "anon";
    const r = rateLimit(`ws-conn:${ip}`, { limit: 30, windowMs: 60_000 });
    if (!r.ok) {
      return next(new Error("Too many connection attempts"));
    }
    next();
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

  // Her socket icin event-level sliding window (userId + event ismi bazli).
  function withEventRateLimit<T>(
    socket: Socket,
    event: string,
    handler: (data: T) => void,
    limit = 120
  ) {
    return (data: T) => {
      const userId = socket.data.userId || socket.id;
      const r = rateLimit(`ws-evt:${userId}:${event}`, {
        limit,
        windowMs: 60_000,
      });
      if (!r.ok) {
        socket.emit("error", { message: `Rate limit exceeded for ${event}` });
        return;
      }
      handler(data);
    };
  }

  // Broadcast handler: only forward if emitter is in the board room.
  function withBoardBroadcast<T extends { boardId: string }>(
    socket: Socket,
    event: string,
    handler: (data: T) => void,
    limit?: number
  ) {
    return withEventRateLimit<T>(socket, event, (data) => {
      if (!data?.boardId || !mongoose.isValidObjectId(data.boardId)) {
        socket.emit("error", { message: "Invalid board ID" });
        return;
      }
      if (!isInBoardRoom(socket, data.boardId)) {
        socket.emit("error", { message: "Not authorized for this board" });
        return;
      }
      handler(data);
    }, limit);
  }

  io.on("connection", (socket) => {
    console.log(
      `[Socket.io] Client connected: ${socket.id} (user: ${socket.data.userId})`
    );

    // Board odasina katil — fail-closed membership check
    socket.on(
      "join-board",
      withEventRateLimit<string>(socket, "join-board", async (boardId) => {
        if (!boardId || !mongoose.isValidObjectId(boardId)) {
          socket.emit("error", { message: "Invalid board ID" });
          return;
        }

        try {
          const userId = socket.data.userId as string;
          const allowed = await isBoardMember(userId, boardId);
          if (!allowed) {
            socket.emit("error", { message: "Not a member of this board" });
            return;
          }
        } catch (err) {
          console.error("[Socket.io] join-board membership check failed:", err);
          socket.emit("error", { message: "Unable to join board" });
          return;
        }

        socket.join(`board:${boardId}`);
        console.log(`[Socket.io] ${socket.id} joined board:${boardId}`);
      })
    );

    socket.on(
      "leave-board",
      withEventRateLimit<string>(socket, "leave-board", (boardId) => {
        if (!boardId || !mongoose.isValidObjectId(boardId)) return;
        socket.leave(`board:${boardId}`);
        console.log(`[Socket.io] ${socket.id} left board:${boardId}`);
      })
    );

    socket.on(
      "card-moved",
      withBoardBroadcast<{
        boardId: string;
        cardId: string;
        toColumnId: string;
        newIndex: number;
      }>(socket, "card-moved", (data) => {
        socket.to(`board:${data.boardId}`).emit("card-moved", data);
      }, 240)
    );

    socket.on(
      "card-created",
      withBoardBroadcast<{ boardId: string; card: unknown }>(
        socket,
        "card-created",
        (data) => {
          socket.to(`board:${data.boardId}`).emit("card-created", data);
        }
      )
    );

    socket.on(
      "card-updated",
      withBoardBroadcast<{
        boardId: string;
        cardId: string;
        updates: unknown;
      }>(socket, "card-updated", (data) => {
        socket.to(`board:${data.boardId}`).emit("card-updated", data);
      }, 240)
    );

    socket.on(
      "card-deleted",
      withBoardBroadcast<{ boardId: string; cardId: string }>(
        socket,
        "card-deleted",
        (data) => {
          socket.to(`board:${data.boardId}`).emit("card-deleted", data);
        }
      )
    );

    socket.on(
      "column-added",
      withBoardBroadcast<{ boardId: string; column: unknown }>(
        socket,
        "column-added",
        (data) => {
          socket.to(`board:${data.boardId}`).emit("column-added", data);
        }
      )
    );

    socket.on(
      "column-renamed",
      withBoardBroadcast<{
        boardId: string;
        columnId: string;
        name: string;
      }>(socket, "column-renamed", (data) => {
        socket.to(`board:${data.boardId}`).emit("column-renamed", data);
      })
    );

    socket.on(
      "column-deleted",
      withBoardBroadcast<{ boardId: string; columnId: string }>(
        socket,
        "column-deleted",
        (data) => {
          socket.to(`board:${data.boardId}`).emit("column-deleted", data);
        }
      )
    );

    socket.on(
      "comment-added",
      withBoardBroadcast<{
        boardId: string;
        cardId: string;
        comment: unknown;
      }>(socket, "comment-added", (data) => {
        socket.to(`board:${data.boardId}`).emit("comment-added", data);
      })
    );

    socket.on("disconnect", () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  httpServer.listen(PORT, () => {
    console.log(`> Server ready on http://localhost:${PORT}`);
  });
});
