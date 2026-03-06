import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { connectDB } from "./mongodb";
import { Recruiter } from "./models/recruiter";
import { authConfig } from "./auth.config";

import type { Provider } from "next-auth/providers";

async function ensureRecruiterId(email: string, name?: string | null) {
  await connectDB();
  const existing = await Recruiter.findOne({ email });
  if (existing) return existing._id.toString();

  const created = await Recruiter.create({
    name: name || "Recruiter",
    email,
    provider: "google",
  });
  return created._id.toString();
}

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
      // Avoid PKCE cookie parsing issues on some hosted callback flows.
      checks: ["state"],
    })
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  trustHost: true,
  providers,
  callbacks: {
    ...authConfig.callbacks,
    async signIn() {
      // Keep sign-in permissive; database sync happens in jwt callback.
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.recruiterId = user.id;
      }

      if (account?.provider === "google" && token.email) {
        try {
          token.recruiterId = await ensureRecruiterId(token.email, token.name);
        } catch (error) {
          console.error("Google recruiter sync failed:", error);
        }
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
