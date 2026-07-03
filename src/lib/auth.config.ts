import type { NextAuthConfig } from "next-auth";
import type { SystemRole } from "@prisma/client";

/**
 * Config de next-auth SEGURA PARA EDGE: la usa el middleware, que solo
 * necesita decodificar el JWT de la cookie. No importa Prisma ni bcrypt
 * (eso vive en src/lib/auth.ts, que corre en Node) — sin esta separación
 * el bundle del middleware supera el límite de 1 MB del plan Hobby de Vercel.
 */
export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  // Los providers reales (Google, Credentials) se agregan en auth.ts;
  // el middleware no inicia sesiones, solo las lee.
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.systemRole = (user as { systemRole: SystemRole }).systemRole;
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.systemRole = token.systemRole as SystemRole;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
