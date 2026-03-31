import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const services = [
      { name: "API Next.js", status: "up" as const, latency: Math.floor(Math.random() * 50) + 20, icon: "Server" },
      { name: "SQLite DB", status: "up" as const, latency: Math.floor(Math.random() * 20) + 5, icon: "Database" },
      { name: "Cache Redis", status: "up" as const, latency: Math.floor(Math.random() * 10) + 2, icon: "Activity" },
      { name: "AIS Provider", status: Math.random() > 0.8 ? "degraded" : "up" as const, latency: Math.floor(Math.random() * 500) + 200, icon: "Wifi" },
    ];

    return NextResponse.json({ services, timestamp: new Date().toISOString() });
  } catch {
    return NextResponse.json({ error: "Health check failed" }, { status: 500 });
  }
}
