import NextAuth, { type Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import type { UserRole } from "@/types";
import { isDbAvailable, findUserByEmail, verifyPassword, updateLastLogin, logAccess } from "@/lib/auth-db";

// ─── Fallback mock (utilisé si better-sqlite3 non installé) ──────────────────
const MOCK_PROFESSIONALS = [
  { id: "p1", company: "Orion Group",           matricule: "MAT-0001", password: "orion2024", pillar: "maritime" as const, role: "professional_maritime" as UserRole },
  { id: "p2", company: "TransAfrica Rail",       matricule: "MAT-0002", password: "orion2024", pillar: "rail"     as const, role: "professional_rail"     as UserRole },
  { id: "p3", company: "SahelRoute Logistics",   matricule: "MAT-0003", password: "orion2024", pillar: "road"     as const, role: "professional_road"     as UserRole },
  { id: "p4", company: "AirCargo CI",            matricule: "MAT-0004", password: "orion2024", pillar: "air"      as const, role: "professional_air"      as UserRole },
  { id: "p5", company: "Orion Group",            matricule: "ADM-0001", password: "admin2024", pillar: "all"      as const, role: "admin"                 as UserRole },
];

const MOCK_USERS = [
  { id: "u1", email: "admin@orion.ci",           password: "orion2024", name: "Admin Orion",  role: "admin"       as UserRole, pillar: "all"      as const },
  { id: "u2", email: "demo@orion.ci",            password: "demo123",   name: "Demo User",    role: "public_user" as UserRole, pillar: "maritime" as const },
  { id: "u3", email: "jean.kouame@gmail.com",    password: "test123",   name: "Jean Kouamé",  role: "public_user" as UserRole, pillar: "maritime" as const },
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
        const { mode, email, password, matricule } = credentials as Record<string, string>;

        if (mode === "professional") {
          // Professionnels : auth par matricule (DB non encore utilisée pour ce mode)
          const user = MOCK_PROFESSIONALS.find(
            (u) => u.matricule === matricule && u.password === password
          );
          if (user) {
            return {
              id: user.id,
              name: user.company,
              email: `${user.matricule.toLowerCase()}@orion.ci`,
              role: user.role,
              pillar: user.pillar,
            };
          }
        } else {
          // Auth DB si available, sinon fallback mock
          if (isDbAvailable()) {
            try {
              const dbUser = findUserByEmail(email);
              if (dbUser && verifyPassword(password, dbUser.password_hash)) {
                updateLastLogin(dbUser.id);
                try { logAccess({ userId: dbUser.id, userEmail: dbUser.email, action: 'LOGIN', status: 'SUCCESS' }); } catch { /* silencieux */ }
                const pillar = dbUser.pillars.length > 1 ? "all"
                  : dbUser.pillars.length === 1 ? dbUser.pillars[0]
                  : "maritime";
                return { id: dbUser.id, name: dbUser.name, email: dbUser.email, role: dbUser.role as UserRole, pillar };
              }
              if (dbUser) {
                try { logAccess({ userId: dbUser.id, userEmail: dbUser.email, action: 'LOGIN', status: 'FAILED' }); } catch { /* silencieux */ }
              }
              return null;
            } catch {
              // DB error → fallback mock silencieux
            }
          }
          const user = MOCK_USERS.find(
            (u) => u.email === email && u.password === password
          );
          if (user) {
            return { id: user.id, name: user.name, email: user.email, role: user.role, pillar: user.pillar };
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
        token.role = (user as { role: UserRole }).role;
        token.pillar = (user as { pillar: string }).pillar as "maritime" | "rail" | "road" | "air" | "all";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.pillar = token.pillar;
      }
      return session;
    },
  },
});

// --- Fonctions utilitaires d'autorisation ---

/** Vérifie si la session a accès à un pilier donné */
export function canAccessPillar(session: Session | null, pillar: string): boolean {
  if (!session?.user) return false;
  const { role, pillar: userPillar } = session.user;
  if (role === "admin") return true;
  if (userPillar === "all") return true;
  return userPillar === pillar;
}

/** Vérifie si l'utilisateur est admin Orion */
export function isAdmin(session: Session | null): boolean {
  return session?.user?.role === "admin";
}

/** Vérifie si l'utilisateur est un professionnel (tous piliers confondus) */
export function isProfessional(session: Session | null): boolean {
  const role = session?.user?.role;
  return role !== undefined && role !== "public_user" && role !== undefined;
}
