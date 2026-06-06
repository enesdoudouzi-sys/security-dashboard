"use client";
import { StatCard } from "@/components/ui/StatCard";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import type { DashboardData } from "@/types";

function Card({ children, title, accent }: { children: React.ReactNode; title?: string; accent?: string }) {
  return (
    <div className="rounded-xl overflow-hidden"
         style={{ background: "linear-gradient(135deg, #0f172a, #0d1b2a)", border: "1px solid rgba(30,41,59,0.8)" }}>
      {title && (
        <div className="px-5 py-3 flex items-center gap-2"
             style={{ borderBottom: "1px solid rgba(30,41,59,0.6)", background: "rgba(15,23,42,0.5)" }}>
          {accent && <span className="w-2 h-2 rounded-full" style={{ background: accent }} />}
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold" style={{ color: "#64748b" }}>{title}</span>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

export function OverviewTab({ data }: { data: DashboardData }) {
  const { vulnerabilities, threats, networkEvents } = data;

  const criticalVulns   = vulnerabilities.filter((v) => v.severity === "critical" && v.status === "open").length;
  const activeThreats   = threats.filter((t) => t.status === "active").length;
  const blockedEvents   = networkEvents.filter((e) => e.action === "blocked").length;
  const openVulns       = vulnerabilities.filter((v) => v.status === "open").length;

  const bySeverity = ["critical", "high", "medium", "low"].map((s) => ({
    severity: s,
    count: vulnerabilities.filter((v) => v.severity === s).length,
  }));

  const topVulns     = vulnerabilities.filter((v) => v.status === "open").sort((a, b) => b.cvss - a.cvss).slice(0, 5);
  const recentEvents = [...networkEvents].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 6);

  const criticalPenalty     = vulnerabilities.filter((v) => v.severity === "critical" && v.status === "open").length * 8;
  const highPenalty         = vulnerabilities.filter((v) => v.severity === "high" && v.status === "open").length * 4;
  const activeThreatPenalty = threats.filter((t) => t.status === "active").length * 6;
  const riskScore = Math.max(0, Math.min(100, 100 - criticalPenalty - highPenalty - activeThreatPenalty));
  const riskLabel = riskScore >= 70 ? "SICHER" : riskScore >= 40 ? "MODERAT" : "KRITISCH";
  const riskColor  = riskScore >= 70 ? "#34d399" : riskScore >= 40 ? "#fbbf24" : "#f87171";
  const riskGrad   = riskScore >= 70
    ? "linear-gradient(90deg, #064e3b, #10b981, #34d399)"
    : riskScore >= 40
    ? "linear-gradient(90deg, #78350f, #d97706, #fbbf24)"
    : "linear-gradient(90deg, #7f1d1d, #dc2626, #f87171)";

  const barGrads: Record<string, string> = {
    critical: "linear-gradient(90deg, #7f1d1d, #ef4444)",
    high:     "linear-gradient(90deg, #7c2d12, #f97316)",
    medium:   "linear-gradient(90deg, #713f12, #eab308)",
    low:      "linear-gradient(90deg, #1e3a5f, #3b82f6)",
  };

  return (
    <div className="p-5 space-y-5 max-w-screen-2xl mx-auto">
      {/* KPI Row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Kritische CVEs"        value={criticalVulns} color="#f87171" accentColor="#ef4444"
                  icon={<span style={{ color: "#f87171" }}>🔴</span>} sub="Sofortiger Handlungsbedarf" />
        <StatCard label="Aktive Bedrohungen"    value={activeThreats} color="#fb923c" accentColor="#f97316"
                  icon={<span>☠️</span>} sub="Werden beobachtet" />
        <StatCard label="Blockierte Ereignisse" value={blockedEvents} color="#34d399" accentColor="#10b981"
                  icon={<span>🛡️</span>} sub="Letzte 24 Stunden" />
        <StatCard label="Offene Schwachstellen" value={openVulns}    color="#fbbf24" accentColor="#f59e0b"
                  icon={<span>⚠️</span>} sub="Auf allen Hosts" />
      </div>

      {/* Risk Score */}
      <div className="rounded-xl p-5"
           style={{ background: "linear-gradient(135deg, #0f172a, #0d1b2a)", border: `1px solid ${riskColor}25` }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="text-center min-w-[120px]">
            <div className="text-6xl font-bold tracking-tight animate-glow" style={{ color: riskColor }}>
              {riskScore}
            </div>
            <div className="text-[10px] mt-1" style={{ color: "#374151" }}>von 100</div>
          </div>
          <div className="flex-1 w-full">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: "#64748b" }}>Sicherheits-Risikoscore</span>
              <span className="px-3 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ background: `${riskColor}15`, color: riskColor, border: `1px solid ${riskColor}40` }}>
                {riskLabel}
              </span>
            </div>
            <div className="w-full rounded-full h-4 overflow-hidden" style={{ background: "rgba(30,41,59,0.6)" }}>
              <div className="h-4 rounded-full transition-all duration-1000"
                   style={{ width: `${riskScore}%`, background: riskGrad, boxShadow: `0 0 12px ${riskColor}60` }} />
            </div>
            <div className="flex gap-6 mt-3 text-[10px]" style={{ color: "#4b5563" }}>
              <span style={{ color: "#f87171" }}>−{criticalPenalty} kritisch</span>
              <span style={{ color: "#fb923c" }}>−{highPenalty} hoch</span>
              <span style={{ color: "#f97316" }}>−{activeThreatPenalty} bedrohungen</span>
            </div>
          </div>
        </div>
      </div>

      {/* Three columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Severity */}
        <Card title="Schweregrad-Verteilung" accent="#6366f1">
          <div className="space-y-4">
            {bySeverity.map(({ severity, count }) => {
              const pct = Math.round((count / Math.max(vulnerabilities.length, 1)) * 100);
              return (
                <div key={severity}>
                  <div className="flex justify-between items-center mb-1.5">
                    <SeverityBadge severity={severity} />
                    <span className="text-[11px] font-mono" style={{ color: "#94a3b8" }}>
                      {count} <span style={{ color: "#374151" }}>({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ background: "rgba(30,41,59,0.6)" }}>
                    <div className="h-1.5 rounded-full transition-all duration-700"
                         style={{ width: `${pct}%`, background: barGrads[severity] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Top CVEs */}
        <Card title="Top CVEs nach CVSS" accent="#ef4444">
          <div className="space-y-3">
            {topVulns.map((v) => (
              <div key={v.id} className="flex items-center gap-3 py-2.5"
                   style={{ borderBottom: "1px solid rgba(30,41,59,0.5)" }}>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold" style={{ color: "#f87171" }}>{v.id}</div>
                  <div className="text-[10px] truncate mt-0.5" style={{ color: "#4b5563" }}>{v.name}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-base font-bold" style={{ color: v.cvss >= 9 ? "#f87171" : "#fb923c", textShadow: "0 0 10px currentColor" }}>
                    {v.cvss}
                  </div>
                  <div className="text-[9px] font-mono mt-0.5" style={{ color: "#374151" }}>{v.host}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Events */}
        <Card title="Netzwerkereignisse" accent="#10b981">
          <div className="space-y-3">
            {recentEvents.map((e) => (
              <div key={e.id} className="flex items-start justify-between gap-2 py-2"
                   style={{ borderBottom: "1px solid rgba(30,41,59,0.5)" }}>
                <div className="min-w-0">
                  <div className="text-[11px] font-medium" style={{ color: "#cbd5e1" }}>{e.category}</div>
                  <div className="text-[10px] font-mono mt-0.5" style={{ color: "#374151" }}>
                    {e.srcIp} → {e.dstIp}:{e.dstPort ?? "–"}
                  </div>
                </div>
                <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded"
                      style={e.action === "blocked"
                        ? { background: "rgba(6,78,59,0.5)", color: "#34d399", border: "1px solid rgba(16,185,129,0.3)" }
                        : { background: "rgba(127,29,29,0.5)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}>
                  {e.action === "blocked" ? "BLOCK" : "PASS"}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Active Threats */}
      <Card title="Aktive Bedrohungsakteure" accent="#f97316">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {threats.filter((t) => t.status === "active" || t.status === "investigating").map((t) => (
            <div key={t.id} className="rounded-lg p-4 transition-all hover:scale-[1.01]"
                 style={{ background: "rgba(15,23,42,0.7)", border: "1px solid rgba(30,41,59,0.6)" }}>
              <div className="flex justify-between items-start mb-3">
                <div className="text-[12px] font-bold" style={{ color: "#e2e8f0" }}>{t.name}</div>
                <SeverityBadge severity={t.severity} />
              </div>
              <div className="space-y-1.5 text-[10px]">
                <Row label="Typ" value={t.type} />
                <Row label="IOC" value={t.ioc} valueColor="#f87171" mono />
                <Row label="Systeme" value={t.affectedSystems} valueColor="#fb923c" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Row({ label, value, valueColor, mono }: { label: string; value: string | number; valueColor?: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <span style={{ color: "#4b5563" }}>{label}</span>
      <span className={mono ? "font-mono" : ""} style={{ color: valueColor ?? "#94a3b8" }}>{value}</span>
    </div>
  );
}
