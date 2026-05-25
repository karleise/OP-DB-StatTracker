import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const credentialsSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (raw) => {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { username, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) return null;
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null;
        return { id: user.id, username: user.username, role: user.role };
      },
    }),
  ],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
      }
      return token;
    },
    session: ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role = token.role as "USER" | "ADMIN";
      }
      return session;
    },
    authorized: ({ auth, request }) => {
      const path = request.nextUrl.pathname;
      const isAdminPath = path.startsWith("/admin");
      const isStatsNew = path.startsWith("/stats/new");
      if (isAdminPath) return auth?.user?.role === "ADMIN";
      if (isStatsNew) return !!auth?.user;
      return true;
    },
  },
});

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Response("Unauthorized", { status: 401 });
  }
  return session.user;
}

export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    throw new Response("Unauthorized", { status: 401 });
  }
  return session.user;
}
