import { NextResponse } from "next/server";
import { auth } from "@/auth";
import path from "path";
import fs from "fs";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const dbPath = path.join(process.cwd(), "data", "orion.db");
    const backupDir = path.join(process.cwd(), "backups");
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = path.join(backupDir, `orion-backup-${timestamp}.db`);

    fs.copyFileSync(dbPath, backupPath);

    return NextResponse.json({ 
      success: true, 
      message: "Backup créé",
      path: backupPath 
    });
  } catch (error) {
    console.error("Backup error:", error);
    return NextResponse.json({ error: "Backup failed" }, { status: 500 });
  }
}
