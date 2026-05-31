"use client";
import { StatCard } from "./StatCard";
import { SeverityBadge } from "./SeverityBadge";
import type { DashboardData } from "../types";

export function OverviewTab({ data }: { data: DashboardData }) {
  const { vulnerabilities, threats, networkEvents, scans } = data;

  const criticalVulns = vulnerabilities.filter((v) => v.severity === "critical" && v.status === "open").length;
  const activeThreats = threats.filter((t) => t.status === "active").length;
  const blockedEvents = networkEvents.filter((e) => e.action === "blocked").length;
  const openVulns = vulnerabilities.filter((v) => v.status === "open").length;

  const bySeverity = ["critical", "high", "medium", "low"].map((s) => ({
    severity: s,
    count: vulnerabilities.filter((v) => v.severity === s).length,
  }));

  const topVulns = vulnerabilities
    .filter((v) => v.status === "open")
    .sort((a, b) => b.cvss - a.cvss)
    .slice(0, 5);

  const recentEvents = [...networkEvents]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Critical Open CVEs" value={criticalVulns} color="text-red-400" icon="🔴" sub="Immediate action required" />
        <StatCard label="Active Threats" value={activeThreats} color="text-orange-400" icon="☠" sub="Being tracked" />
        <StatCard label="Blocked Events" value={blockedEvents} color="text-green-400" icon="🛡" sub="Last 24 hours" />
        <StatCard label="Open Vulnerabilities" value={openVulns} color="text-yellow-400" icon="⚠" sub="Across all hosts" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Severity breakdown */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-4">Vulnerability Breakdown</h2>
          <div className="space-y-3">
            {bySeverity.map(({ severity, count }) => {
              const barColors: Record<string, string> = {
                critical: "bg-red-500",
                high: "bg-orange-500",
                medium: "bg-yellow-500",
                low: "bg-blue-500",
              };
              const pct = Math.round((count / vulnerabilities.length) * 100);
              return (
                <div key={severity}>
                  <div className="flex justify-between text-xs mb-1">
                    <SeverityBadge severity={severity} />
                    <span className="text-gray-300">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-1.5">
                    <div className={`${barColors[severity]} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top CVEs */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-4">Top Open CVEs (by CVSS)</h2>
          <div className="space-y-2">
            {topVulns.map((v) => (
              <div key={v.id} className="flex items-center justify-between text-xs border-b border-gray-800 pb-2">
                <div>
                  <span className="text-red-400 font-bold">{v.id}</span>
                  <p className="text-gray-400 truncate max-w-[160px]">{v.name}</p>
                </div>
                <div className="text-right">
                  <span className="text-white font-bold">{v.cvss}</span>
                  <p className="text-gray-500">{v.host}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent network events */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-4">Recent Network Events</h2>
          <div className="space-y-2">
            {recentEvents.map((e) => (
              <div key={e.id} className="text-xs border-b border-gray-800 pb-2">
                <div className="flex justify-between mb-0.5">
                  <span className="text-gray-300">{e.category}</span>
                  <span className={e.action === "blocked" ? "text-green-400" : "text-red-400"}>
                    {e.action.toUpperCase()}
                  </span>
                </div>
                <div className="text-gray-500">
                  {e.srcIp} → {e.dstIp}:{e.dstPort ?? "–"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active threat actors */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
        <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-4">Active Threat Actors</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {threats
            .filter((t) => t.status === "active" || t.status === "investigating")
            .map((t) => (
              <div key={t.id} className="border border-gray-800 rounded p-3">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-white text-xs font-bold">{t.name}</span>
                  <SeverityBadge severity={t.severity} />
                </div>
                <div className="text-gray-500 text-xs space-y-0.5">
                  <div>Type: <span className="text-gray-300">{t.type}</span></div>
                  <div>IOC: <span className="text-red-400 font-mono">{t.ioc}</span></div>
                  <div>Affected Systems: <span className="text-orange-400">{t.affectedSystems}</span></div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
