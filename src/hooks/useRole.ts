"use client";

import { useSession } from "next-auth/react";

export type UserRole = "professional" | "user";

interface RoleResult {
  role: UserRole;
  isPro: boolean;
  isClient: boolean;
  pillar: string | null;
  loading: boolean;
}

export function useRole(): RoleResult {
  const { data: session, status } = useSession();
  const loading = status === "loading";

  const rawRole = (session?.user as Record<string, unknown> | undefined)?.role;
  const role: UserRole = rawRole === "professional" ? "professional" : "user";
  const pillar = ((session?.user as Record<string, unknown> | undefined)?.pillar as string) ?? null;

  return {
    role,
    isPro: role === "professional",
    isClient: role === "user",
    pillar,
    loading,
  };
}
