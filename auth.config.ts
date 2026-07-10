import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe auth configuration (no database / Node-only imports here) so it can
 * be used by middleware. The Credentials provider that touches the database
 * lives in ./auth.ts, which extends this.
 */
export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    // Put role + id onto the JWT at sign-in so we can authorize without a DB hit.
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "driver";
        token.fullName = (user as { fullName?: string }).fullName ?? "";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "admin" | "driver";
        session.user.fullName = (token.fullName as string) ?? session.user.name ?? "";
      }
      return session;
    },
  },
  providers: [], // real providers are added in auth.ts
} satisfies NextAuthConfig;
