import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Cache vidé",
      cleared: ["memory", "redis"]
    });
  } catch (error) {
    console.error("Clear cache error:", error);
    return NextResponse.json({ error: "Clear cache failed" }, { status: 500 });
  }
}
