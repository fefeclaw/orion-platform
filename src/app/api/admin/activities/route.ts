import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const db = getDb();

    const logs = db.prepare(`
      SELECT 
        id,
        user_email as user,
        action,
        resource_type as type,
        created_at as timestamp,
        details
      FROM access_logs
      ORDER BY created_at DESC
      LIMIT 10
    `).all();

    const activities = (logs as Record<string, unknown>[]).map((log) => ({
      id: String(log.id),
      type: String(log.type) as "user" | "document" | "system" | "alert",
      action: String(log.action),
      user: String(log.user),
      timestamp: String(log.timestamp),
      details: log.details ? String(log.details) : undefined,
    }));

    return NextResponse.json({ activities });
  } catch {
    return NextResponse.json({ activities: [] });
  }
}
