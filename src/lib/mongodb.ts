import mongoose from "mongoose";
import { validateEnv } from "./env";

// Cache the connection across hot reloads in development
const cached = (global as Record<string, unknown>).__mongoose as
  | { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }
  | undefined;

const mongoCache = cached ?? { conn: null, promise: null };
(global as Record<string, unknown>).__mongoose = mongoCache;

export async function connectDB() {
  validateEnv();
  const uri = process.env.MONGODB_URI!;

  if (mongoCache.conn) return mongoCache.conn;

  if (!mongoCache.promise) {
    mongoCache.promise = mongoose.connect(uri);
  }

  mongoCache.conn = await mongoCache.promise;
  return mongoCache.conn;
}
