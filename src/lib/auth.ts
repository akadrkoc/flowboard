import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";

const SESSION_MAX_AGE = parseInt(
  process.env.SESSION_MAX_AGE_SECONDS || "604800",
  10
);

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE,
  },
  jwt: {
    maxAge: SESSION_MAX_AGE,
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!account) return false;

      await connectDB();

      const existingUser = await User.findOne({ email: user.email });
      if (!existingUser) {
        await User.create({
          email: user.email,
          name: user.name || "User",
          image: user.image,
          provider: account.provider as "google" | "github",
        });
      }

      return true;
    },

    async jwt({ token, user }) {
      await connectDB();

      if (user?.email) {
        const dbUser = await User.findOne({ email: user.email }).lean();
        if (dbUser) {
          token.userId = (
            dbUser as { _id: { toString(): string } }
          )._id.toString();
        }
        return token;
      }

      if (token.userId) {
        const dbUser = await User.findById(token.userId as string).lean();
        if (!dbUser) {
          delete token.userId;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user && token.userId) {
        (session.user as Record<string, unknown>).id = token.userId;
      }
      return session;
    },
  },
};
