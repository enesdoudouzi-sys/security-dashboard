"use client";
import type { Scan } from "../types";

const STATUS_STYLES: Record<string, string> = {
  completed:  "text-green-400 border-green-800 bg-green-900/30",
  running:    "text-yellow-400 border-yellow-800 bg-yellow-900/30",
  scheduled:  "text-blue-400 border-blue-800 bg-blue-900/30",
  failed:     "text-red-400 border-red-800 bg-red-900/30",
};

function formatDuration(start: string, end: string | null) {
  if (!end) return "In Progress…";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}m ${secs}s`;
}

export function ScansTab({ scans }: { scans: Scan[] }) {
  return (
    <div className="p-6 space-y-4">
      {scans.map((s) => (
        <div key={s.id} className="bg-gray-900 border border-gray-800 rounded-lg p-5">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div>
              <div className="text-white font-bold text-sm">{s.type}</div>
              <div className="text-gray-500 text-xs font-mono">{s.target}</div>
            </div>
            <span className={`ml-auto px-2 py-0.5 rounded border text-xs font-bold uppercase ${STATUS_STYLES[s.status] ?? "text-gray-400"}`}>
              {s.status === "running" && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse mr-1" />
              )}
              {s.status}
            </span>
          </div>

          {s.status !== "scheduled" && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {[
                  { label: "Critical", count: s.critical, color: "text-red-400" },
                  { label: "High",     count: s.high,     color: "text-orange-400" },
                  { label: "Medium",   count: s.medium,   color: "text-yellow-400" },
                  { label: "Low",      count: s.low,      color: "text-blue-400" },
                ].map(({ label, count, color }) => (
                  <div key={label} className="bg-gray-800 rounded p-3 text-center">
                    <div className={`text-2xl font-bold ${color}`}>{count}</div>
                    <div className="text-gray-500 text-xs">{label}</div>
                  </div>
                ))}
              </div>

              {/* simple bar */}
              {s.findings > 0 && (
                <div className="w-full h-2 flex rounded overflow-hidden gap-0.5">
                  {[
                    { count: s.critical, color: "bg-red-500" },
                    { count: s.high,     color: "bg-orange-500" },
                    { count: s.medium,   color: "bg-yellow-500" },
                    { count: s.low,      color: "bg-blue-500" },
                  ].map(({ count, color }) =>
                    count > 0 ? (
                      <div
                        key={color}
                        className={`${color} h-full`}
                        style={{ width: `${(count / s.findings) * 100}%` }}
                      />
                    ) : null
                  )}
                </div>
              )}
            </>
          )}

          <div className="mt-3 flex gap-6 text-xs text-gray-500">
            <span>Started: <span className="text-gray-300">{new Date(s.startTime).toLocaleString("de-DE")}</span></span>
            <span>Duration: <span className="text-gray-300">{formatDuration(s.startTime, s.endTime)}</span></span>
            {s.findings > 0 && <span>Total Findings: <span className="text-white font-bold">{s.findings}</span></span>}
          </div>
        </div>
      ))}
    </div>
  );
}
