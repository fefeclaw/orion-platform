"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, Search, Ship } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Vessel } from "@/hooks/useMaritimeData";

interface VesselsTableProps {
  vessels: Vessel[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onVesselSelect?: (vessel: Vessel) => void;
}

const STATUS_STYLES = {
  transit: { badge: "bg-sky-500/10 text-sky-400 border-sky-500/20", dot: "bg-sky-400", label: "En transit" },
  alert:   { badge: "bg-red-500/10  text-red-400  border-red-500/20",  dot: "bg-red-400",  label: "Alerte"      },
  berth:   { badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", dot: "bg-emerald-400", label: "À quai" },
};

type SortKey = keyof Vessel;

export function VesselsTable({ vessels, isExpanded, onToggleExpand, onVesselSelect }: VesselsTableProps) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filtered = vessels.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.imo.includes(search) ||
    v.destination.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortBy]; const bv = b[sortBy];
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (col: SortKey) => {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("asc"); }
  };

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortBy === col ? (
      sortDir === "asc" ? <ChevronUp className="h-3 w-3 inline ml-1" /> : <ChevronDown className="h-3 w-3 inline ml-1" />
    ) : null;

  return (
    <div
      className={cn(
        "relative shrink-0 w-full backdrop-blur-md border-t transition-all duration-300",
        isExpanded ? "h-72" : "h-11"
      )}
      style={{ background: "rgba(6, 14, 26, 0.96)", borderColor: "rgba(14, 165, 233, 0.15)" }}
    >
      {/* Toggle bar */}
      <button
        onClick={onToggleExpand}
        className="w-full h-11 flex items-center justify-between px-5 hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-center gap-3">
          <Ship className="h-4 w-4 text-sky-500/60" />
          <span className="text-sm font-medium text-white/80">Tableau des Navires</span>
          <span className="text-[11px] text-white/30 px-2 py-0.5 rounded"
            style={{ background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.15)" }}>
            {vessels.length} navires
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] text-white/30">LIVE</span>
        </div>
        {isExpanded
          ? <ChevronDown className="h-4 w-4 text-white/30" />
          : <ChevronUp className="h-4 w-4 text-white/30" />}
      </button>

      {/* Table */}
      {isExpanded && (
        <div className="h-[calc(100%-44px)] flex flex-col">
          {/* Search */}
          <div className="px-5 py-2 border-b flex items-center gap-3"
            style={{ borderColor: "rgba(14, 165, 233, 0.10)" }}>
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher navire, IMO, destination…"
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-white/[0.04] border text-white/70 placeholder-white/20 outline-none focus:border-sky-500/40"
                style={{ borderColor: "rgba(14,165,233,0.12)" }}
              />
            </div>
          </div>

          {/* Rows */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0" style={{ background: "rgba(6,14,26,0.98)" }}>
                <tr style={{ borderBottom: "1px solid rgba(14,165,233,0.10)" }}>
                  {([
                    ["name",        "Navire"],
                    ["imo",         "IMO"],
                    ["type",        "Type"],
                    ["status",      "Statut"],
                    ["lat",         "Position"],
                    ["speed",       "Vitesse"],
                    ["destination", "Destination"],
                    ["eta",         "ETA"],
                  ] as [SortKey, string][]).map(([col, label]) => (
                    <th
                      key={col}
                      onClick={() => handleSort(col)}
                      className="text-left px-4 py-2 font-medium text-white/30 cursor-pointer hover:text-white/60 transition-colors whitespace-nowrap"
                    >
                      {label}<SortIcon col={col} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map(vessel => {
                  const s = STATUS_STYLES[vessel.status];
                  return (
                    <tr
                      key={vessel.id}
                      onClick={() => onVesselSelect?.(vessel)}
                      className="cursor-pointer transition-colors hover:bg-white/[0.03]"
                      style={{ borderBottom: "1px solid rgba(14,165,233,0.06)" }}
                    >
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <span className={cn("w-2 h-2 rounded-full shrink-0", s.dot)} />
                          <span className="text-white/85 font-medium">{vessel.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-white/30 font-mono">{vessel.imo}</td>
                      <td className="px-4 py-2 text-white/50">{vessel.type}</td>
                      <td className="px-4 py-2">
                        <span className={cn("px-1.5 py-0.5 rounded border text-[10px] font-medium", s.badge)}>
                          {s.label}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-white/30 font-mono">
                        {vessel.lat.toFixed(3)}°, {vessel.lng.toFixed(3)}°
                      </td>
                      <td className="px-4 py-2 text-white/50 font-mono">{vessel.speed} kn</td>
                      <td className="px-4 py-2 text-white/80">{vessel.destination}</td>
                      <td className="px-4 py-2 text-white/40 font-mono">{vessel.eta}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
