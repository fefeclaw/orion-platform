import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAllAccessLogs, getRecentAccessLogs } from "@/lib/auth-db";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Accès refusé — admin requis" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const logs = userId
      ? getRecentAccessLogs(userId, 100)
      : getAllAccessLogs(100, 0);

    return NextResponse.json({ logs, total: logs.length });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
