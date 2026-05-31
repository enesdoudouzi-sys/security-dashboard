"use client";
import { useState } from "react";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import type { Threat } from "@/types";

const STATUS_STYLES: Record<string, string> = {
  active:        "bg-red-900/50 text-red-300 border-red-700",
  monitoring:    "bg-yellow-900/50 text-yellow-300 border-yellow-700",
  blocked:       "bg-green-900/50 text-green-300 border-green-700",
  investigating: "bg-orange-900/50 text-orange-300 border-orange-700",
};

const TYPE_ICONS: Record<string, string> = {
  Ransomware:     "💀",
  APT:            "🎯",
  Trojan:         "🐴",
  Botnet:         "🤖",
  "C2 Framework": "📡",
};

type ThreatStatus = Threat["status"];

export function ThreatsTab({ threats }: { threats: Threat[] }) {
  const [statuses, setStatuses] = useState<Record<string, ThreatStatus>>(
    () => Object.fromEntries(threats.map((t) => [t.id, t.status]))
  );
  const [toast, setToast] = useState<string | null>(null);

  function update(id: string, status: ThreatStatus, msg: string) {
    setStatuses((prev) => ({ ...prev, [id]: status }));
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  return (
    <div className="p-6 space-y-6 relative">
      {toast && (
        <div className="fixed top-16 right-6 z-50 bg-gray-800 border border-green-700 text-green-300 text-xs px-4 py-2.5 rounded shadow-lg animate-pulse">
          {toast}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {threats.map((t) => {
          const status = statuses[t.id];
          return (
            <div
              key={t.id}
              className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{TYPE_ICONS[t.type] ?? "⚠"}</span>
                  <div>
                    <div className="text-white text-sm font-bold">{t.name}</div>
                    <div className="text-gray-500 text-xs">{t.type}</div>
                  </div>
                </div>
                <SeverityBadge severity={t.severity} />
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className={`px-2 py-0.5 rounded border text-xs font-bold ${STATUS_STYLES[status] ?? "text-gray-400 border-gray-600"}`}>
                    {status.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Indicator of Compromise</span>
                  <span className="text-red-400 font-mono">{t.ioc}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Affected Systems</span>
                  <span className={t.affectedSystems > 0 ? "text-orange-400 font-bold" : "text-green-400"}>
                    {t.affectedSystems}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">First Seen</span>
                  <span className="text-gray-300">{t.firstSeen}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Seen</span>
                  <span className="text-gray-300">{t.lastSeen}</span>
                </div>
              </div>

              <div className="pt-1 border-t border-gray-800 flex gap-2">
                <button
                  onClick={() => update(t.id, "blocked", `IOC ${t.ioc} blocked`)}
                  disabled={status === "blocked"}
                  className="text-xs text-gray-500 hover:text-red-400 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Block IOC
                </button>
                <span className="text-gray-700">|</span>
                <button
                  onClick={() => update(t.id, "investigating", `${t.name} marked for investigation`)}
                  disabled={status === "investigating"}
                  className="text-xs text-gray-500 hover:text-yellow-400 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Investigate
                </button>
                <span className="text-gray-700">|</span>
                <button
                  onClick={() => update(t.id, "monitoring", `${t.name} resolved — monitoring`)}
                  disabled={status === "monitoring"}
                  className="text-xs text-gray-500 hover:text-green-400 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Mark Resolved
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
