import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { compare, hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

const ADMIN_ROLE = "ADMIN";
const USER_ROLE = "USER";

function isAdminEmail(email?: string | null) {
  return Boolean(process.env.ADMIN_EMAIL && email?.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase());
}

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "Email and password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" }
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials.password) return null;
      const email = credentials.email.toLowerCase();
      const isEnvAdmin =
        isAdminEmail(email) &&
        Boolean(process.env.ADMIN_PASSWORD) &&
        credentials.password === process.env.ADMIN_PASSWORD;

      if (isEnvAdmin) {
        const user = await prisma.user.upsert({
          where: { email },
          update: {
            name: process.env.ADMIN_USERNAME ?? "CollegeHub Admin",
            password: await hash(credentials.password, 12)
          },
          create: {
            name: process.env.ADMIN_USERNAME ?? "CollegeHub Admin",
            email,
            password: await hash(credentials.password, 12)
          }
        });

        return { id: user.id, email: user.email, name: user.name, image: user.image, role: ADMIN_ROLE };
      }

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user?.password) return null;
      const isValid = await compare(credentials.password, user.password);
      if (!isValid) return null;
      return { id: user.id, email: user.email, name: user.name, image: user.image, role: USER_ROLE };
    }
  })
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    })
  );
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/auth/login"
  },
  providers,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        await prisma.user.upsert({
          where: { email: user.email.toLowerCase() },
          update: { name: user.name, image: user.image },
          create: { email: user.email.toLowerCase(), name: user.name, image: user.image }
        });
      }
      return true;
    },
    async jwt({ token, user }) {
      const email = token.email ?? user?.email;
      if (email) {
        const dbUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        if (dbUser) token.id = dbUser.id;
        token.role = isAdminEmail(email) ? ADMIN_ROLE : USER_ROLE;
      }
      if (user && "role" in user) {
        token.role = user.role === ADMIN_ROLE ? ADMIN_ROLE : USER_ROLE;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id);
        session.user.role = token.role === ADMIN_ROLE ? ADMIN_ROLE : USER_ROLE;
      }
      return session;
    }
  }
};
