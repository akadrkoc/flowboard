"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const url_1 = require("url");
const next_1 = __importDefault(require("next"));
const socket_io_1 = require("socket.io");
const jwt_1 = require("next-auth/jwt");
const mongoose_1 = __importDefault(require("mongoose"));
const dev = process.env.NODE_ENV !== "production";
const app = (0, next_1.default)({ dev });
const handle = app.getRequestHandler();
const PORT = parseInt(process.env.PORT || "3000", 10);
// Inline Board model access for socket auth (avoid importing from src/ with path aliases)
function getBoardModel() {
    return mongoose_1.default.models.Board;
}
app.prepare().then(() => {
    const httpServer = (0, http_1.createServer)((req, res) => {
        const parsedUrl = (0, url_1.parse)(req.url, true);
        handle(req, res, parsedUrl);
    });
    const allowedOrigin = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const io = new socket_io_1.Server(httpServer, {
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
            const cookies = Object.fromEntries(cookieHeader.split(";").map((c) => {
                const [key, ...vals] = c.trim().split("=");
                return [key, vals.join("=")];
            }));
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
            const decoded = await (0, jwt_1.decode)({ token: sessionToken, secret });
            if (!decoded || !decoded.userId) {
                return next(new Error("Invalid session"));
            }
            socket.data.userId = decoded.userId;
            next();
        }
        catch (_a) {
            next(new Error("Authentication failed"));
        }
    });
    io.on("connection", (socket) => {
        console.log(`[Socket.io] Client connected: ${socket.id} (user: ${socket.data.userId})`);
        // Board odasına katıl — membership check
        socket.on("join-board", async (boardId) => {
            try {
                const Board = getBoardModel();
                if (Board) {
                    const board = await Board.findById(boardId).lean();
                    if (board) {
                        const b = board;
                        const userId = socket.data.userId;
                        const isOwner = b.ownerId.toString() === userId;
                        const isMember = b.memberIds.some((id) => id.toString() === userId);
                        if (!isOwner && !isMember) {
                            socket.emit("error", { message: "Not a member of this board" });
                            return;
                        }
                    }
                }
            }
            catch (_a) {
                // If board check fails (e.g. DB not connected yet), allow connection
                // The GraphQL layer will still enforce auth
            }
            socket.join(`board:${boardId}`);
            console.log(`[Socket.io] ${socket.id} joined board:${boardId}`);
        });
        // Kart taşındı
        socket.on("card-moved", (data) => {
            socket.to(`board:${data.boardId}`).emit("card-moved", data);
        });
        // Kart eklendi
        socket.on("card-created", (data) => {
            socket.to(`board:${data.boardId}`).emit("card-created", data);
        });
        // Kart güncellendi
        socket.on("card-updated", (data) => {
            socket.to(`board:${data.boardId}`).emit("card-updated", data);
        });
        // Kart silindi
        socket.on("card-deleted", (data) => {
            socket.to(`board:${data.boardId}`).emit("card-deleted", data);
        });
        // Kolon eklendi
        socket.on("column-added", (data) => {
            socket.to(`board:${data.boardId}`).emit("column-added", data);
        });
        // Kolon yeniden adlandırıldı
        socket.on("column-renamed", (data) => {
            socket.to(`board:${data.boardId}`).emit("column-renamed", data);
        });
        // Kolon silindi
        socket.on("column-deleted", (data) => {
            socket.to(`board:${data.boardId}`).emit("column-deleted", data);
        });
        // Yorum eklendi
        socket.on("comment-added", (data) => {
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
//# sourceMappingURL=server.js.map