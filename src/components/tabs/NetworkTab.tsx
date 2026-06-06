"use client";
import { useState } from "react";
import type { NetworkEvent } from "@/types";

const CAT_COLOR: Record<string, string> = {
  "C2 Communication":  "#f87171",
  "SSH Brute Force":   "#fb923c",
  "Port Scan":         "#fbbf24",
  "Reverse Shell":     "#f87171",
  "Telnet Scan":       "#fbbf24",
  "Data Exfiltration": "#f87171",
  "Web Exploit":       "#fb923c",
  "Lateral Movement":  "#f87171",
};

const CAT_DE: Record<string, string> = {
  "C2 Communication":  "C2-Kommunikation",
  "SSH Brute Force":   "SSH-Brute-Force",
  "Port Scan":         "Port-Scan",
  "Reverse Shell":     "Reverse Shell",
  "Telnet Scan":       "Telnet-Scan",
  "Data Exfiltration": "Datenexfiltration",
  "Web Exploit":       "Web-Exploit",
  "Lateral Movement":  "Laterale Bewegung",
};

function bytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

function time(ts: string) {
  return new Date(ts).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function NetworkTab({ networkEvents }: { networkEvents: NetworkEvent[] }) {
  const [filter, setFilter] = useState<"all" | "blocked" | "allowed">("all");

  const sorted = [...networkEvents]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .filter((e) => filter === "all" || e.action === filter);

  const blocked  = networkEvents.filter((e) => e.action === "blocked").length;
  const allowed  = networkEvents.filter((e) => e.action === "allowed").length;
  const blockPct = Math.round((blocked / Math.max(networkEvents.length, 1)) * 100);

  return (
    <div className="p-5 space-y-4 max-w-screen-2xl mx-auto">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Ereignisse gesamt", value: networkEvents.length, color: "#94a3b8" },
          { label: "Blockiert",         value: blocked,              color: "#34d399"  },
          { label: "Durchgelassen",     value: allowed,              color: "#f87171"  },
          { label: "Blockierrate",      value: `${blockPct}%`,       color: "#34d399"  },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-4"
               style={{ background: "linear-gradient(135deg, #0f172a, #0d1b2a)", border: "1px solid rgba(30,41,59,0.8)" }}>
            <div className="text-2xl font-bold" style={{ color, textShadow: `0 0 12px ${color}50` }}>{value}</div>
            <div className="text-[10px] mt-1 uppercase tracking-[0.12em]" style={{ color: "#374151" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(["all", "blocked", "allowed"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
                  className="px-4 py-1.5 rounded-lg text-[10px] font-medium cursor-pointer transition-all uppercase tracking-[0.12em]"
                  style={filter === f
                    ? { background: "rgba(16,185,129,0.15)", color: "#34d399", border: "1px solid rgba(16,185,129,0.35)" }
                    : { background: "rgba(15,23,42,0.5)",   color: "#4b5563", border: "1px solid rgba(30,41,59,0.6)" }}>
            {f === "all" ? "Alle" : f === "blocked" ? "Blockiert" : "Erlaubt"}
          </button>
        ))}
        <span className="ml-auto text-[10px] self-center" style={{ color: "#374151" }}>{sorted.length} Einträge</span>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden"
           style={{ background: "linear-gradient(135deg, #0f172a, #0d1b2a)", border: "1px solid rgba(30,41,59,0.8)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(30,41,59,0.8)", background: "rgba(15,23,42,0.6)" }}>
                {["Zeit", "Quell-IP", "Ziel", "Proto", "Kategorie", "Daten", "Aktion"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold uppercase tracking-[0.12em] text-[10px]"
                      style={{ color: "#374151" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((e) => (
                <tr key={e.id} className="transition-colors"
                    style={{ borderBottom: "1px solid rgba(15,23,42,0.8)" }}
                    onMouseEnter={(el) => ((el.currentTarget as HTMLElement).style.background = "rgba(16,185,129,0.02)")}
                    onMouseLeave={(el) => ((el.currentTarget as HTMLElement).style.background = "")}>
                  <td className="px-4 py-3 font-mono" style={{ color: "#374151" }}>{time(e.timestamp)}</td>
                  <td className="px-4 py-3 font-mono" style={{ color: "#fb923c" }}>{e.srcIp}</td>
                  <td className="px-4 py-3 font-mono" style={{ color: "#94a3b8" }}>
                    {e.dstIp}<span style={{ color: "#374151" }}>:{e.dstPort ?? "–"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono"
                          style={{ background: "rgba(30,41,59,0.5)", color: "#64748b", border: "1px solid rgba(30,41,59,0.8)" }}>
                      {e.protocol}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium" style={{ color: CAT_COLOR[e.category] ?? "#94a3b8" }}>
                    {CAT_DE[e.category] ?? e.category}
                  </td>
                  <td className="px-4 py-3" style={{ color: "#4b5563" }}>{bytes(e.bytes)}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold"
                          style={e.action === "blocked"
                            ? { background: "rgba(6,78,59,0.4)", color: "#34d399", border: "1px solid rgba(16,185,129,0.3)" }
                            : { background: "rgba(127,29,29,0.4)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}>
                      {e.action === "blocked" ? "BLOCKIERT" : "ERLAUBT"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
