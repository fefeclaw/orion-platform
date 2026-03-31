export type Pillar = "maritime" | "rail" | "road" | "air";

export interface PillarConfig {
  id: Pillar;
  label: string;
  icon: string;
  color: string;
  description: string;
}

export type AuthMode = "professional" | "user";

// Rôles utilisateurs Orion
export type UserRole =
  | "admin"
  | "professional_maritime"
  | "professional_rail"
  | "professional_road"
  | "professional_air"
  | "public_user";

export interface OrionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  pillar: Pillar | "all";
}

export interface ProfessionalCredentials {
  company: string;
  matricule: string;
  password: string;
}

export interface UserCredentials {
  email: string;
  password: string;
}

// Extensions de types next-auth
declare module "next-auth" {
  interface Session {
    user: OrionUser & { image?: string | null };
  }
  interface User extends OrionUser {}
}
declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
    pillar: Pillar | "all";
  }
}

export const PILLARS: PillarConfig[] = [
  {
    id: "maritime",
    label: "Maritime",
    icon: "anchor",
    color: "#38bdf8",
    description: "Suivi des navires, ports & fret maritime",
  },
  {
    id: "rail",
    label: "Ferroviaire",
    icon: "train",
    color: "#f87171",
    description: "Réseau ferré, wagons & corridors",
  },
  {
    id: "road",
    label: "Routier",
    icon: "truck",
    color: "#34d399",
    description: "Flotte, corridors terrestres & tracking GPS",
  },
  {
    id: "air",
    label: "Aérien",
    icon: "plane",
    color: "#a78bfa",
    description: "Fret aérien, vols cargo & hubs",
  },
];

export const WELCOME_LANGUAGES = [
  { lang: "fr", text: "Bienvenue" },
  { lang: "en", text: "Welcome" },
  { lang: "pt", text: "Bem-vindo" },
  { lang: "nl", text: "Welkom" },
  { lang: "zh", text: "欢迎" },
  { lang: "ko", text: "환영합니다" },
  { lang: "ja", text: "ようこそ" },
  { lang: "de", text: "Willkommen" },
];
