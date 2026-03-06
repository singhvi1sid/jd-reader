import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  providers: [],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.recruiterId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.recruiterId) {
        (session.user as { id?: string }).id = token.recruiterId as string;
      }
      return session;
    },
  },
};
