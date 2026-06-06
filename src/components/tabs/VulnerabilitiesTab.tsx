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
  investigating: { color: "#fbbf24", label: "IN BEARB."   },
  patched:       { color: "#34d399", label: "GEPATCHT"    },
};

/* Empfohlene Maßnahmen pro CVE */
const FIXES: Record<string, { steps: string[]; link?: string; patchVersion?: string }> = {
  "CVE-2024-3094":   { steps: ["XZ Utils ≥ 5.6.2 installieren","SSH-Dienst neu starten","Paketintegrität mit sha256 prüfen"], patchVersion: "5.6.2" },
  "CVE-2024-21762":  { steps: ["FortiOS ≥ 7.4.3 updaten","SSL-VPN vorübergehend deaktivieren","IOC-Feeds von Fortinet PSIRT anwenden"], patchVersion: "7.4.3" },
  "CVE-2024-1709":   { steps: ["ScreenConnect ≥ 23.9.8 updaten","Fernzugriff bis Patch sperren","Verbindungs-Logs auf Auffälligkeiten prüfen"], patchVersion: "23.9.8" },
  "CVE-2023-50164":  { steps: ["Apache Struts ≥ 6.3.0.2 updaten","File-Upload-Endpoint deaktivieren","WAF-Signatur für Struts aktivieren"], patchVersion: "6.3.0.2" },
  "CVE-2024-27198":  { steps: ["TeamCity ≥ 2023.11.4 updaten","Öffentlichen Zugriff sperren","Admin-Passwörter sofort rotieren"], patchVersion: "2023.11.4" },
  "CVE-2024-6387":   { steps: ["OpenSSH ≥ 9.8p1 updaten","LoginGraceTime 0 in sshd_config setzen","Firewall auf erlaubte IPs beschränken"], patchVersion: "9.8p1" },
  "CVE-2024-4040":   { steps: ["CrushFTP ≥ 10.7.1 updaten","Port 8080 extern sperren","Alle aktiven Sessions invalidieren"], patchVersion: "10.7.1" },
  "CVE-2023-44487":  { steps: ["HTTP/2-Server-Patch einspielen","Rate-Limiting auf HTTP/2-Streams aktivieren","nginx: http2_max_concurrent_streams reduzieren"], patchVersion: "siehe Vendor" },
  "CVE-2024-0519":   { steps: ["Chrome/Chromium auf aktuellste Version updaten","Automatische Updates aktivieren","Benutzer über Phishing-Risiko informieren"], patchVersion: "121.x" },
  "CVE-2023-4966":   { steps: ["Citrix ADC Patch installieren","Session-Tokens invalidieren (alle Clients abmelden)","NetScaler-Konfiguration auf Kompromittierung prüfen"], patchVersion: "13.1-49.13" },
  "CVE-2023-42793":  { steps: ["TeamCity ≥ 2023.05.4 updaten","Öffentlichen CI/CD-Port sperren","Build-Agents auf unbekannte Jobs prüfen"], patchVersion: "2023.05.4" },
};

const DEFAULT_FIX = { steps: ["Vendor-Advisory prüfen", "Patch einspielen sobald verfügbar", "System bis Patch isolieren"] };

const FILTERS = [
  { label: "Alle",           value: "all"          },
  { label: "Kritisch",       value: "critical"     },
  { label: "Hoch",           value: "high"         },
  { label: "Offen",          value: "open"         },
  { label: "In Bearbeitung", value: "investigating" },
  { label: "Gepatcht",       value: "patched"      },
];

/* ── Aufklappbare Zeile mit Lösungen ── */
function VulnRow({ v }: { v: Vulnerability }) {
  const [open, setOpen] = useState(false);
  const sc = STATUS_CFG[v.status];
  const fix = FIXES[v.id] ?? DEFAULT_FIX;

  return (
    <>
      <tr className="transition-all cursor-pointer"
          style={{ borderBottom: open ? "none" : "1px solid rgba(15,23,42,0.8)" }}
          onClick={() => setOpen((o) => !o)}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(16,185,129,0.025)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = open ? "rgba(239,68,68,0.03)" : "")}>
        <td className="px-4 py-3 font-bold font-mono text-[11px]" style={{ color: "#f87171" }}>{v.id}</td>
        <td className="px-4 py-3 max-w-[200px] text-[11px]" style={{ color: "#cbd5e1" }}>
          <span title={v.name} className="truncate block">{v.name}</span>
        </td>
        <td className="px-4 py-3"><SeverityBadge severity={v.severity} /></td>
        <td className="px-4 py-3 text-[11px]">
          <span className="font-bold" style={{ color: v.cvss >= 9 ? "#f87171" : v.cvss >= 7 ? "#fb923c" : "#fbbf24",
                                               textShadow: "0 0 8px currentColor" }}>
            {v.cvss.toFixed(1)}
          </span>
        </td>
        <td className="px-4 py-3 font-mono text-[11px]" style={{ color: "#94a3b8" }}>{v.host}</td>
        <td className="px-4 py-3 text-[11px]" style={{ color: "#475569" }}>{v.service}{v.port ? `:${v.port}` : ""}</td>
        <td className="px-4 py-3 text-[10px] font-bold" style={{ color: sc?.color ?? "#94a3b8" }}>
          {sc?.label ?? v.status.toUpperCase()}
        </td>
        <td className="px-4 py-3 text-[11px]" style={{ color: "#374151" }}>{v.discovered}</td>
        <td className="px-4 py-3 text-[11px]" style={{ color: open ? "#34d399" : "#374151" }}>
          {open ? "▲ einklappen" : "▼ Lösungen"}
        </td>
      </tr>

      {open && (
        <tr style={{ background: "rgba(2,8,23,0.6)", borderBottom: "1px solid rgba(30,41,59,0.6)" }}>
          <td colSpan={9} className="px-6 py-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Fix-Steps */}
              <div className="flex-1 rounded-xl p-4"
                   style={{ background: "rgba(6,78,59,0.12)", border: "1px solid rgba(16,185,129,0.2)" }}>
                <div className="text-[10px] uppercase tracking-[0.15em] font-semibold mb-3" style={{ color: "#34d399" }}>
                  ✓ Empfohlene Maßnahmen
                </div>
                <div className="space-y-2">
                  {fix.steps.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-[11px]" style={{ color: "#94a3b8" }}>
                      <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold mt-px"
                            style={{ background: "rgba(16,185,129,0.2)", color: "#10b981" }}>{i + 1}</span>
                      {s}
                    </div>
                  ))}
                </div>
              </div>

              {/* Meta-Info */}
              <div className="sm:w-48 rounded-xl p-4 space-y-3"
                   style={{ background: "rgba(15,23,42,0.5)", border: "1px solid rgba(30,41,59,0.6)" }}>
                <InfoRow label="CVE-ID"       value={v.id}         color="#f87171" />
                <InfoRow label="CVSS"         value={v.cvss.toFixed(1)} color={v.cvss >= 9 ? "#f87171" : "#fb923c"} />
                <InfoRow label="Host"         value={v.host}       mono />
                <InfoRow label="Service"      value={`${v.service}${v.port ? `:${v.port}` : ""}`} />
                {fix.patchVersion && <InfoRow label="Patch"  value={fix.patchVersion} color="#34d399" />}
                <InfoRow label="Entdeckt"     value={v.discovered} />
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function InfoRow({ label, value, color, mono }: { label: string; value: string; color?: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-[0.12em]" style={{ color: "#334155" }}>{label}</div>
      <div className={`text-[11px] font-medium mt-0.5 ${mono ? "font-mono" : ""}`} style={{ color: color ?? "#64748b" }}>
        {value}
      </div>
    </div>
  );
}

/* ── Hauptkomponente ── */
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
    .filter((v) => !search ||
      v.id.toLowerCase().includes(search.toLowerCase()) ||
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.host.toLowerCase().includes(search.toLowerCase()))
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
      <th className="text-left px-4 py-3 cursor-pointer select-none font-semibold uppercase tracking-[0.1em] text-[10px] transition-colors"
          style={{ color: active ? "#34d399" : "#334155" }} onClick={() => handleSort(col)}>
        {label} <span style={{ color: active ? "#34d399" : "#1e293b" }}>{active ? (sortDir === "desc" ? "↓" : "↑") : "⇅"}</span>
      </th>
    );
  }

  const stats = {
    critical: vulnerabilities.filter((v) => v.severity === "critical").length,
    open:     vulnerabilities.filter((v) => v.status === "open").length,
    patched:  vulnerabilities.filter((v) => v.status === "patched").length,
    withFix:  vulnerabilities.filter((v) => FIXES[v.id]).length,
  };

  return (
    <div className="p-5 space-y-4 max-w-[1600px] mx-auto">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Kritisch", value: stats.critical, color: "#f87171" },
          { label: "Offen",    value: stats.open,     color: "#fbbf24" },
          { label: "Gepatcht", value: stats.patched,  color: "#34d399" },
          { label: "Mit Lösungsschritten", value: stats.withFix, color: "#60a5fa" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-4 flex items-center gap-3"
               style={{ background: "linear-gradient(145deg,#0c1525,#0f1d2e)", border: "1px solid rgba(30,41,59,0.8)" }}>
            <span className="text-2xl font-bold" style={{ color, textShadow: `0 0 12px ${color}50` }}>{value}</span>
            <span className="text-[10px] uppercase tracking-[0.12em]" style={{ color: "#334155" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center px-4 py-3 rounded-xl"
           style={{ background: "rgba(12,21,37,0.7)", border: "1px solid rgba(30,41,59,0.6)" }}>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px]" style={{ color: "#334155" }}>🔍</span>
          <input type="text" placeholder="CVE, Name oder Host…" value={search} onChange={(e) => setSearch(e.target.value)}
                 className="pl-8 pr-4 py-2 rounded-lg text-[11px] outline-none w-52"
                 style={{ background: "rgba(2,8,23,0.8)", border: "1px solid rgba(30,41,59,0.8)", color: "#e2e8f0", caretColor: "#10b981" }}
                 onFocus={(e) => (e.target.style.borderColor = "rgba(16,185,129,0.4)")}
                 onBlur={(e)  => (e.target.style.borderColor = "rgba(30,41,59,0.8)")} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map((f) => (
            <button key={f.value} onClick={() => setFilter(f.value)}
                    className="px-3 py-1.5 text-[10px] rounded-lg font-medium cursor-pointer transition-all"
                    style={filter === f.value
                      ? { background: "rgba(16,185,129,0.15)", color: "#34d399", border: "1px solid rgba(16,185,129,0.35)" }
                      : { background: "rgba(2,8,23,0.6)", color: "#334155", border: "1px solid rgba(30,41,59,0.6)" }}>
              {f.label}
            </button>
          ))}
        </div>
        <span className="ml-auto text-[10px] flex items-center gap-1.5" style={{ color: "#334155" }}>
          <span style={{ color: "#64748b" }}>{filtered.length}</span> Einträge ·
          <span style={{ color: "#34d399" }}>Zeile klicken für Lösungen</span>
        </span>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden"
           style={{ background: "linear-gradient(145deg,#0c1525,#0f1d2e)", border: "1px solid rgba(30,41,59,0.8)" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(30,41,59,0.8)", background: "rgba(2,8,23,0.5)" }}>
                <th className="text-left px-4 py-3 font-semibold uppercase tracking-[0.1em] text-[10px]" style={{ color: "#334155" }}>CVE-ID</th>
                <th className="text-left px-4 py-3 font-semibold uppercase tracking-[0.1em] text-[10px]" style={{ color: "#334155" }}>Name</th>
                <Th col="severity"    label="Schweregrad" />
                <Th col="cvss"        label="CVSS" />
                <Th col="host"        label="Host" />
                <th className="text-left px-4 py-3 font-semibold uppercase tracking-[0.1em] text-[10px]" style={{ color: "#334155" }}>Dienst</th>
                <Th col="status"      label="Status" />
                <Th col="discovered"  label="Entdeckt" />
                <th className="text-left px-4 py-3 font-semibold uppercase tracking-[0.1em] text-[10px]" style={{ color: "#334155" }}>Lösung</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => <VulnRow key={v.id} v={v} />)}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-[12px]" style={{ color: "#334155" }}>
              Keine Einträge für diesen Filter
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
