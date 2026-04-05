"use client";

import { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface SimplePageLayoutProps {
  children: ReactNode;
  header?: ReactNode;
  color?: string;
}

export function SimplePageLayout({ 
  children, 
  header,
  color = "#38bdf8" 
}: SimplePageLayoutProps) {
  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "#030712" }}>
      {/* Header */}
      {header && (
        <header
          className="relative flex h-14 shrink-0 items-center justify-between px-5 z-10"
          style={{
            background: "rgba(6, 14, 26, 0.95)",
            backdropFilter: "blur(16px)",
            borderBottom: `1px solid ${color}1a`,
          }}
        >
          <div className="flex items-center gap-4">
            <Link href="/" className="text-white/25 hover:text-white/60 transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
          <div className="flex-1">
            {header}
          </div>
        </header>
      )}

      {/* Content */}
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  );
}
