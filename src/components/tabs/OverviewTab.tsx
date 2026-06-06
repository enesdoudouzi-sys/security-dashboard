"use client";
import { StatCard } from "@/components/ui/StatCard";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import type { DashboardData } from "@/types";

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl p-5 ${className}`}
         style={{ background: "linear-gradient(135deg, #0d1117 0%, #111827 100%)", border: "1px solid #1f2937" }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[10px] uppercase tracking-[0.2em] font-semibold mb-4 flex items-center gap-2"
        style={{ color: "#6b7280" }}>
      <span className="w-3 h-px" style={{ background: "#10b981" }} />
      {children}
    </h2>
  );
}

export function OverviewTab({ data }: { data: DashboardData }) {
  const { vulnerabilities, threats, networkEvents } = data;

  const criticalVulns  = vulnerabilities.filter((v) => v.severity === "critical" && v.status === "open").length;
  const activeThreats  = threats.filter((t) => t.status === "active").length;
  const blockedEvents  = networkEvents.filter((e) => e.action === "blocked").length;
  const openVulns      = vulnerabilities.filter((v) => v.status === "open").length;

  const bySeverity = ["critical", "high", "medium", "low"].map((s) => ({
    severity: s,
    count: vulnerabilities.filter((v) => v.severity === s).length,
  }));

  const topVulns     = vulnerabilities.filter((v) => v.status === "open").sort((a, b) => b.cvss - a.cvss).slice(0, 5);
  const recentEvents = [...networkEvents].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);

  const criticalPenalty    = vulnerabilities.filter((v) => v.severity === "critical" && v.status === "open").length * 8;
  const highPenalty        = vulnerabilities.filter((v) => v.severity === "high" && v.status === "open").length * 4;
  const activeThreatPenalty = threats.filter((t) => t.status === "active").length * 6;
  const riskScore = Math.max(0, Math.min(100, 100 - criticalPenalty - highPenalty - activeThreatPenalty));
  const riskLabel = riskScore >= 70 ? "GUT" : riskScore >= 40 ? "MODERAT" : "KRITISCH";

  const riskGradient = riskScore >= 70
    ? "linear-gradient(90deg, #065f46, #10b981)"
    : riskScore >= 40
    ? "linear-gradient(90deg, #78350f, #f59e0b)"
    : "linear-gradient(90deg, #7f1d1d, #ef4444)";

  const riskColor  = riskScore >= 70 ? "#34d399" : riskScore >= 40 ? "#fbbf24" : "#f87171";
  const riskBorder = riskScore >= 70 ? "#064e3b" : riskScore >= 40 ? "#78350f" : "#7f1d1d";

  const barColors: Record<string, string> = {
    critical: "linear-gradient(90deg, #7f1d1d, #ef4444)",
    high:     "linear-gradient(90deg, #7c2d12, #f97316)",
    medium:   "linear-gradient(90deg, #713f12, #eab308)",
    low:      "linear-gradient(90deg, #1e3a5f, #3b82f6)",
  };

  return (
    <div className="p-5 space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Kritische CVEs"       value={criticalVulns} color="text-red-400"    icon="🔴" sub="Sofortiger Handlungsbedarf" accent="#7f1d1d" />
        <StatCard label="Aktive Bedrohungen"   value={activeThreats} color="text-orange-400" icon="☠"  sub="In Beobachtung"            accent="#7c2d12" />
        <StatCard label="Blockierte Ereignisse" value={blockedEvents} color="text-emerald-400" icon="🛡" sub="Letzte 24 Stunden"         accent="#064e3b" />
        <StatCard label="Offene Schwachstellen" value={openVulns}    color="text-yellow-400" icon="⚠"  sub="Auf allen Hosts"           accent="#713f12" />
      </div>

      {/* Risk Score */}
      <div className="rounded-xl p-5"
           style={{ background: "linear-gradient(135deg, #0d1117, #111827)", border: `1px solid ${riskBorder}` }}>
        <div className="flex items-center gap-6">
          <div className="text-center min-w-[100px]">
            <div className="text-5xl font-bold tracking-tight" style={{ color: riskColor, textShadow: `0 0 30px ${riskColor}60` }}>
              {riskScore}
            </div>
            <div className="text-gray-600 text-[10px] mt-1">/ 100</div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-semibold">Sicherheits-Risikoscore</span>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold"
                    style={{ background: `${riskColor}20`, color: riskColor, border: `1px solid ${riskColor}50` }}>
                {riskLabel}
              </span>
            </div>
            <div className="w-full bg-gray-800/60 rounded-full h-3 overflow-hidden">
              <div className="h-3 rounded-full transition-all duration-700"
                   style={{ width: `${riskScore}%`, background: riskGradient }} />
            </div>
            <div className="text-gray-600 text-[10px] mt-2 flex gap-4 flex-wrap">
              <span className="text-red-500">−{criticalPenalty} kritisch</span>
              <span className="text-orange-500">−{highPenalty} hoch</span>
              <span className="text-orange-400">−{activeThreatPenalty} aktive Bedrohungen</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Severity Breakdown */}
        <Card>
          <SectionTitle>Schwachstellen nach Schweregrad</SectionTitle>
          <div className="space-y-3">
            {bySeverity.map(({ severity, count }) => {
              const pct = Math.round((count / vulnerabilities.length) * 100);
              return (
                <div key={severity}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <SeverityBadge severity={severity} />
                    <span className="text-gray-300 font-mono">{count} <span className="text-gray-600">({pct}%)</span></span>
                  </div>
                  <div className="w-full bg-gray-800/60 rounded-full h-1.5 overflow-hidden">
                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: barColors[severity] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Top CVEs */}
        <Card>
          <SectionTitle>Top CVEs nach CVSS</SectionTitle>
          <div className="space-y-3">
            {topVulns.map((v) => (
              <div key={v.id} className="flex items-center justify-between border-b pb-3"
                   style={{ borderColor: "#1f2937" }}>
                <div>
                  <span className="text-[11px] font-bold" style={{ color: "#f87171" }}>{v.id}</span>
                  <p className="text-gray-500 text-[10px] truncate max-w-[155px] mt-0.5">{v.name}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-sm" style={{ color: v.cvss >= 9 ? "#f87171" : "#fb923c", textShadow: "0 0 10px currentColor" }}>
                    {v.cvss}
                  </span>
                  <p className="text-gray-600 text-[10px] mt-0.5 font-mono">{v.host}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Events */}
        <Card>
          <SectionTitle>Aktuelle Netzwerkereignisse</SectionTitle>
          <div className="space-y-3">
            {recentEvents.map((e) => (
              <div key={e.id} className="border-b pb-3" style={{ borderColor: "#1f2937" }}>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-300 text-[11px] font-medium">{e.category}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={e.action === "blocked"
                          ? { background: "rgba(6,78,59,0.5)", color: "#34d399", border: "1px solid #065f46" }
                          : { background: "rgba(127,29,29,0.5)", color: "#f87171", border: "1px solid #991b1b" }}>
                    {e.action === "blocked" ? "BLOCK" : "PASS"}
                  </span>
                </div>
                <div className="text-gray-600 font-mono text-[10px]">{e.srcIp} → {e.dstIp}:{e.dstPort ?? "–"}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Active Threats */}
      <Card>
        <SectionTitle>Aktive Bedrohungsakteure</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {threats.filter((t) => t.status === "active" || t.status === "investigating").map((t) => (
            <div key={t.id} className="rounded-lg p-3 transition-colors hover:border-gray-600"
                 style={{ border: "1px solid #1f2937", background: "#0a0f1a" }}>
              <div className="flex justify-between items-start mb-2">
                <span className="text-white text-[11px] font-bold">{t.name}</span>
                <SeverityBadge severity={t.severity} />
              </div>
              <div className="space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-gray-600">Typ</span>
                  <span className="text-gray-300">{t.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">IOC</span>
                  <span className="font-mono" style={{ color: "#f87171" }}>{t.ioc}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Betroffene Systeme</span>
                  <span className="font-bold" style={{ color: "#fb923c" }}>{t.affectedSystems}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
