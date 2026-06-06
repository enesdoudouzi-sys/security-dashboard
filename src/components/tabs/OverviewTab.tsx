"use client";
import { useState } from "react";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import type { DashboardData } from "@/types";

/* ── Kleine Hilfselemente ── */
function Pill({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
          style={{ background: `${color}18`, color, border: `1px solid ${color}35` }}>
      {children}
    </span>
  );
}

function SectionHeader({ icon, title, count, color = "#64748b" }: { icon: string; title: string; count?: number; color?: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span style={{ color }}>{icon}</span>
      <span className="text-[11px] uppercase tracking-[0.18em] font-semibold" style={{ color: "#64748b" }}>{title}</span>
      {count !== undefined && (
        <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold"
              style={{ background: `${color}18`, color }}>{count}</span>
      )}
    </div>
  );
}

function KpiCard({ label, value, sub, color, icon, trend }: {
  label: string; value: number | string; sub: string; color: string; icon: string; trend?: string;
}) {
  return (
    <div className="rounded-2xl p-5 relative overflow-hidden group transition-all duration-300 hover:-translate-y-0.5"
         style={{ background: "linear-gradient(145deg,#0c1525,#0f1d2e)", border: `1px solid ${color}20` }}>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
           style={{ background: `radial-gradient(circle at 0% 0%, ${color}08, transparent 60%)` }} />
      <div className="flex items-start justify-between mb-3">
        <span className="text-[10px] uppercase tracking-[0.18em] font-medium" style={{ color: "#475569" }}>{label}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <div className="text-4xl font-bold tracking-tight mb-1"
           style={{ color, textShadow: `0 0 24px ${color}55` }}>{value}</div>
      <div className="flex items-center justify-between">
        <span className="text-[10px]" style={{ color: "#334155" }}>{sub}</span>
        {trend && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ color: "#f87171", background: "rgba(239,68,68,0.1)" }}>{trend}</span>}
      </div>
    </div>
  );
}

/* ── Risiko-Gauge ── */
function RiskGauge({ score }: { score: number }) {
  const color  = score >= 70 ? "#34d399" : score >= 40 ? "#fbbf24" : "#f87171";
  const label  = score >= 70 ? "SICHER" : score >= 40 ? "MODERAT" : "KRITISCH";
  const grad   = score >= 70 ? "conic-gradient(#10b981 0deg, #34d399 VAR, #1e293b VAR, #1e293b 360deg)"
               : score >= 40 ? "conic-gradient(#d97706 0deg, #fbbf24 VAR, #1e293b VAR, #1e293b 360deg)"
               : "conic-gradient(#dc2626 0deg, #f87171 VAR, #1e293b VAR, #1e293b 360deg)";
  const deg    = `${Math.round(score / 100 * 360)}deg`;
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div className="relative w-28 h-28 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full"
             style={{ background: grad.replace("VAR", deg), mask: "radial-gradient(circle at center, transparent 38px, black 39px)" }} />
        <div className="flex flex-col items-center">
          <span className="text-3xl font-bold" style={{ color, textShadow: `0 0 20px ${color}` }}>{score}</span>
          <span className="text-[9px]" style={{ color: "#334155" }}>/ 100</span>
        </div>
      </div>
      <Pill color={color}>{label}</Pill>
    </div>
  );
}

/* ── Mini Balken-Chart ── */
function MiniBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-14 text-[10px] text-right shrink-0" style={{ color: "#475569" }}>{label}</span>
      <div className="flex-1 rounded-full h-1.5 overflow-hidden" style={{ background: "#1e293b" }}>
        <div className="h-1.5 rounded-full transition-all duration-700"
             style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }} />
      </div>
      <span className="w-6 text-[10px] font-bold shrink-0" style={{ color }}>{value}</span>
    </div>
  );
}

/* ── Quick-Scan Widget ── */
function QuickScanWidget({ onGoToScans }: { onGoToScans?: () => void }) {
  const [target, setTarget] = useState("192.168.178.0/24");
  const [scanning, setScanning] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function go() {
    const t = target.trim();
    if (!t || scanning) return;
    setScanning(true); setDone(null); setErr(null);
    try {
      const res = await fetch("http://localhost:8000/api/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: t }),
      });
      if (!res.ok) throw new Error();
      const j = await res.json();
      setDone(`Job #${j.job_id} gestartet — gehe zu Scans für Live-Ergebnisse`);
    } catch {
      setErr("Backend nicht erreichbar (localhost:8000)");
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="rounded-2xl overflow-hidden"
         style={{ background: "linear-gradient(145deg,#061a12,#082418)", border: "1px solid rgba(16,185,129,0.25)" }}>
      <div className="px-5 py-3 flex items-center gap-2"
           style={{ borderBottom: "1px solid rgba(16,185,129,0.1)" }}>
        <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#10b981" }} />
        <span className="text-[11px] uppercase tracking-[0.18em] font-semibold" style={{ color: "#34d399" }}>
          Schnell-Scan
        </span>
      </div>
      <div className="p-5 space-y-3">
        <div className="flex gap-2">
          <input value={target} onChange={(e) => setTarget(e.target.value)}
                 onKeyDown={(e) => e.key === "Enter" && go()}
                 disabled={scanning}
                 className="flex-1 px-3 py-2.5 rounded-xl text-[12px] outline-none"
                 style={{ background: "rgba(2,8,23,0.8)", border: "1px solid rgba(16,185,129,0.2)", color: "#e2e8f0", caretColor: "#10b981" }}
                 placeholder="IP / Netzwerk / Host…" />
          <button onClick={go} disabled={scanning || !target.trim()}
                  className="px-4 py-2.5 rounded-xl text-[12px] font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg,#065f46,#10b981)", color: "#fff", border: "1px solid rgba(16,185,129,0.4)", boxShadow: "0 0 16px rgba(16,185,129,0.25)" }}>
            {scanning ? <span className="w-4 h-4 rounded-full animate-spin inline-block"
                              style={{ border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "#fff" }} /> : "▶ Start"}
          </button>
        </div>
        {done && (
          <div className="flex items-center gap-2 text-[11px] px-3 py-2 rounded-lg"
               style={{ background: "rgba(6,78,59,0.4)", color: "#34d399", border: "1px solid rgba(16,185,129,0.2)" }}>
            ✓ {done}
          </div>
        )}
        {err && (
          <div className="text-[11px] px-3 py-2 rounded-lg"
               style={{ background: "rgba(127,29,29,0.4)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}>
            ✗ {err}
          </div>
        )}
        <p className="text-[9px]" style={{ color: "#1e3a2a" }}>Nmap · Ports 1-1024 · SYN-Scan</p>
      </div>
    </div>
  );
}

/* ── Maßnahmen-Karte (Aktionsplan) ── */
const FIXES: Record<string, string[]> = {
  "CVE-2024-3094":  ["XZ Utils auf ≥ 5.6.2 patchen", "SSH-Daemon neu starten", "Paketintegrität prüfen"],
  "CVE-2024-21762": ["Fortinet FortiOS auf ≥ 7.4.3 updaten", "SSL-VPN vorübergehend deaktivieren", "IOC-Liste von Fortinet anwenden"],
  "CVE-2024-1709":  ["ConnectWise ScreenConnect auf ≥ 23.9.8 updaten", "Fernzugriff sperren bis Patch", "Audit-Logs prüfen"],
  "CVE-2023-50164": ["Apache Struts auf ≥ 6.3.0.2 updaten", "File-Upload deaktivieren falls nicht nötig", "WAF-Regel aktivieren"],
  "CVE-2024-27198": ["JetBrains TeamCity auf ≥ 2023.11.4 updaten", "Externes Netz sperren", "Admin-Passwörter rotieren"],
  "CVE-2024-6387":  ["OpenSSH auf ≥ 9.8p1 updaten", "LoginGraceTime auf 0 setzen", "SSH auf Basis-Firewall beschränken"],
  "CVE-2024-4040":  ["CrushFTP auf ≥ 10.7.1 updaten", "Port 8080 sperren", "Session-Tokens invalidieren"],
};

/* ── Hauptkomponente ── */
export function OverviewTab({ data, onNavigate }: { data: DashboardData; onNavigate?: (tab: string) => void }) {
  const { vulnerabilities, threats, networkEvents } = data;

  const critOpen    = vulnerabilities.filter((v) => v.severity === "critical" && v.status === "open");
  const activeThreats = threats.filter((t) => t.status === "active").length;
  const blocked     = networkEvents.filter((e) => e.action === "blocked").length;
  const openVulns   = vulnerabilities.filter((v) => v.status === "open").length;
  const patched     = vulnerabilities.filter((v) => v.status === "patched").length;

  const cp = critOpen.length * 8;
  const hp = vulnerabilities.filter((v) => v.severity === "high" && v.status === "open").length * 4;
  const tp = activeThreats * 6;
  const riskScore = Math.max(0, Math.min(100, 100 - cp - hp - tp));

  const bySeverity = ["critical", "high", "medium", "low"];
  const total = vulnerabilities.length;

  const recentEvents = [...networkEvents]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  return (
    <div className="p-5 space-y-5 max-w-[1600px] mx-auto">

      {/* ── ROW 1: KPIs + Risk ── */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        <KpiCard label="Kritische CVEs"         value={critOpen.length} color="#f87171" icon="🔴" sub="Sofortiger Handlungsbedarf" trend={critOpen.length > 0 ? `+${critOpen.length}` : undefined} />
        <KpiCard label="Aktive Bedrohungen"     value={activeThreats}   color="#fb923c" icon="☠️" sub="In Beobachtung" />
        <KpiCard label="Blockierte Ereignisse"  value={blocked}         color="#34d399" icon="🛡️" sub="Letzte 24h" />
        <KpiCard label="Offene Schwachstellen"  value={openVulns}       color="#fbbf24" icon="⚠️" sub="Auf allen Hosts" />
        <KpiCard label="Gepatcht"               value={patched}         color="#60a5fa" icon="✅" sub="Erfolgreich behoben" />
      </div>

      {/* ── ROW 2: Risiko + Verteilung + Schnell-Scan ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Risiko-Score */}
        <div className="rounded-2xl p-6 flex flex-col items-center justify-center gap-4"
             style={{ background: "linear-gradient(145deg,#0c1525,#0f1d2e)", border: "1px solid rgba(30,41,59,0.8)" }}>
          <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: "#475569" }}>Sicherheits-Risikoscore</span>
          <RiskGauge score={riskScore} />
          <div className="w-full space-y-1.5 text-[10px]" style={{ color: "#334155" }}>
            <div className="flex justify-between"><span>Kritische Vulns</span><span style={{ color: "#f87171" }}>−{cp}</span></div>
            <div className="flex justify-between"><span>Hohe Vulns</span><span style={{ color: "#fb923c" }}>−{hp}</span></div>
            <div className="flex justify-between"><span>Aktive Bedrohungen</span><span style={{ color: "#fbbf24" }}>−{tp}</span></div>
          </div>
        </div>

        {/* Schweregrad-Verteilung */}
        <div className="rounded-2xl p-5"
             style={{ background: "linear-gradient(145deg,#0c1525,#0f1d2e)", border: "1px solid rgba(30,41,59,0.8)" }}>
          <SectionHeader icon="◈" title="Schweregrad-Verteilung" />
          <div className="space-y-4 mt-2">
            {[
              { s: "critical", label: "Kritisch", color: "#f87171" },
              { s: "high",     label: "Hoch",     color: "#fb923c" },
              { s: "medium",   label: "Mittel",   color: "#fbbf24" },
              { s: "low",      label: "Niedrig",  color: "#60a5fa" },
            ].map(({ s, label, color }) => (
              <div key={s}>
                <MiniBar
                  label={label}
                  value={vulnerabilities.filter((v) => v.severity === s).length}
                  max={total}
                  color={color}
                />
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 grid grid-cols-2 gap-3" style={{ borderTop: "1px solid rgba(30,41,59,0.5)" }}>
            <div className="text-center">
              <div className="text-xl font-bold" style={{ color: "#34d399" }}>{patched}</div>
              <div className="text-[9px] mt-0.5" style={{ color: "#334155" }}>Gepatcht</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold" style={{ color: "#fbbf24" }}>
                {vulnerabilities.filter((v) => v.status === "investigating").length}
              </div>
              <div className="text-[9px] mt-0.5" style={{ color: "#334155" }}>In Bearbeitung</div>
            </div>
          </div>
        </div>

        {/* Quick-Scan */}
        <QuickScanWidget />
      </div>

      {/* ── ROW 3: Kritische Maßnahmen + Events ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sofortige Maßnahmen */}
        <div className="lg:col-span-2 rounded-2xl overflow-hidden"
             style={{ background: "linear-gradient(145deg,#0c1525,#0f1d2e)", border: "1px solid rgba(248,113,113,0.2)" }}>
          <div className="px-5 py-3 flex items-center gap-2"
               style={{ borderBottom: "1px solid rgba(248,113,113,0.1)", background: "rgba(239,68,68,0.04)" }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#f87171" }} />
            <span className="text-[11px] uppercase tracking-[0.18em] font-semibold" style={{ color: "#f87171" }}>
              Sofortige Maßnahmen erforderlich
            </span>
            <Pill color="#f87171">{critOpen.length}</Pill>
          </div>
          <div className="divide-y" style={{ borderColor: "rgba(30,41,59,0.4)" }}>
            {critOpen.slice(0, 5).map((v) => {
              const fixes = FIXES[v.id] ?? ["Patch einspielen", "System isolieren", "Vendor-Advisory prüfen"];
              return (
                <ActionRow key={v.id} v={v} fixes={fixes} />
              );
            })}
            {critOpen.length === 0 && (
              <div className="p-6 text-center text-[12px]" style={{ color: "#34d399" }}>
                ✓ Keine kritischen offenen Schwachstellen
              </div>
            )}
          </div>
        </div>

        {/* Events + Threats */}
        <div className="space-y-4">
          {/* Live-Events */}
          <div className="rounded-2xl overflow-hidden"
               style={{ background: "linear-gradient(145deg,#0c1525,#0f1d2e)", border: "1px solid rgba(30,41,59,0.8)" }}>
            <div className="px-5 py-3" style={{ borderBottom: "1px solid rgba(30,41,59,0.5)" }}>
              <SectionHeader icon="⬡" title="Netzwerk-Events" />
            </div>
            <div className="divide-y" style={{ borderColor: "rgba(30,41,59,0.3)" }}>
              {recentEvents.map((e) => (
                <div key={e.id} className="px-4 py-2.5 flex items-center gap-3">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
                        style={e.action === "blocked"
                          ? { background: "rgba(6,78,59,0.4)", color: "#34d399", border: "1px solid rgba(16,185,129,0.2)" }
                          : { background: "rgba(127,29,29,0.4)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}>
                    {e.action === "blocked" ? "BLOCK" : "PASS"}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[10px] font-medium truncate" style={{ color: "#94a3b8" }}>{e.category}</div>
                    <div className="text-[9px] font-mono" style={{ color: "#334155" }}>{e.srcIp}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bedrohungsakteure */}
          <div className="rounded-2xl overflow-hidden"
               style={{ background: "linear-gradient(145deg,#0c1525,#0f1d2e)", border: "1px solid rgba(30,41,59,0.8)" }}>
            <div className="px-5 py-3" style={{ borderBottom: "1px solid rgba(30,41,59,0.5)" }}>
              <SectionHeader icon="☣" title="Aktive Bedrohungen" count={activeThreats} color="#fb923c" />
            </div>
            <div className="divide-y" style={{ borderColor: "rgba(30,41,59,0.3)" }}>
              {threats.filter((t) => t.status === "active").map((t) => (
                <div key={t.id} className="px-4 py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold truncate" style={{ color: "#e2e8f0" }}>{t.name}</div>
                    <div className="text-[9px] font-mono" style={{ color: "#f87171" }}>{t.ioc}</div>
                  </div>
                  <SeverityBadge severity={t.severity} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Aufklappbare Maßnahmen-Zeile ── */
function ActionRow({ v, fixes }: { v: { id: string; name: string; host: string; cvss: number; severity: string }; fixes: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full px-5 py-3.5 flex items-center gap-4 text-left transition-colors cursor-pointer"
        style={{ background: open ? "rgba(239,68,68,0.04)" : "transparent" }}
        onMouseEnter={(e) => { if (!open) (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.03)"; }}
        onMouseLeave={(e) => { if (!open) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[11px] font-bold" style={{ color: "#f87171" }}>{v.id}</span>
            <span className="text-[10px] font-bold" style={{ color: v.cvss >= 9 ? "#f87171" : "#fb923c" }}>CVSS {v.cvss}</span>
          </div>
          <div className="text-[11px] truncate" style={{ color: "#94a3b8" }}>{v.name}</div>
          <div className="text-[9px] font-mono mt-0.5" style={{ color: "#334155" }}>{v.host}</div>
        </div>
        <span className="shrink-0 text-[10px] font-bold transition-transform duration-200"
              style={{ color: "#f87171", transform: open ? "rotate(180deg)" : "none" }}>▾</span>
      </button>

      {open && (
        <div className="px-5 pb-4 animate-fade-in">
          <div className="rounded-xl p-4 space-y-2"
               style={{ background: "rgba(2,8,23,0.6)", border: "1px solid rgba(16,185,129,0.15)" }}>
            <div className="text-[10px] uppercase tracking-[0.15em] font-semibold mb-3" style={{ color: "#34d399" }}>
              ✓ Empfohlene Maßnahmen
            </div>
            {fixes.map((fix, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px]" style={{ color: "#94a3b8" }}>
                <span className="shrink-0 font-bold" style={{ color: "#10b981" }}>{i + 1}.</span>
                {fix}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
