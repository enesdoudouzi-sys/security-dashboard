"use client";
import type { NetworkEvent } from "@/types";

const CATEGORY_COLORS: Record<string, string> = {
  "C2 Communication":  "text-red-400",
  "SSH Brute Force":   "text-orange-400",
  "Port Scan":         "text-yellow-400",
  "Reverse Shell":     "text-red-400",
  "Telnet Scan":       "text-yellow-400",
  "Data Exfiltration": "text-red-400",
  "Web Exploit":       "text-orange-400",
  "Lateral Movement":  "text-red-400",
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function NetworkTab({ networkEvents }: { networkEvents: NetworkEvent[] }) {
  const sorted = [...networkEvents].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="p-6 space-y-4">
      <div className="flex gap-6 text-xs text-gray-500 mb-2">
        <span>Total Events: <span className="text-white">{networkEvents.length}</span></span>
        <span>Blocked: <span className="text-green-400">{networkEvents.filter((e) => e.action === "blocked").length}</span></span>
        <span>Allowed: <span className="text-red-400">{networkEvents.filter((e) => e.action === "allowed").length}</span></span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-500 uppercase tracking-widest border-b border-gray-800">
              <th className="text-left py-2 pr-4">Time</th>
              <th className="text-left py-2 pr-4">Source IP</th>
              <th className="text-left py-2 pr-4">Destination</th>
              <th className="text-left py-2 pr-4">Protocol</th>
              <th className="text-left py-2 pr-4">Category</th>
              <th className="text-left py-2 pr-4">Bytes</th>
              <th className="text-left py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((e) => (
              <tr key={e.id} className="border-b border-gray-800/60 hover:bg-gray-800/30 transition-colors">
                <td className="py-2.5 pr-4 text-gray-500 font-mono">{formatTime(e.timestamp)}</td>
                <td className="py-2.5 pr-4 font-mono text-orange-300">{e.srcIp}</td>
                <td className="py-2.5 pr-4 font-mono text-gray-300">
                  {e.dstIp}<span className="text-gray-600">:{e.dstPort ?? "–"}</span>
                </td>
                <td className="py-2.5 pr-4">
                  <span className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-400">{e.protocol}</span>
                </td>
                <td className={`py-2.5 pr-4 font-bold ${CATEGORY_COLORS[e.category] ?? "text-gray-400"}`}>
                  {e.category}
                </td>
                <td className="py-2.5 pr-4 text-gray-400">{formatBytes(e.bytes)}</td>
                <td className="py-2.5">
                  <span className={`uppercase font-bold text-xs px-2 py-0.5 rounded ${
                    e.action === "blocked"
                      ? "bg-green-900/40 text-green-400 border border-green-800"
                      : "bg-red-900/40 text-red-400 border border-red-800"
                  }`}>
                    {e.action}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
