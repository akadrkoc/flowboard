import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

function createApolloClient() {
  return new ApolloClient({
    link: new HttpLink({
      uri: "/api/graphql",
    }),
    cache: new InMemoryCache(),
  });
}

// Singleton client for client-side usage
let client: ApolloClient<unknown> | null = null;

export function getApolloClient() {
  if (typeof window === "undefined") {
    // Server-side: always create a new client
    return createApolloClient();
  }
  // Client-side: reuse the same client
  if (!client) {
    client = createApolloClient();
  }
  return client;
}
