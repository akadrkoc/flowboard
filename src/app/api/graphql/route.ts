import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { typeDefs } from "@/graphql/typeDefs";
import { resolvers } from "@/graphql/resolvers";
import { authOptions } from "@/lib/auth";

export interface GraphQLContext {
  userId: string | null;
}

const server = new ApolloServer<GraphQLContext>({
  typeDefs,
  resolvers,
});

const handler = startServerAndCreateNextHandler<NextRequest>(server, {
  context: async (): Promise<GraphQLContext> => {
    const session = await getServerSession(authOptions);
    const userId =
      (session?.user as Record<string, unknown> | undefined)?.id as
        | string
        | null ?? null;
    return { userId };
  },
});

export { handler as GET, handler as POST };
