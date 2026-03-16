export type Pillar = "maritime" | "rail" | "road" | "air";

export interface PillarConfig {
  id: Pillar;
  label: string;
  icon: string;
  color: string;
  description: string;
}

export type AuthMode = "professional" | "user";

export interface ProfessionalCredentials {
  company: string;
  matricule: string;
  password: string;
}

export interface UserCredentials {
  email: string;
  password: string;
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
];
