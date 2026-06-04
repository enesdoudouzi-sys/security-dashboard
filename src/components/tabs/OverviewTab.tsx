"use client";
import { StatCard } from "@/components/ui/StatCard";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import type { DashboardData } from "@/types";

export function OverviewTab({ data }: { data: DashboardData }) {
  const { vulnerabilities, threats, networkEvents } = data;

  const criticalVulns = vulnerabilities.filter((v) => v.severity === "critical" && v.status === "open").length;
  const activeThreats = threats.filter((t) => t.status === "active").length;
  const blockedEvents = networkEvents.filter((e) => e.action === "blocked").length;
  const openVulns = vulnerabilities.filter((v) => v.status === "open").length;

  const bySeverity = ["critical", "high", "medium", "low"].map((s) => ({
    severity: s,
    count: vulnerabilities.filter((v) => v.severity === s).length,
  }));

  const topVulns = vulnerabilities.filter((v) => v.status === "open").sort((a, b) => b.cvss - a.cvss).slice(0, 5);
  const recentEvents = [...networkEvents].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);

  const criticalPenalty = vulnerabilities.filter((v) => v.severity === "critical" && v.status === "open").length * 8;
  const highPenalty = vulnerabilities.filter((v) => v.severity === "high" && v.status === "open").length * 4;
  const activeThreatPenalty = threats.filter((t) => t.status === "active").length * 6;
  const riskScore = Math.max(0, Math.min(100, 100 - criticalPenalty - highPenalty - activeThreatPenalty));
  const riskLabel = riskScore >= 70 ? "GUT" : riskScore >= 40 ? "MODERAT" : "KRITISCH";
  const riskColor = riskScore >= 70 ? "text-green-400" : riskScore >= 40 ? "text-yellow-400" : "text-red-400";
  const riskBorder = riskScore >= 70 ? "border-green-800" : riskScore >= 40 ? "border-yellow-800" : "border-red-800";
  const riskBg    = riskScore >= 70 ? "bg-green-500" : riskScore >= 40 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="p-6 space-y-6">
      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Kritische CVEs" value={criticalVulns} color="text-red-400" icon="🔴" sub="Sofortiger Handlungsbedarf" />
        <StatCard label="Aktive Bedrohungen" value={activeThreats} color="text-orange-400" icon="☠" sub="In Beobachtung" />
        <StatCard label="Blockierte Ereignisse" value={blockedEvents} color="text-green-400" icon="🛡" sub="Letzte 24 Stunden" />
        <StatCard label="Offene Schwachstellen" value={openVulns} color="text-yellow-400" icon="⚠" sub="Auf allen Hosts" />
      </div>

      {/* Risikoscore */}
      <div className={`bg-gray-900 border ${riskBorder} rounded-xl p-5 flex items-center gap-6`}>
        <div className="text-center min-w-[90px]">
          <div className={`text-5xl font-bold ${riskColor}`}>{riskScore}</div>
          <div className="text-gray-600 text-xs mt-1">von 100</div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Sicherheits-Risikoscore</span>
            <span className={`px-2 py-0.5 rounded text-xs font-bold border ${riskColor} ${riskBorder}`}>{riskLabel}</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
            <div className={`${riskBg} h-3 rounded-full transition-all duration-700`} style={{ width: `${riskScore}%` }} />
          </div>
          <div className="text-gray-600 text-xs mt-2 flex gap-4">
            <span>-{criticalPenalty} kritisch</span>
            <span>-{highPenalty} hoch</span>
            <span>-{activeThreatPenalty} aktive Bedrohungen</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Schwachstellen-Übersicht */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-4">Schwachstellen-Übersicht</h2>
          <div className="space-y-3">
            {bySeverity.map(({ severity, count }) => {
              const barColors: Record<string, string> = { critical: "bg-red-500", high: "bg-orange-500", medium: "bg-yellow-500", low: "bg-blue-500" };
              const pct = Math.round((count / vulnerabilities.length) * 100);
              return (
                <div key={severity}>
                  <div className="flex justify-between text-xs mb-1">
                    <SeverityBadge severity={severity} />
                    <span className="text-gray-300">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div className={`${barColors[severity]} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top CVEs */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-4">Top offene CVEs (CVSS)</h2>
          <div className="space-y-2.5">
            {topVulns.map((v) => (
              <div key={v.id} className="flex items-center justify-between text-xs border-b border-gray-800/80 pb-2.5">
                <div>
                  <span className="text-red-400 font-bold">{v.id}</span>
                  <p className="text-gray-400 truncate max-w-[160px] mt-0.5">{v.name}</p>
                </div>
                <div className="text-right">
                  <span className={`font-bold text-sm ${v.cvss >= 9 ? "text-red-400" : "text-orange-400"}`}>{v.cvss}</span>
                  <p className="text-gray-600 text-[10px] mt-0.5">{v.host}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Aktuelle Netzwerkereignisse */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-4">Aktuelle Netzwerkereignisse</h2>
          <div className="space-y-2.5">
            {recentEvents.map((e) => (
              <div key={e.id} className="text-xs border-b border-gray-800/80 pb-2.5">
                <div className="flex justify-between mb-0.5">
                  <span className="text-gray-300 font-medium">{e.category}</span>
                  <span className={`font-bold text-[10px] px-1.5 py-0.5 rounded ${e.action === "blocked" ? "bg-green-900/40 text-green-400" : "bg-red-900/40 text-red-400"}`}>
                    {e.action === "blocked" ? "BLOCKIERT" : "ERLAUBT"}
                  </span>
                </div>
                <div className="text-gray-600 font-mono text-[10px]">
                  {e.srcIp} → {e.dstIp}:{e.dstPort ?? "–"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Aktive Bedrohungsakteure */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-xs uppercase tracking-widest text-gray-400 font-semibold mb-4">Aktive Bedrohungsakteure</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {threats.filter((t) => t.status === "active" || t.status === "investigating").map((t) => (
            <div key={t.id} className="border border-gray-800 rounded-lg p-3 hover:border-gray-600 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <span className="text-white text-xs font-bold">{t.name}</span>
                <SeverityBadge severity={t.severity} />
              </div>
              <div className="text-gray-500 text-xs space-y-1">
                <div>Typ: <span className="text-gray-300">{t.type}</span></div>
                <div>IOC: <span className="text-red-400 font-mono">{t.ioc}</span></div>
                <div>Betroffene Systeme: <span className="text-orange-400 font-bold">{t.affectedSystems}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
