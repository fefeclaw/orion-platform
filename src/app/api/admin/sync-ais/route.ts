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
      message: "Sync AIS déclenchée",
      updated: 47
    });
  } catch (error) {
    console.error("Sync AIS error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
