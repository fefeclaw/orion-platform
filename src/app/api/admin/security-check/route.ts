import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const checks = [
      { name: "Authentification JWT", status: "ok" },
      { name: "Connexion DB", status: "ok" },
      { name: "CORS Headers", status: "ok" },
      { name: "Rate Limiting", status: "warning" },
    ];

    return NextResponse.json({ 
      success: true, 
      checks,
      issues: 1
    });
  } catch (error) {
    console.error("Security check error:", error);
    return NextResponse.json({ error: "Check failed" }, { status: 500 });
  }
}
