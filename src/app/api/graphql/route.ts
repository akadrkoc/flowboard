import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { typeDefs } from "@/graphql/typeDefs";
import { resolvers } from "@/graphql/resolvers";
import { authOptions } from "@/lib/auth";
import { rateLimit, sweepExpired } from "@/lib/rateLimit";

export interface GraphQLContext {
  userId: string | null;
}

const server = new ApolloServer<GraphQLContext>({
  typeDefs,
  resolvers,
  includeStacktraceInErrorResponses: process.env.NODE_ENV !== "production",
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const apolloHandler = startServerAndCreateNextHandler<NextRequest>(server as any, {
  context: async (): Promise<GraphQLContext> => {
    const session = await getServerSession(authOptions);
    const userId =
      (session?.user as Record<string, unknown> | undefined)?.id as
        | string
        | null ?? null;
    return { userId };
  },
});

const GRAPHQL_LIMIT = parseInt(process.env.GRAPHQL_RATE_LIMIT || "120", 10);
const GRAPHQL_WINDOW_MS = 60_000;

function clientKey(req: NextRequest, userId: string | null): string {
  if (userId) return `u:${userId}`;
  const fwd = req.headers.get("x-forwarded-for");
  const ip = fwd ? fwd.split(",")[0].trim() : req.headers.get("x-real-ip") || "anon";
  return `ip:${ip}`;
}

async function handler(req: NextRequest) {
  sweepExpired();

  // Auth bilinmeden bucket'i secemedigimiz icin oturumu burada bir kez cozuyoruz.
  // Cozumlenen userId'yi Apollo context'i ayrica kendi icinde tekrar cozecek;
  // duplicate cost kabul edilebilir seviyede (tek getServerSession cagrisi).
  const session = await getServerSession(authOptions);
  const userId =
    (session?.user as Record<string, unknown> | undefined)?.id as
      | string
      | null ?? null;

  const key = clientKey(req, userId);
  const result = rateLimit(key, {
    limit: GRAPHQL_LIMIT,
    windowMs: GRAPHQL_WINDOW_MS,
  });

  if (!result.ok) {
    const retryAfterSec = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
    return NextResponse.json(
      {
        errors: [
          {
            message: "Too many requests",
            extensions: { code: "RATE_LIMITED" },
          },
        ],
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSec),
          "X-RateLimit-Limit": String(GRAPHQL_LIMIT),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
        },
      }
    );
  }

  return apolloHandler(req);
}

export { handler as GET, handler as POST };
