"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const url_1 = require("url");
const next_1 = __importDefault(require("next"));
const socket_io_1 = require("socket.io");
const dev = process.env.NODE_ENV !== "production";
const app = (0, next_1.default)({ dev });
const handle = app.getRequestHandler();
const PORT = parseInt(process.env.PORT || "3000", 10);
app.prepare().then(() => {
    const httpServer = (0, http_1.createServer)((req, res) => {
        const parsedUrl = (0, url_1.parse)(req.url, true);
        handle(req, res, parsedUrl);
    });
    const io = new socket_io_1.Server(httpServer, {
        path: "/socket.io",
        cors: { origin: "*" },
    });
    io.on("connection", (socket) => {
        console.log(`[Socket.io] Client connected: ${socket.id}`);
        // Board odasına katıl
        socket.on("join-board", (boardId) => {
            socket.join(`board:${boardId}`);
            console.log(`[Socket.io] ${socket.id} joined board:${boardId}`);
        });
        // Kart taşındı
        socket.on("card-moved", (data) => {
            // Gönderen dışındaki herkese bildir
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