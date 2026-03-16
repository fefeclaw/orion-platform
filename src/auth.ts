import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";

// Mock user database (to be replaced with real DB in Sprint 3)
const MOCK_PROFESSIONALS = [
  { id: "p1", company: "Orion Group", matricule: "MAT-0001", password: "orion2024", pillar: "maritime" },
  { id: "p2", company: "TransAfrica Rail", matricule: "MAT-0002", password: "orion2024", pillar: "rail" },
  { id: "p3", company: "SahelRoute Logistics", matricule: "MAT-0003", password: "orion2024", pillar: "road" },
  { id: "p4", company: "AirCargo CI", matricule: "MAT-0004", password: "orion2024", pillar: "air" },
];

const MOCK_USERS = [
  { id: "u1", email: "admin@orion.ci", password: "orion2024", name: "Admin Orion" },
  { id: "u2", email: "demo@orion.ci", password: "demo123", name: "Demo User" },
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
        company: {},
        matricule: {},
        mode: {},
      },
      authorize: async (credentials) => {
        const { mode, email, password, company, matricule } = credentials as Record<string, string>;

        if (mode === "professional") {
          const user = MOCK_PROFESSIONALS.find(
            (u) => u.matricule === matricule && u.password === password
          );
          if (user) {
            return {
              id: user.id,
              name: user.company,
              email: `${user.matricule.toLowerCase()}@orion.ci`,
              role: "professional",
              pillar: user.pillar,
            };
          }
        } else {
          const user = MOCK_USERS.find(
            (u) => u.email === email && u.password === password
          );
          if (user) {
            return { id: user.id, name: user.name, email: user.email, role: "user", pillar: "maritime" };
          }
        }
        return null;
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as Record<string, unknown>).role;
        token.pillar = (user as Record<string, unknown>).pillar;
      }
      return token;
    },
    session({ session, token }) {
      (session.user as unknown as Record<string, unknown>).role = token.role;
      (session.user as unknown as Record<string, unknown>).pillar = token.pillar;
      return session;
    },
  },
});
