import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { connectDB } from "./mongodb";
import { Recruiter } from "./models/recruiter";
import { authConfig } from "./auth.config";

import type { Provider } from "next-auth/providers";

const providers: Provider[] = [
  Credentials({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;

      await connectDB();
      const recruiter = await Recruiter.findOne({ email: credentials.email });
      if (!recruiter || !recruiter.passwordHash) return null;

      const valid = await bcrypt.compare(
        credentials.password as string,
        recruiter.passwordHash
      );
      if (!valid) return null;

      return {
        id: recruiter._id.toString(),
        name: recruiter.name,
        email: recruiter.email,
      };
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        await connectDB();
        const existing = await Recruiter.findOne({ email: user.email });
        if (!existing) {
          const created = await Recruiter.create({
            name: user.name || "Recruiter",
            email: user.email,
            provider: "google",
          });
          user.id = created._id.toString();
        } else {
          user.id = existing._id.toString();
        }
      }
      return true;
    },
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
});
