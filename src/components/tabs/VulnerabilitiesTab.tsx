"use client";
import { useState } from "react";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import type { Vulnerability } from "@/types";

type SortKey = "cvss" | "severity" | "discovered" | "host" | "status";
type SortDir = "asc" | "desc";

const SEVERITY_RANK: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
const STATUS_RANK:   Record<string, number>  = { open: 3, investigating: 2, patched: 1 };
const STATUS_CFG: Record<string, { color: string; label: string }> = {
  open:          { color: "#f87171", label: "OFFEN"       },
  investigating: { color: "#fbbf24", label: "IN BEARBEIT." },
  patched:       { color: "#34d399", label: "GEPATCHT"    },
};

const FILTERS = [
  { label: "Alle",           value: "all"          },
  { label: "Kritisch",       value: "critical"     },
  { label: "Hoch",           value: "high"         },
  { label: "Mittel",         value: "medium"       },
  { label: "Offen",          value: "open"         },
  { label: "In Bearbeitung", value: "investigating" },
  { label: "Gepatcht",       value: "patched"      },
];

export function VulnerabilitiesTab({ vulnerabilities }: { vulnerabilities: Vulnerability[] }) {
  const [filter, setFilter]   = useState("all");
  const [search, setSearch]   = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("cvss");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(key: SortKey) {
    sortKey === key ? setSortDir((d) => (d === "desc" ? "asc" : "desc")) : (setSortKey(key), setSortDir("desc"));
  }

  const filtered = vulnerabilities
    .filter((v) => filter === "all" || v.severity === filter || v.status === filter)
    .filter((v) =>
      !search ||
      v.id.toLowerCase().includes(search.toLowerCase()) ||
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.host.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      let c = 0;
      if (sortKey === "cvss")      c = a.cvss - b.cvss;
      if (sortKey === "severity")  c = (SEVERITY_RANK[a.severity] ?? 0) - (SEVERITY_RANK[b.severity] ?? 0);
      if (sortKey === "status")    c = (STATUS_RANK[a.status] ?? 0) - (STATUS_RANK[b.status] ?? 0);
      if (sortKey === "host")      c = a.host.localeCompare(b.host);
      if (sortKey === "discovered") c = a.discovered.localeCompare(b.discovered);
      return sortDir === "desc" ? -c : c;
    });

  function Th({ col, label }: { col: SortKey; label: string }) {
    const active = sortKey === col;
    return (
      <th className="text-left px-4 py-3 cursor-pointer select-none font-semibold uppercase tracking-[0.12em] text-[10px] transition-colors"
          style={{ color: active ? "#34d399" : "#374151" }}
          onClick={() => handleSort(col)}>
        {label} <span style={{ color: active ? "#34d399" : "#1e293b" }}>{active ? (sortDir === "desc" ? "↓" : "↑") : "⇅"}</span>
      </th>
    );
  }

  const stats = {
    critical: vulnerabilities.filter((v) => v.severity === "critical").length,
    open:     vulnerabilities.filter((v) => v.status === "open").length,
    patched:  vulnerabilities.filter((v) => v.status === "patched").length,
  };

  return (
    <div className="p-5 space-y-4 max-w-screen-2xl mx-auto">
      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Kritisch",  value: stats.critical, color: "#f87171" },
          { label: "Offen",     value: stats.open,     color: "#fbbf24" },
          { label: "Gepatcht",  value: stats.patched,  color: "#34d399" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-4 flex items-center gap-4"
               style={{ background: "linear-gradient(135deg, #0f172a, #0d1b2a)", border: "1px solid rgba(30,41,59,0.8)" }}>
            <span className="text-3xl font-bold" style={{ color, textShadow: `0 0 15px ${color}50` }}>{value}</span>
            <span className="text-[10px] uppercase tracking-[0.15em]" style={{ color: "#4b5563" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center rounded-xl p-4"
           style={{ background: "rgba(15,23,42,0.5)", border: "1px solid rgba(30,41,59,0.6)" }}>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px]" style={{ color: "#374151" }}>🔍</span>
          <input
            type="text" placeholder="CVE, Name oder Host…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-4 py-2 rounded-lg text-[11px] outline-none w-56 transition-all"
            style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(30,41,59,0.8)", color: "#e2e8f0", caretColor: "#10b981" }}
            onFocus={(e) => (e.target.style.borderColor = "rgba(16,185,129,0.4)")}
            onBlur={(e)  => (e.target.style.borderColor = "rgba(30,41,59,0.8)")}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map((f) => (
            <button key={f.value} onClick={() => setFilter(f.value)}
                    className="px-3 py-1.5 text-[10px] rounded-lg font-medium transition-all cursor-pointer"
                    style={filter === f.value
                      ? { background: "rgba(16,185,129,0.15)", color: "#34d399", border: "1px solid rgba(16,185,129,0.35)" }
                      : { background: "rgba(15,23,42,0.6)", color: "#4b5563", border: "1px solid rgba(30,41,59,0.6)" }}>
              {f.label}
            </button>
          ))}
        </div>
        <span className="ml-auto text-[10px]" style={{ color: "#374151" }}>
          {filtered.length} Einträge
        </span>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden"
           style={{ background: "linear-gradient(135deg, #0f172a, #0d1b2a)", border: "1px solid rgba(30,41,59,0.8)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(30,41,59,0.8)", background: "rgba(15,23,42,0.6)" }}>
                <th className="text-left px-4 py-3 font-semibold uppercase tracking-[0.12em] text-[10px]" style={{ color: "#374151" }}>CVE-ID</th>
                <th className="text-left px-4 py-3 font-semibold uppercase tracking-[0.12em] text-[10px]" style={{ color: "#374151" }}>Name</th>
                <Th col="severity"   label="Schweregrad" />
                <Th col="cvss"       label="CVSS" />
                <Th col="host"       label="Host" />
                <th className="text-left px-4 py-3 font-semibold uppercase tracking-[0.12em] text-[10px]" style={{ color: "#374151" }}>Dienst</th>
                <Th col="status"     label="Status" />
                <Th col="discovered" label="Entdeckt" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => {
                const sc = STATUS_CFG[v.status];
                return (
                  <tr key={v.id} className="transition-colors cursor-default"
                      style={{ borderBottom: "1px solid rgba(15,23,42,0.8)" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(16,185,129,0.03)")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "")}>
                    <td className="px-4 py-3 font-bold font-mono" style={{ color: "#f87171" }}>{v.id}</td>
                    <td className="px-4 py-3 max-w-[200px]" style={{ color: "#cbd5e1" }}>
                      <span title={v.name} className="truncate block">{v.name}</span>
                    </td>
                    <td className="px-4 py-3"><SeverityBadge severity={v.severity} /></td>
                    <td className="px-4 py-3">
                      <span className="font-bold" style={{ color: v.cvss >= 9 ? "#f87171" : v.cvss >= 7 ? "#fb923c" : "#fbbf24", textShadow: "0 0 8px currentColor" }}>
                        {v.cvss.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono" style={{ color: "#94a3b8" }}>{v.host}</td>
                    <td className="px-4 py-3" style={{ color: "#4b5563" }}>{v.service}{v.port ? `:${v.port}` : ""}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-[10px]" style={{ color: sc?.color ?? "#94a3b8" }}>
                        {sc?.label ?? v.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: "#374151" }}>{v.discovered}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-[12px]" style={{ color: "#374151" }}>
              Keine Einträge für diesen Filter
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
