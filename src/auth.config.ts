import type { NextAuthConfig } from "next-auth";

// Edge-compatible auth config (no Node.js-only APIs)
export const authConfig: NextAuthConfig = {
  pages: { signIn: "/" },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isDashboard = nextUrl.pathname.startsWith("/dashboard");
      if (isDashboard) return isLoggedIn;
      return true;
    },
  },
};
